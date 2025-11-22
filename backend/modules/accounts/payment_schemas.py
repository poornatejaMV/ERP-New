from typing import List, Optional
from pydantic import BaseModel
from datetime import date

class PaymentReferenceBase(BaseModel):
    reference_doctype: str  # "Sales Invoice" or "Purchase Invoice"
    reference_name: int  # Invoice ID
    allocated_amount: float

class PaymentReferenceCreate(PaymentReferenceBase):
    pass

class PaymentReference(PaymentReferenceBase):
    id: int
    payment_entry_id: int

    class Config:
        from_attributes = True

class PaymentEntryBase(BaseModel):
    payment_type: str  # "Receive" or "Pay"
    party_type: str  # "Customer" or "Supplier"
    party_id: int
    posting_date: date
    paid_amount: float
    mode_of_payment: str = "Cash"
    reference_no: Optional[str] = None
    reference_date: Optional[date] = None
    status: str = "Draft"

class PaymentEntryCreate(PaymentEntryBase):
    references: List[PaymentReferenceCreate] = []

class PaymentEntry(PaymentEntryBase):
    id: int
    references: List[PaymentReference]

    class Config:
        from_attributes = True
