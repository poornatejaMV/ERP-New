from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base

class DeliveryNote(Base):
    __tablename__ = "delivery_notes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=True)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    posting_date = Column(Date)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="Draft") # Draft, Submitted, Cancelled, Return

    customer = relationship("modules.selling.models.Customer")
    # sales_order = relationship("SalesOrder")
    items = relationship("DeliveryNoteItem", back_populates="delivery_note")

class DeliveryNoteItem(Base):
    __tablename__ = "delivery_note_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_note_id = Column(Integer, ForeignKey("delivery_notes.id"))
    item_code = Column(String)
    qty = Column(Float)
    rate = Column(Float)
    amount = Column(Float)

    delivery_note = relationship("DeliveryNote", back_populates="items")
