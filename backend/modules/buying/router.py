from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from . import models, schemas
from . import invoice_schemas

router = APIRouter(
    prefix="/buying",
    tags=["buying"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/suppliers/", response_model=schemas.Supplier)
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = models.Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.get("/suppliers/", response_model=List[schemas.Supplier])
def read_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    suppliers = db.query(models.Supplier).offset(skip).limit(limit).all()
    return suppliers

@router.post("/orders/", response_model=schemas.PurchaseOrder)
def create_purchase_order(order: schemas.PurchaseOrderCreate, db: Session = Depends(get_db)):
    # Calculate total amount from items
    total_amount = sum(item.amount for item in order.items)
    
    # Calculate Taxes
    total_taxes_and_charges = 0.0
    grand_total = total_amount
    
    if order.tax_template_id:
        from modules.accounts.tax_models import PurchaseTaxTemplate
        template = db.query(PurchaseTaxTemplate).filter(PurchaseTaxTemplate.id == order.tax_template_id).first()
        if template:
            for tax in template.taxes:
                total_taxes_and_charges += (total_amount * tax.rate) / 100.0
    
    grand_total = total_amount + total_taxes_and_charges

    db_order = models.PurchaseOrder(
        supplier_id=order.supplier_id,
        transaction_date=order.transaction_date,
        total_amount=total_amount,
        total_taxes_and_charges=total_taxes_and_charges,
        grand_total=grand_total,
        tax_template_id=order.tax_template_id,
        status="Draft"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for item in order.items:
        db_item = models.PurchaseOrderItem(
            purchase_order_id=db_order.id,
            **item.dict()
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/orders/", response_model=List[schemas.PurchaseOrder])
def read_purchase_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = db.query(models.PurchaseOrder).offset(skip).limit(limit).all()
    return orders

@router.post("/orders/{order_id}/submit")
def submit_purchase_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "Draft":
        raise HTTPException(status_code=400, detail="Order already submitted")
    
    order.status = "Submitted"
    db.commit()
    return {"status": "Submitted"}

@router.post("/orders/{order_id}/make-receipt")
def make_purchase_receipt(order_id: int, db: Session = Depends(get_db)):
    # 1. Fetch Order
    order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "Submitted":
        raise HTTPException(status_code=400, detail="Order must be Submitted first")
    if order.receipt_status == "Fully Received":
        raise HTTPException(status_code=400, detail="Order already received")

    # 2. Create Purchase Receipt
    from .receipt_models import PurchaseReceipt, PurchaseReceiptItem
    
    receipt = PurchaseReceipt(
        purchase_order_id=order.id,
        supplier_id=order.supplier_id,
        posting_date=order.transaction_date,
        total_amount=order.total_amount
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)

    for item in order.items:
        receipt_item = PurchaseReceiptItem(
            purchase_receipt_id=receipt.id,
            item_code=item.item_code,
            qty=item.qty,
            rate=item.rate,
            amount=item.amount
        )
        db.add(receipt_item)
    
    # 3. Create Stock Entry (Material Receipt) with Ledger
    from modules.stock.router import create_stock_entry_with_ledger
    
    stock_entry_data = {
        'transaction_date': order.transaction_date,
        'purpose': "Material Receipt",
        'voucher_type': "Purchase Receipt",
        'warehouse': "Stores", # Default to Stores for now
        'items': [{
            'item_code': item.item_code,
            'qty': item.qty,
            'basic_rate': item.rate
        } for item in order.items]
    }
    stock_entry = create_stock_entry_with_ledger(db, stock_entry_data)
    
    # 4. Update Order Status
    order.receipt_status = "Fully Received"
    db.commit()
    
    return {"message": "Purchase Receipt created", "receipt_id": receipt.id, "stock_entry_id": stock_entry.id}

@router.post("/orders/{order_id}/make-invoice")
def make_purchase_invoice(order_id: int, db: Session = Depends(get_db)):
    # 1. Fetch Order
    order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "Submitted":
        raise HTTPException(status_code=400, detail="Order must be Submitted first")
    if order.billing_status == "Fully Billed":
        raise HTTPException(status_code=400, detail="Order already billed")

    # 2. Create Purchase Invoice
    from .models import PurchaseInvoice, PurchaseInvoiceItem
    from datetime import timedelta
    
    invoice = PurchaseInvoice(
        supplier_id=order.supplier_id,
        purchase_order_id=order.id,
        posting_date=order.transaction_date,
        due_date=order.transaction_date + timedelta(days=30),  # 30 days payment term
        total_amount=order.total_amount,
        total_taxes_and_charges=order.total_taxes_and_charges,
        grand_total=order.grand_total,
        outstanding_amount=order.grand_total,
        tax_template_id=order.tax_template_id,
        status="Submitted"
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    for item in order.items:
        invoice_item = PurchaseInvoiceItem(
            purchase_invoice_id=invoice.id,
            item_code=item.item_code,
            qty=item.qty,
            rate=item.rate,
            amount=item.amount
        )
        db.add(invoice_item)
    
    # 3. Create Journal Entry (for accounting)
    from modules.accounts.models import JournalEntry, JournalEntryAccount
    
    je = JournalEntry(
        posting_date=order.transaction_date,
        title=f"Purchase Invoice #{invoice.id}",
        total_debit=order.grand_total,
        total_credit=order.grand_total
    )
    db.add(je)
    db.commit()
    db.refresh(je)

    # Debit Purchases (Expense) - account_id=3 for demo
    db.add(JournalEntryAccount(journal_entry_id=je.id, account_id=3, debit=order.total_amount, credit=0))
    # Credit Creditors (Payable) - account_id=4 for demo
    db.add(JournalEntryAccount(journal_entry_id=je.id, account_id=4, debit=0, credit=order.grand_total))
    
    # Debit Taxes (Input Tax is an Asset/Expense)
    if order.tax_template_id:
        from modules.accounts.tax_models import PurchaseTaxTemplate
        template = db.query(PurchaseTaxTemplate).filter(PurchaseTaxTemplate.id == order.tax_template_id).first()
        if template:
            for tax in template.taxes:
                tax_amt = (order.total_amount * tax.rate) / 100.0
                if tax_amt > 0:
                    db.add(JournalEntryAccount(journal_entry_id=je.id, account_id=tax.account_id, debit=tax_amt, credit=0))

    # 4. Create Payment Ledger Entry (Payable)
    from modules.accounts.payment_ledger_utils import make_payment_ledger_entry
    supplier = db.query(models.Supplier).filter(models.Supplier.id == order.supplier_id).first()
    party_name = supplier.supplier_name if supplier else "Unknown"
    
    make_payment_ledger_entry(
        db=db,
        posting_date=order.transaction_date,
        account_type="Payable",
        account_id=4, # Creditors
        party_type="Supplier",
        party=party_name,
        voucher_type="Purchase Invoice",
        voucher_no=str(invoice.id),
        amount=-order.grand_total, # Negative for Payable (Credit balance)
        company_id=1
    )

    # 5. Update Order Status
    order.billing_status = "Fully Billed"
    if order.receipt_status == "Fully Received":
        order.status = "Completed"
        
    db.commit()
    
    return {"message": "Purchase Invoice created", "invoice_id": invoice.id, "journal_entry_id": je.id}

# Purchase Invoice CRUD
@router.post("/invoices/", response_model=invoice_schemas.PurchaseInvoice)
def create_purchase_invoice(invoice: invoice_schemas.PurchaseInvoiceCreate, db: Session = Depends(get_db)):
    from .models import PurchaseInvoice, PurchaseInvoiceItem
    
    # Calculate total amount from items
    total_amount = sum(item.amount for item in invoice.items)
    
    # Calculate Taxes
    total_taxes_and_charges = 0.0
    grand_total = total_amount
    
    if invoice.tax_template_id:
        from modules.accounts.tax_models import PurchaseTaxTemplate
        template = db.query(PurchaseTaxTemplate).filter(PurchaseTaxTemplate.id == invoice.tax_template_id).first()
        if template:
            for tax in template.taxes:
                total_taxes_and_charges += (total_amount * tax.rate) / 100.0
    
    grand_total = total_amount + total_taxes_and_charges
    
    # Create Invoice Dict and override totals
    invoice_data = invoice.dict(exclude={'items'})
    invoice_data['total_amount'] = total_amount
    invoice_data['total_taxes_and_charges'] = total_taxes_and_charges
    invoice_data['grand_total'] = grand_total
    invoice_data['outstanding_amount'] = grand_total
    
    db_invoice = PurchaseInvoice(**invoice_data)
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    for item_data in invoice.items:
        db_item = PurchaseInvoiceItem(
            purchase_invoice_id=db_invoice.id,
            **item_data.dict()
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

# Import Return Logic
from .return_logic import create_purchase_return, submit_purchase_return

@router.post("/invoices/{invoice_id}/return")
def create_return_endpoint(invoice_id: int, db: Session = Depends(get_db)):
    return create_purchase_return(invoice_id, db)

@router.post("/invoices/{invoice_id}/submit-return")
def submit_return_endpoint(invoice_id: int, db: Session = Depends(get_db)):
    return submit_purchase_return(invoice_id, db)

@router.get("/invoices/", response_model=List[invoice_schemas.PurchaseInvoice])
def read_purchase_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    from .models import PurchaseInvoice
    invoices = db.query(PurchaseInvoice).offset(skip).limit(limit).all()
    return invoices

@router.get("/invoices/{invoice_id}", response_model=invoice_schemas.PurchaseInvoice)
def read_purchase_invoice(invoice_id: int, db: Session = Depends(get_db)):
    from .models import PurchaseInvoice
    invoice = db.query(PurchaseInvoice).filter(PurchaseInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice
