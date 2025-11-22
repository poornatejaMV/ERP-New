from typing import List, Optional
from pydantic import BaseModel
from datetime import date

class PurchaseInvoiceItemBase(BaseModel):
    item_code: str
    qty: float
    rate: float
    amount: float

class PurchaseInvoiceItemCreate(PurchaseInvoiceItemBase):
    pass

class PurchaseInvoiceItem(PurchaseInvoiceItemBase):
    id: int
    purchase_invoice_id: int

    class Config:
        from_attributes = True

class PurchaseInvoiceBase(BaseModel):
    supplier_id: int
    purchase_order_id: Optional[int] = None
    posting_date: date
    due_date: Optional[date] = None
    total_amount: float = 0.0
    grand_total: float = 0.0
    outstanding_amount: float = 0.0
    status: str = "Draft"

class PurchaseInvoiceCreate(PurchaseInvoiceBase):
    items: List[PurchaseInvoiceItemCreate]

class PurchaseInvoice(PurchaseInvoiceBase):
    id: int
    items: List[PurchaseInvoiceItem]

    class Config:
        from_attributes = True
