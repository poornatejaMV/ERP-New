from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base

class PurchaseReceipt(Base):
    __tablename__ = "purchase_receipts"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    posting_date = Column(Date)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="Draft") # Draft, Submitted, Cancelled, Return

    supplier = relationship("modules.buying.models.Supplier")
    # purchase_order = relationship("PurchaseOrder")
    items = relationship("PurchaseReceiptItem", back_populates="purchase_receipt")

class PurchaseReceiptItem(Base):
    __tablename__ = "purchase_receipt_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_receipt_id = Column(Integer, ForeignKey("purchase_receipts.id"))
    item_code = Column(String)
    qty = Column(Float)
    rate = Column(Float)
    amount = Column(Float)

    purchase_receipt = relationship("PurchaseReceipt", back_populates="items")
