from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import date

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    orders = relationship("PurchaseOrder", back_populates="supplier")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    transaction_date = Column(Date)
    total_amount = Column(Float, default=0.0)
    total_taxes_and_charges = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    tax_template_id = Column(Integer, ForeignKey("purchase_tax_templates.id"), nullable=True)
    status = Column(String, default="Draft") # Draft, Submitted, Cancelled, Completed
    receipt_status = Column(String, default="Not Received") # Not Received, Partially Received, Fully Received
    billing_status = Column(String, default="Not Billed") # Not Billed, Partially Billed, Fully Billed
    
    supplier = relationship("Supplier", back_populates="orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    item_code = Column(String)
    qty = Column(Float, default=1.0)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)

    purchase_order = relationship("PurchaseOrder", back_populates="items")

class PurchaseInvoice(Base):
    __tablename__ = "purchase_invoices"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    posting_date = Column(Date)
    due_date = Column(Date, nullable=True)
    total_amount = Column(Float, default=0.0)
    total_taxes_and_charges = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    outstanding_amount = Column(Float, default=0.0)
    tax_template_id = Column(Integer, ForeignKey("purchase_tax_templates.id"), nullable=True)
    status = Column(String, default="Draft") # Draft, Submitted, Paid, Cancelled, Return

    # Return fields
    is_return = Column(Boolean, default=False)
    return_against = Column(Integer, nullable=True) # ID of original invoice

    supplier = relationship("Supplier")
    # purchase_order = relationship("PurchaseOrder") # Optional link
    items = relationship("PurchaseInvoiceItem", back_populates="purchase_invoice")

class PurchaseInvoiceItem(Base):
    __tablename__ = "purchase_invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_invoice_id = Column(Integer, ForeignKey("purchase_invoices.id"))
    item_code = Column(String)
    qty = Column(Float)
    rate = Column(Float)
    amount = Column(Float)

    purchase_invoice = relationship("PurchaseInvoice", back_populates="items")
