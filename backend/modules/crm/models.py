from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    lead_name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, default="Lead") # Lead, Open, Replied, Opportunity, Interested, Converted, Do Not Contact

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True) # Can link to customer too
    opportunity_amount = Column(Float, default=0.0)
    status = Column(String, default="Open") # Open, Quotation, Converted, Lost

    lead = relationship("Lead")
    customer = relationship("Customer")
