from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from . import models, schemas

router = APIRouter(
    prefix="/manufacturing",
    tags=["manufacturing"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# BOM Endpoints
@router.post("/boms/", response_model=schemas.BOM)
def create_bom(bom: schemas.BOMCreate, db: Session = Depends(get_db)):
    """Create Bill of Materials"""
    db_bom = models.BOM(
        item_code=bom.item_code,
        bom_name=bom.bom_name or f"BOM-{bom.item_code}",
        quantity=bom.quantity
    )
    db.add(db_bom)
    db.commit()
    db.refresh(db_bom)
    
    # Add BOM Items
    for item_data in bom.items:
        amount = item_data.qty * item_data.rate
        db_item = models.BOMItem(
            bom_id=db_bom.id,
            item_code=item_data.item_code,
            qty=item_data.qty,
            rate=item_data.rate,
            amount=amount
        )
        db.add(db_item)
    
    # Add Operations
    for op_data in bom.operations:
        db_op = models.BOMOperation(
            bom_id=db_bom.id,
            **op_data.dict()
        )
        db.add(db_op)
    
    db.commit()
    db.refresh(db_bom)
    return db_bom

@router.get("/boms/", response_model=List[schemas.BOM])
def read_boms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    boms = db.query(models.BOM).offset(skip).limit(limit).all()
    return boms

@router.get("/boms/{bom_id}", response_model=schemas.BOM)
def read_bom(bom_id: int, db: Session = Depends(get_db)):
    bom = db.query(models.BOM).filter(models.BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="BOM not found")
    return bom

# Work Order Endpoints
@router.post("/work-orders/", response_model=schemas.WorkOrder)
def create_work_order(wo: schemas.WorkOrderCreate, db: Session = Depends(get_db)):
    """Create Work Order for production"""
    db_wo = models.WorkOrder(**wo.dict())
    db.add(db_wo)
    db.commit()
    db.refresh(db_wo)
    
    # If BOM is provided, auto-populate material requirements
    if wo.bom_id:
        bom = db.query(models.BOM).filter(models.BOM.id == wo.bom_id).first()
        if bom:
            # Calculate material requirements based on qty to manufacture
            multiplier = wo.qty_to_manufacture / bom.quantity
            for bom_item in bom.items:
                required_qty = bom_item.qty * multiplier
                db_material = models.WorkOrderMaterial(
                    work_order_id=db_wo.id,
                    item_code=bom_item.item_code,
                    required_qty=required_qty,
                    source_warehouse=wo.warehouse
                )
                db.add(db_material)
            db.commit()
    
    db.refresh(db_wo)
    return db_wo

@router.get("/work-orders/", response_model=List[schemas.WorkOrder])
def read_work_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    work_orders = db.query(models.WorkOrder).offset(skip).limit(limit).all()
    return work_orders

@router.post("/work-orders/{wo_id}/start")
def start_work_order(wo_id: int, db: Session = Depends(get_db)):
    """Start production - Transfer materials to WIP"""
    wo = db.query(models.WorkOrder).filter(models.WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    
    if wo.status != "Draft":
        raise HTTPException(status_code=400, detail="Work Order already started")
    
    # Transfer materials from Source Warehouse to WIP Warehouse
    from modules.stock.router import create_stock_entry_with_ledger
    from modules.stock.models import Item # To get standard rate
    
    material_items = []
    for material in wo.material_requests:
        # Fetch item cost
        item = db.query(Item).filter(Item.item_code == material.item_code).first()
        rate = item.standard_rate if item else 0.0
        
        material_items.append({
            'item_code': material.item_code,
            'qty': material.required_qty,
            'basic_rate': rate
        })
    
    if material_items:
        entry_data = {
            'transaction_date': wo.planned_start_date,
            'purpose': 'Material Transfer',
            'from_warehouse': wo.warehouse, # Source (e.g. Stores)
            'to_warehouse': wo.wip_warehouse, # Target (e.g. Work In Progress)
            'voucher_type': 'Work Order',
            'items': material_items
        }
        create_stock_entry_with_ledger(db, entry_data)
    
    wo.status = "In Progress"
    db.commit()
    
    return {"message": "Work Order started (Materials Transferred to WIP)", "status": wo.status}

@router.post("/work-orders/{wo_id}/complete")
def complete_work_order(wo_id: int, db: Session = Depends(get_db)):
    """Complete production - Consume from WIP and Receive FG"""
    wo = db.query(models.WorkOrder).filter(models.WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    
    if wo.status != "In Progress":
        raise HTTPException(status_code=400, detail="Work Order not in progress")
    
    from modules.stock.router import create_stock_entry_with_ledger
    from modules.stock.models import Item
    
    # 1. Consume Materials from WIP (Material Issue)
    material_items = []
    total_rm_cost = 0.0
    for material in wo.material_requests:
        item = db.query(Item).filter(Item.item_code == material.item_code).first()
        rate = item.standard_rate if item else 0.0
        
        material_items.append({
            'item_code': material.item_code,
            'qty': material.required_qty,
            'basic_rate': rate
        })
        total_rm_cost += (material.required_qty * rate)
        material.consumed_qty = material.required_qty # Update actual consumption
    
    if material_items:
        consume_entry = {
            'transaction_date': wo.planned_start_date,
            'purpose': 'Material Issue',
            'warehouse': wo.wip_warehouse, # Consume from WIP
            'voucher_type': 'Work Order',
            'items': material_items
        }
        create_stock_entry_with_ledger(db, consume_entry)

    # 2. Receive Finished Goods (Material Receipt)
    # Calculate FG Unit Cost
    fg_unit_cost = total_rm_cost / wo.qty_to_manufacture if wo.qty_to_manufacture > 0 else 0.0
    
    entry_data = {
        'transaction_date': wo.planned_start_date,
        'purpose': 'Material Receipt',
        'warehouse': wo.fg_warehouse, # Receive into FG Warehouse
        'voucher_type': 'Work Order',
        'items': [{
            'item_code': wo.production_item,
            'qty': wo.qty_to_manufacture,
            'basic_rate': fg_unit_cost 
        }]
    }
    create_stock_entry_with_ledger(db, entry_data)
    
    wo.qty_manufactured = wo.qty_to_manufacture
    wo.status = "Completed"
    db.commit()
    
    return {"message": "Work Order completed", "qty_manufactured": wo.qty_manufactured}
