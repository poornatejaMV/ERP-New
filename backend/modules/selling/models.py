from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    orders = relationship("SalesOrder", back_populates="customer")

class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=True)  # Document number
    customer_id = Column(Integer, ForeignKey("customers.id"))
    transaction_date = Column(Date)
    total_amount = Column(Float, default=0.0)
    total_taxes_and_charges = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    tax_template_id = Column(Integer, ForeignKey("sales_tax_templates.id"), nullable=True)
    docstatus = Column(Integer, default=0)  # 0=Draft, 1=Submitted, 2=Cancelled
    status = Column(String, default="Draft") # Draft, Submitted, Cancelled, Completed
    delivery_status = Column(String, default="Not Delivered") # Not Delivered, Partially Delivered, Fully Delivered
    billing_status = Column(String, default="Not Billed") # Not Billed, Partially Billed, Fully Billed
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    submitted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    cancelled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    items = relationship("SalesOrderItem", back_populates="sales_order")

class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id"))
    item_code = Column(String) # Linking loosely to Item for now
    qty = Column(Float, default=1.0)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)

    sales_order = relationship("SalesOrder", back_populates="items")

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True) # Can be null if lead
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    transaction_date = Column(Date)
    valid_till = Column(Date, nullable=True)
    total_amount = Column(Float, default=0.0)
    total_taxes_and_charges = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    tax_template_id = Column(Integer, ForeignKey("sales_tax_templates.id"), nullable=True)
    docstatus = Column(Integer, default=0)
    status = Column(String, default="Draft") # Draft, Submitted, Ordered, Lost, Cancelled
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer")
    items = relationship("QuotationItem", back_populates="quotation")

class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"))
    item_code = Column(String)
    qty = Column(Float, default=1.0)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)

    quotation = relationship("Quotation", back_populates="items")
