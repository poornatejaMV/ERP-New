from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base

class StockEntry(Base):
    __tablename__ = "stock_entries"

    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(Date)
    purpose = Column(String)  # Material Receipt, Material Issue, Material Transfer
    from_warehouse = Column(String, nullable=True)
    to_warehouse = Column(String, nullable=True) # "Material Receipt", "Material Issue", "Material Transfer"

    items = relationship("StockEntryDetail", back_populates="stock_entry")

class StockEntryDetail(Base):
    __tablename__ = "stock_entry_details"

    id = Column(Integer, primary_key=True, index=True)
    stock_entry_id = Column(Integer, ForeignKey("stock_entries.id"))
    item_code = Column(String)
    qty = Column(Float, default=0.0)
    basic_rate = Column(Float, default=0.0)
    serial_no = Column(String, nullable=True) # Newline separated serial numbers
    batch_no = Column(String, nullable=True)

    stock_entry = relationship("StockEntry", back_populates="items")

class StockLedgerEntry(Base):
    __tablename__ = "stock_ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String, index=True)
    warehouse = Column(String, default="Main Store", index=True)
    posting_date = Column(Date)
    posting_time = Column(String, default="00:00:00")
    voucher_type = Column(String) # Stock Entry, Sales Order, Purchase Order, etc.
    voucher_no = Column(Integer)
    actual_qty = Column(Float, default=0.0) # +ve for IN, -ve for OUT
    qty_after_transaction = Column(Float, default=0.0) # Running balance
    stock_uom = Column(String, default="Nos")
    valuation_rate = Column(Float, default=0.0)
    stock_value = Column(Float, default=0.0)
    stock_value_difference = Column(Float, default=0.0)
    serial_no = Column(String, nullable=True) # Newline separated serial numbers
    batch_no = Column(String, nullable=True)

class ItemPrice(Base):
    """Item Price Master"""
    __tablename__ = "item_prices"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String, index=True, nullable=False)
    price_list_id = Column(Integer, ForeignKey("price_lists.id"), nullable=False)
    price_list_rate = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    valid_from = Column(Date, nullable=True)
    valid_upto = Column(Date, nullable=True)
    
    # We need to import PriceList conditionally or use string reference if in same base, 
    # but PriceList is in setup/models. So we just use FK.

class MaterialRequest(Base):
    __tablename__ = "material_requests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=True)
    transaction_date = Column(Date)
    schedule_date = Column(Date)
    material_request_type = Column(String) # Purchase, Material Transfer, Material Issue, Manufacture
    status = Column(String, default="Draft") # Draft, Submitted, Ordered, Issued, Transferred, Cancelled
    docstatus = Column(Integer, default=0)
    
    items = relationship("MaterialRequestItem", back_populates="material_request")

class MaterialRequestItem(Base):
    __tablename__ = "material_request_items"

    id = Column(Integer, primary_key=True, index=True)
    material_request_id = Column(Integer, ForeignKey("material_requests.id"))
    item_code = Column(String)
    qty = Column(Float, default=0.0)
    schedule_date = Column(Date)
    warehouse = Column(String, nullable=True) # Target Warehouse
    ordered_qty = Column(Float, default=0.0)
    received_qty = Column(Float, default=0.0)
    
    material_request = relationship("MaterialRequest", back_populates="items")


class StockReconciliation(Base):
    __tablename__ = "stock_reconciliations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=True)
    posting_date = Column(Date)
    posting_time = Column(String, default="00:00:00")
    purpose = Column(String, default="Stock Reconciliation") # Opening Stock, Stock Reconciliation
    docstatus = Column(Integer, default=0)
    status = Column(String, default="Draft")
    
    items = relationship("StockReconciliationItem", back_populates="reconciliation")

class StockReconciliationItem(Base):
    __tablename__ = "stock_reconciliation_items"

    id = Column(Integer, primary_key=True, index=True)
    reconciliation_id = Column(Integer, ForeignKey("stock_reconciliations.id"))
    item_code = Column(String)
    warehouse = Column(String)
    qty = Column(Float, default=0.0) # Target Qty
    valuation_rate = Column(Float, default=0.0) # Target Rate
    current_qty = Column(Float, default=0.0) # Snapshot
    current_valuation_rate = Column(Float, default=0.0) # Snapshot
    
    reconciliation = relationship("StockReconciliation", back_populates="items")
