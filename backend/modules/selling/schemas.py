from typing import List, Optional
from pydantic import BaseModel
from datetime import date

class SalesOrderItemBase(BaseModel):
    item_code: str
    qty: float
    rate: float
    amount: float

class SalesOrderItemCreate(SalesOrderItemBase):
    pass

class SalesOrderItem(SalesOrderItemBase):
    id: int
    sales_order_id: int

    class Config:
        from_attributes = True

class SalesOrderBase(BaseModel):
    customer_id: int
    transaction_date: date
    total_amount: float = 0.0
    total_taxes_and_charges: float = 0.0
    grand_total: float = 0.0
    tax_template_id: Optional[int] = None
    status: str = "Draft"
    delivery_status: str = "Not Delivered"
    billing_status: str = "Not Billed"

class SalesOrderCreate(SalesOrderBase):
    items: List[SalesOrderItemCreate]

class SalesOrder(SalesOrderBase):
    id: int
    items: List[SalesOrderItem]

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    customer_name: str
    email: Optional[str] = None
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int

    class Config:
        from_attributes = True

class QuotationItemBase(BaseModel):
    item_code: str
    qty: float
    rate: float
    amount: float

class QuotationItemCreate(QuotationItemBase):
    pass

class QuotationItem(QuotationItemBase):
    id: int
    quotation_id: int

    class Config:
        from_attributes = True

class QuotationBase(BaseModel):
    customer_id: Optional[int] = None
    lead_id: Optional[int] = None
    transaction_date: date
    valid_till: Optional[date] = None
    total_amount: float = 0.0
    total_taxes_and_charges: float = 0.0
    grand_total: float = 0.0
    tax_template_id: Optional[int] = None
    status: str = "Draft"

class QuotationCreate(QuotationBase):
    items: List[QuotationItemCreate]

class Quotation(QuotationBase):
    id: int
    name: Optional[str] = None
    items: List[QuotationItem]

    class Config:
        from_attributes = True
