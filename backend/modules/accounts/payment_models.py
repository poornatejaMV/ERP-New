from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base

class PaymentEntry(Base):
    __tablename__ = "payment_entries"

    id = Column(Integer, primary_key=True, index=True)
    payment_type = Column(String)  # Receive (from customer) or Pay (to supplier)
    party_type = Column(String)  # Customer or Supplier
    party_id = Column(Integer)  # customer_id or supplier_id
    posting_date = Column(Date)
    paid_amount = Column(Float, default=0.0)
    mode_of_payment = Column(String, default="Cash")  # Cash, Bank Transfer, Check, etc.
    reference_no = Column(String, nullable=True)
    reference_date = Column(Date, nullable=True)
    status = Column(String, default="Draft")  # Draft, Submitted, Cancelled
    
    # Link to invoices (optional - for now we track via references)
    references = relationship("PaymentReference", back_populates="payment_entry")

class PaymentReference(Base):
    __tablename__ = "payment_references"

    id = Column(Integer, primary_key=True, index=True)
    payment_entry_id = Column(Integer, ForeignKey("payment_entries.id"))
    reference_doctype = Column(String)  # Sales Invoice or Purchase Invoice
    reference_name = Column(Integer)  # Invoice ID
    allocated_amount = Column(Float, default=0.0)

    payment_entry = relationship("PaymentEntry", back_populates="references")
