from typing import List, Optional
from pydantic import BaseModel
from datetime import date

class SalesInvoiceItemBase(BaseModel):
    item_code: str
    qty: float
    rate: float
    amount: float

class SalesInvoiceItemCreate(SalesInvoiceItemBase):
    pass

class SalesInvoiceItem(SalesInvoiceItemBase):
    id: int
    sales_invoice_id: int

    class Config:
        from_attributes = True

class SalesInvoiceBase(BaseModel):
    customer_id: int
    sales_order_id: Optional[int] = None
    posting_date: date
    due_date: Optional[date] = None
    total_amount: float = 0.0
    total_taxes_and_charges: float = 0.0
    grand_total: float = 0.0
    outstanding_amount: float = 0.0
    tax_template_id: Optional[int] = None
    status: str = "Draft"

class SalesInvoiceCreate(SalesInvoiceBase):
    items: List[SalesInvoiceItemCreate]

class SalesInvoice(SalesInvoiceBase):
    id: int
    items: List[SalesInvoiceItem]

    class Config:
        from_attributes = True
