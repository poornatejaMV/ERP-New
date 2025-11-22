from typing import List, Optional
from pydantic import BaseModel

class ItemBase(BaseModel):
    item_code: str
    item_name: str
    description: Optional[str] = None
    standard_rate: float = 0.0
    uom: Optional[str] = "Nos"
    is_stock_item: bool = True
    has_serial_no: bool = False
    has_batch_no: bool = False

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
