from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# Sales Tax Template
class SalesTaxTemplateDetailBase(BaseModel):
    account_id: int
    rate: float
    description: Optional[str] = None

class SalesTaxTemplateDetailCreate(SalesTaxTemplateDetailBase):
    pass

class SalesTaxTemplateDetail(SalesTaxTemplateDetailBase):
    id: int
    parent_id: int
    
    class Config:
        from_attributes = True

class SalesTaxTemplateBase(BaseModel):
    title: str
    company_id: Optional[int] = None
    is_default: bool = False

class SalesTaxTemplateCreate(SalesTaxTemplateBase):
    taxes: List[SalesTaxTemplateDetailCreate]

class SalesTaxTemplate(SalesTaxTemplateBase):
    id: int
    created_at: datetime
    taxes: List[SalesTaxTemplateDetail]
    
    class Config:
        from_attributes = True

# Purchase Tax Template
class PurchaseTaxTemplateDetailBase(BaseModel):
    account_id: int
    rate: float
    description: Optional[str] = None

class PurchaseTaxTemplateDetailCreate(PurchaseTaxTemplateDetailBase):
    pass

class PurchaseTaxTemplateDetail(PurchaseTaxTemplateDetailBase):
    id: int
    parent_id: int
    
    class Config:
        from_attributes = True

class PurchaseTaxTemplateBase(BaseModel):
    title: str
    company_id: Optional[int] = None
    is_default: bool = False

class PurchaseTaxTemplateCreate(PurchaseTaxTemplateBase):
    taxes: List[PurchaseTaxTemplateDetailCreate]

class PurchaseTaxTemplate(PurchaseTaxTemplateBase):
    id: int
    created_at: datetime
    taxes: List[PurchaseTaxTemplateDetail]
    
    class Config:
        from_attributes = True

