from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class SalesTaxTemplate(Base):
    __tablename__ = "sales_tax_templates"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    taxes = relationship("SalesTaxTemplateDetail", back_populates="template", cascade="all, delete-orphan")

class SalesTaxTemplateDetail(Base):
    __tablename__ = "sales_tax_template_details"
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("sales_tax_templates.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    rate = Column(Float, default=0.0)
    description = Column(String, nullable=True)
    
    template = relationship("SalesTaxTemplate", back_populates="taxes")
    account = relationship("modules.accounts.models.Account")

class PurchaseTaxTemplate(Base):
    __tablename__ = "purchase_tax_templates"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    taxes = relationship("PurchaseTaxTemplateDetail", back_populates="template", cascade="all, delete-orphan")

class PurchaseTaxTemplateDetail(Base):
    __tablename__ = "purchase_tax_template_details"
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("purchase_tax_templates.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    rate = Column(Float, default=0.0)
    description = Column(String, nullable=True)
    
    template = relationship("PurchaseTaxTemplate", back_populates="taxes")
    account = relationship("modules.accounts.models.Account")





