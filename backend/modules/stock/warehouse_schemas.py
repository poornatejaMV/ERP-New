from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class WarehouseBase(BaseModel):
    warehouse_name: str
    parent_warehouse_id: Optional[int] = None
    company_id: Optional[int] = None
    is_group: bool = False
    address: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    is_default: bool = False
    is_active: bool = True

class WarehouseCreate(WarehouseBase):
    pass

class Warehouse(WarehouseBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WarehouseWithBalance(Warehouse):
    stock_value: float = 0.0
    item_count: int = 0
