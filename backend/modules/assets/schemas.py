from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class AssetCategoryBase(BaseModel):
    category_name: str
    description: Optional[str] = None
    company_id: Optional[int] = None
    fixed_asset_account_id: Optional[int] = None
    accumulated_depreciation_account_id: Optional[int] = None
    depreciation_expense_account_id: Optional[int] = None

class AssetCategoryCreate(AssetCategoryBase):
    pass

class AssetCategory(AssetCategoryBase):
    id: int
    
    class Config:
        from_attributes = True

class AssetBase(BaseModel):
    asset_name: str
    category_id: int
    company_id: int
    purchase_date: date
    purchase_amount: float
    additional_cost: float = 0.0
    depreciation_method: str = "Straight Line"
    frequency_of_depreciation: int = 12
    total_number_of_depreciations: int = 0
    depreciation_start_date: Optional[date] = None
    rate_of_depreciation: Optional[float] = None
    expected_value_after_useful_life: float = 0.0
    purchase_invoice_id: Optional[int] = None
    purchase_order_id: Optional[int] = None
    location: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class Asset(AssetBase):
    id: int
    asset_number: Optional[str] = None
    total_asset_cost: float
    next_depreciation_date: Optional[date] = None
    value_after_depreciation: float
    accumulated_depreciation: float
    total_number_of_booked_depreciations: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AssetDepreciationScheduleBase(BaseModel):
    asset_id: int
    schedule_date: date
    depreciation_amount: float
    accumulated_depreciation: float = 0.0
    value_after_depreciation: float = 0.0

class AssetDepreciationScheduleCreate(AssetDepreciationScheduleBase):
    pass

class AssetDepreciationSchedule(AssetDepreciationScheduleBase):
    id: int
    journal_entry_id: Optional[int] = None
    status: str
    posted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class DepreciationCalculationRequest(BaseModel):
    asset_id: int
    as_on_date: date

class AssetDisposalRequest(BaseModel):
    asset_id: int
    disposal_date: date
    disposal_type: str  # Sold, Scrapped
    disposal_amount: float = 0.0
    notes: Optional[str] = None

