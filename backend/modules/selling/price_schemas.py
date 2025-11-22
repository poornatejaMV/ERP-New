from typing import Optional
from pydantic import BaseModel
from datetime import date

class PriceListBase(BaseModel):
    price_list_name: str
    currency: str = "USD"
    buying: bool = False
    selling: bool = False
    enabled: bool = True
    is_default: bool = False

class PriceListCreate(PriceListBase):
    pass

class PriceList(PriceListBase):
    id: int

    class Config:
        from_attributes = True

class ItemPriceBase(BaseModel):
    item_code: str
    price_list_id: int
    rate: float
    valid_from: Optional[date] = None

class ItemPriceCreate(ItemPriceBase):
    pass

class ItemPrice(ItemPriceBase):
    id: int

    class Config:
        from_attributes = True

