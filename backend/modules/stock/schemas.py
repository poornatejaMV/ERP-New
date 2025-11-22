from typing import List, Optional
from pydantic import BaseModel
from datetime import date

class StockEntryDetailBase(BaseModel):
    item_code: str
    qty: float
    basic_rate: float
    serial_no: Optional[str] = None
    batch_no: Optional[str] = None

class StockEntryDetailCreate(StockEntryDetailBase):
    pass

class StockEntryDetail(StockEntryDetailBase):
    id: int
    stock_entry_id: int

    class Config:
        from_attributes = True

class StockEntryBase(BaseModel):
    transaction_date: date
    purpose: str  # "Material Receipt", "Material Issue", "Material Transfer"
    from_warehouse: Optional[str] = None
    to_warehouse: Optional[str] = None
    warehouse: Optional[str] = "Main Store"  # For receipt/issue

class StockEntryCreate(StockEntryBase):
    items: List[StockEntryDetailCreate]

class StockEntry(StockEntryBase):
    id: int
    items: List[StockEntryDetail]

    class Config:
        from_attributes = True

class StockLedgerEntry(BaseModel):
    id: int
    item_code: str
    warehouse: str
    posting_date: date
    voucher_type: str
    voucher_no: int
    actual_qty: float
    qty_after_transaction: float
    stock_uom: str
    valuation_rate: float
    stock_value: float
    serial_no: Optional[str] = None
    batch_no: Optional[str] = None

    class Config:
        from_attributes = True

# Serial No and Batch Schemas
class SerialNoBase(BaseModel):
    serial_no: str
    item_code: str
    warehouse: Optional[str] = None
    status: str = "Active"
    purchase_date: Optional[date] = None
    warranty_expiry_date: Optional[date] = None

class SerialNoCreate(SerialNoBase):
    pass

class SerialNo(SerialNoBase):
    id: int
    created_at: date # datetime converted to date for simplicity or string
    updated_at: date

    class Config:
        from_attributes = True

class BatchBase(BaseModel):
    batch_id: str
    item_code: str
    expiry_date: Optional[date] = None
    description: Optional[str] = None

class BatchCreate(BatchBase):
    pass

class Batch(BatchBase):
    id: int
    created_at: date
    updated_at: date

    class Config:
        from_attributes = True


class ItemPriceBase(BaseModel):
    item_code: str
    price_list_id: int
    price_list_rate: float
    currency: str = "USD"
    valid_from: Optional[date] = None
    valid_upto: Optional[date] = None

class ItemPriceCreate(ItemPriceBase):
    pass

class ItemPrice(ItemPriceBase):
    id: int
    
    class Config:
        from_attributes = True

class MaterialRequestItemBase(BaseModel):
    item_code: str
    qty: float
    schedule_date: date
    warehouse: Optional[str] = None

class MaterialRequestItemCreate(MaterialRequestItemBase):
    pass

class MaterialRequestItem(MaterialRequestItemBase):
    id: int
    material_request_id: int
    ordered_qty: float = 0.0
    received_qty: float = 0.0

    class Config:
        from_attributes = True

class MaterialRequestBase(BaseModel):
    transaction_date: date
    schedule_date: date
    material_request_type: str
    status: str = "Draft"

class MaterialRequestCreate(MaterialRequestBase):
    items: List[MaterialRequestItemCreate]

class MaterialRequest(MaterialRequestBase):
    id: int
    name: Optional[str] = None
    items: List[MaterialRequestItem]

    class Config:
        from_attributes = True

class StockReconciliationItemBase(BaseModel):
    item_code: str
    warehouse: str
    qty: float
    valuation_rate: float

class StockReconciliationItemCreate(StockReconciliationItemBase):
    pass

class StockReconciliationItem(StockReconciliationItemBase):
    id: int
    stock_reconciliation_id: int
    current_qty: float = 0.0
    current_valuation_rate: float = 0.0

    class Config:
        from_attributes = True

class StockReconciliationBase(BaseModel):
    posting_date: date
    purpose: str = "Stock Reconciliation"
    status: str = "Draft"

class StockReconciliationCreate(StockReconciliationBase):
    items: List[StockReconciliationItemCreate]

class StockReconciliation(StockReconciliationBase):
    id: int
    name: Optional[str] = None
    items: List[StockReconciliationItem]

    class Config:
        from_attributes = True

class StockReconciliationItemBase(BaseModel):
    item_code: str
    warehouse: str
    qty: float
    valuation_rate: float = 0.0

class StockReconciliationItemCreate(StockReconciliationItemBase):
    pass

class StockReconciliationItem(StockReconciliationItemBase):
    id: int
    stock_reconciliation_id: int
    current_qty: float = 0.0
    current_valuation_rate: float = 0.0

    class Config:
        from_attributes = True

class StockReconciliationBase(BaseModel):
    posting_date: date
    purpose: str = "Stock Reconciliation"
    status: str = "Draft"

class StockReconciliationCreate(StockReconciliationBase):
    items: List[StockReconciliationItemCreate]

class StockReconciliation(StockReconciliationBase):
    id: int
    name: Optional[str] = None
    items: List[StockReconciliationItem]

    class Config:
        from_attributes = True

class StockReconciliationItemBase(BaseModel):
    item_code: str
    warehouse: str
    qty: float
    valuation_rate: float

class StockReconciliationItemCreate(StockReconciliationItemBase):
    pass

class StockReconciliationItem(StockReconciliationItemBase):
    id: int
    reconciliation_id: int
    current_qty: float
    current_valuation_rate: float

    class Config:
        from_attributes = True

class StockReconciliationBase(BaseModel):
    posting_date: date
    posting_time: str = "00:00:00"
    purpose: str = "Stock Reconciliation"

class StockReconciliationCreate(StockReconciliationBase):
    items: List[StockReconciliationItemCreate]

class StockReconciliation(StockReconciliationBase):
    id: int
    name: Optional[str] = None
    status: str
    items: List[StockReconciliationItem]

    class Config:
        from_attributes = True
