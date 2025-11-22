from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base

class SalesInvoice(Base):
    __tablename__ = "sales_invoices"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=True)
    posting_date = Column(Date)
    due_date = Column(Date, nullable=True)
    total_amount = Column(Float, default=0.0)
    total_taxes_and_charges = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    outstanding_amount = Column(Float, default=0.0)
    tax_template_id = Column(Integer, ForeignKey("sales_tax_templates.id"), nullable=True)
    status = Column(String, default="Draft") # Draft, Submitted, Paid, Cancelled
    
    customer = relationship("Customer")
    sales_order = relationship("SalesOrder")
    items = relationship("SalesInvoiceItem", back_populates="sales_invoice")

class SalesInvoiceItem(Base):
    __tablename__ = "sales_invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    sales_invoice_id = Column(Integer, ForeignKey("sales_invoices.id"))
    item_code = Column(String)
    qty = Column(Float)
    rate = Column(Float)
    amount = Column(Float)

    sales_invoice = relationship("SalesInvoice", back_populates="items")
