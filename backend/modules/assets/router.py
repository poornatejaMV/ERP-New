from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from core.auth import get_current_active_user
from core.numbering import get_next_number
from models import User
from . import models, schemas
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
import math

router = APIRouter(
    prefix="/assets",
    tags=["assets"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Asset Categories
@router.post("/categories/", response_model=schemas.AssetCategory)
def create_asset_category(
    category: schemas.AssetCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new asset category"""
    db_category = models.AssetCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/categories/", response_model=List[schemas.AssetCategory])
def read_asset_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all asset categories"""
    return db.query(models.AssetCategory).offset(skip).limit(limit).all()

@router.get("/categories/{category_id}", response_model=schemas.AssetCategory)
def read_asset_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific asset category"""
    category = db.query(models.AssetCategory).filter(models.AssetCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Asset category not found")
    return category

# Assets
@router.post("/", response_model=schemas.Asset)
def create_asset(
    asset: schemas.AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new asset"""
    # Generate asset number
    asset_number = get_next_number(db, "Asset", date=asset.purchase_date)
    
    # Calculate total asset cost
    total_asset_cost = asset.purchase_amount + asset.additional_cost
    
    # Calculate depreciation rate if not provided
    rate = asset.rate_of_depreciation
    if not rate and asset.total_number_of_depreciations > 0:
        if asset.depreciation_method == "Straight Line":
            # Straight Line: (Cost - Salvage) / Useful Life
            depreciable_amount = total_asset_cost - asset.expected_value_after_useful_life
            if depreciable_amount > 0 and asset.total_number_of_depreciations > 0:
                annual_depreciation = depreciable_amount / (asset.total_number_of_depreciations * asset.frequency_of_depreciation / 12)
                rate = (annual_depreciation / total_asset_cost) * 100
        elif asset.depreciation_method == "Written Down Value":
            # WDV: Rate = 100 * (1 - (Salvage/Cost)^(1/Years))
            if asset.expected_value_after_useful_life > 0 and total_asset_cost > 0:
                years = (asset.total_number_of_depreciations * asset.frequency_of_depreciation) / 12
                if years > 0:
                    value_ratio = asset.expected_value_after_useful_life / total_asset_cost
                    rate = 100 * (1 - math.pow(value_ratio, 1.0 / years))
    
    # Set next depreciation date
    next_dep_date = asset.depreciation_start_date if asset.depreciation_start_date else asset.purchase_date
    
    # Prepare asset data, excluding rate_of_depreciation from dict to avoid duplicate
    asset_data = asset.dict()
    asset_data.pop('rate_of_depreciation', None)  # Remove if present to avoid duplicate
    
    db_asset = models.Asset(
        **asset_data,
        asset_number=asset_number,
        total_asset_cost=total_asset_cost,
        rate_of_depreciation=rate,
        next_depreciation_date=next_dep_date,
        value_after_depreciation=total_asset_cost,
        accumulated_depreciation=0.0
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.get("/", response_model=List[schemas.Asset])
def read_assets(
    skip: int = 0,
    limit: int = 100,
    company_id: int = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Get all assets"""
    query = db.query(models.Asset)
    if company_id:
        query = query.filter(models.Asset.company_id == company_id)
    if status:
        query = query.filter(models.Asset.status == status)
    return query.order_by(models.Asset.purchase_date.desc()).offset(skip).limit(limit).all()

@router.get("/{asset_id}", response_model=schemas.Asset)
def read_asset(
    asset_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific asset"""
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.post("/{asset_id}/submit")
def submit_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submit an asset (make it active)"""
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.status != "Draft":
        raise HTTPException(status_code=400, detail="Asset is already submitted")
    
    asset.status = "Submitted"
    db.commit()
    return {"message": "Asset submitted successfully", "status": asset.status}

@router.post("/{asset_id}/calculate-depreciation")
def calculate_depreciation_schedule(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Calculate and create depreciation schedule for an asset"""
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.status == "Draft":
        raise HTTPException(status_code=400, detail="Asset must be submitted first")
    
    if not asset.depreciation_start_date:
        raise HTTPException(status_code=400, detail="Depreciation start date is required")
    
    # Delete existing draft schedules
    db.query(models.AssetDepreciationSchedule).filter(
        models.AssetDepreciationSchedule.asset_id == asset_id,
        models.AssetDepreciationSchedule.status == "Draft"
    ).delete()
    
    # Calculate depreciation schedule
    schedules = []
    current_value = asset.total_asset_cost
    accumulated = 0.0
    schedule_date = asset.depreciation_start_date
    
    for i in range(asset.total_number_of_depreciations):
        if asset.depreciation_method == "Straight Line":
            # Straight Line: (Cost - Salvage) / Number of Depreciations
            depreciable_amount = asset.total_asset_cost - asset.expected_value_after_useful_life
            depreciation_amount = depreciable_amount / asset.total_number_of_depreciations
        elif asset.depreciation_method == "Written Down Value":
            # WDV: Current Value * Rate / 100
            depreciation_amount = current_value * (asset.rate_of_depreciation / 100)
            # Don't depreciate below salvage value
            if current_value - depreciation_amount < asset.expected_value_after_useful_life:
                depreciation_amount = current_value - asset.expected_value_after_useful_life
        else:
            # Default to Straight Line
            depreciable_amount = asset.total_asset_cost - asset.expected_value_after_useful_life
            depreciation_amount = depreciable_amount / asset.total_number_of_depreciations
        
        accumulated += depreciation_amount
        current_value -= depreciation_amount
        
        # Don't create schedule if amount is negligible
        if depreciation_amount < 0.01:
            break
        
        schedule = models.AssetDepreciationSchedule(
            asset_id=asset_id,
            schedule_date=schedule_date,
            depreciation_amount=round(depreciation_amount, 2),
            accumulated_depreciation=round(accumulated, 2),
            value_after_depreciation=round(current_value, 2)
        )
        db.add(schedule)
        schedules.append(schedule)
        
        # Move to next period
        schedule_date = schedule_date + relativedelta(months=asset.frequency_of_depreciation)
    
    db.commit()
    
    # Update asset next depreciation date
    if schedules:
        asset.next_depreciation_date = schedules[0].schedule_date
    
    db.commit()
    return {"message": f"Created {len(schedules)} depreciation schedules", "schedules": len(schedules)}

@router.get("/{asset_id}/depreciation-schedules", response_model=List[schemas.AssetDepreciationSchedule])
def get_depreciation_schedules(
    asset_id: int,
    db: Session = Depends(get_db)
):
    """Get depreciation schedules for an asset"""
    schedules = db.query(models.AssetDepreciationSchedule).filter(
        models.AssetDepreciationSchedule.asset_id == asset_id
    ).order_by(models.AssetDepreciationSchedule.schedule_date).all()
    return schedules

@router.post("/{asset_id}/post-depreciation/{schedule_id}")
def post_depreciation_entry(
    asset_id: int,
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Post a depreciation entry (create journal entry)"""
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    schedule = db.query(models.AssetDepreciationSchedule).filter(
        models.AssetDepreciationSchedule.id == schedule_id,
        models.AssetDepreciationSchedule.asset_id == asset_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Depreciation schedule not found")
    
    if schedule.status == "Posted":
        raise HTTPException(status_code=400, detail="Depreciation already posted")
    
    # Get accounts from category
    category = asset.category
    if not category:
        raise HTTPException(status_code=400, detail="Asset category not found")
    
    if not category.depreciation_expense_account_id or not category.accumulated_depreciation_account_id:
        raise HTTPException(status_code=400, detail="Depreciation accounts not configured in category")
    
    # Create Journal Entry
    from modules.accounts.models import JournalEntry, JournalEntryAccount
    
    je = JournalEntry(
        posting_date=schedule.schedule_date,
        title=f"Depreciation - {asset.asset_name}",
        total_debit=schedule.depreciation_amount,
        total_credit=schedule.depreciation_amount,
        status="Submitted"
    )
    db.add(je)
    db.commit()
    db.refresh(je)
    
    # Debit Depreciation Expense
    db.add(JournalEntryAccount(
        journal_entry_id=je.id,
        account_id=category.depreciation_expense_account_id,
        debit=schedule.depreciation_amount,
        credit=0
    ))
    
    # Credit Accumulated Depreciation
    db.add(JournalEntryAccount(
        journal_entry_id=je.id,
        account_id=category.accumulated_depreciation_account_id,
        debit=0,
        credit=schedule.depreciation_amount
    ))
    
    # Update schedule
    schedule.journal_entry_id = je.id
    schedule.status = "Posted"
    schedule.posted_at = datetime.utcnow()
    
    # Update asset
    asset.accumulated_depreciation = schedule.accumulated_depreciation
    asset.value_after_depreciation = schedule.value_after_depreciation
    asset.total_number_of_booked_depreciations += 1
    
    # Update next depreciation date
    next_schedule = db.query(models.AssetDepreciationSchedule).filter(
        models.AssetDepreciationSchedule.asset_id == asset_id,
        models.AssetDepreciationSchedule.status == "Draft"
    ).order_by(models.AssetDepreciationSchedule.schedule_date).first()
    
    if next_schedule:
        asset.next_depreciation_date = next_schedule.schedule_date
    else:
        asset.next_depreciation_date = None
        asset.status = "Fully Depreciated"
    
    db.commit()
    return {"message": "Depreciation posted successfully", "journal_entry_id": je.id}

@router.post("/{asset_id}/dispose")
def dispose_asset(
    asset_id: int,
    disposal: schemas.AssetDisposalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Dispose of an asset (Sold or Scrapped)"""
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.status in ["Sold", "Scrapped"]:
        raise HTTPException(status_code=400, detail="Asset already disposed")
    
    # Create Journal Entry for disposal
    from modules.accounts.models import JournalEntry, JournalEntryAccount
    
    category = asset.category
    if not category:
        raise HTTPException(status_code=400, detail="Asset category not found")
    
    # Calculate profit/loss
    book_value = asset.value_after_depreciation
    disposal_amount = disposal.disposal_amount
    profit_loss = disposal_amount - book_value
    
    # Create Journal Entry
    je = JournalEntry(
        posting_date=disposal.disposal_date,
        title=f"Asset Disposal - {asset.asset_name}",
        total_debit=book_value + max(0, profit_loss),
        total_credit=book_value + max(0, profit_loss),
        status="Submitted"
    )
    db.add(je)
    db.commit()
    db.refresh(je)
    
    # Debit Accumulated Depreciation (to clear it)
    if asset.accumulated_depreciation > 0:
        db.add(JournalEntryAccount(
            journal_entry_id=je.id,
            account_id=category.accumulated_depreciation_account_id,
            debit=asset.accumulated_depreciation,
            credit=0
        ))
    
    # Debit Cash/Bank (if sold) or Loss on Disposal
    if disposal.disposal_type == "Sold" and disposal_amount > 0:
        # Assume cash account (account_id=5) - should be configurable
        db.add(JournalEntryAccount(
            journal_entry_id=je.id,
            account_id=5,  # Cash account
            debit=disposal_amount,
            credit=0
        ))
    
    # Credit Fixed Asset Account
    db.add(JournalEntryAccount(
        journal_entry_id=je.id,
        account_id=category.fixed_asset_account_id,
        debit=0,
        credit=asset.total_asset_cost
    ))
    
    # Profit/Loss entry
    if profit_loss != 0:
        # This should go to a gain/loss account - simplified for now
        # In production, you'd have a proper disposal account
        pass
    
    # Update asset status
    asset.status = "Sold" if disposal.disposal_type == "Sold" else "Scrapped"
    asset.value_after_depreciation = 0.0
    
    db.commit()
    return {"message": f"Asset disposed ({disposal.disposal_type})", "journal_entry_id": je.id}

