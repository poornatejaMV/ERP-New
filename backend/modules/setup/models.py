"""
Setup Module Models
Company, Fiscal Year, Currency, etc.
"""
from sqlalchemy import Column, Integer, String, Boolean, Date, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Company(Base):
    """Company master"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, unique=True, index=True, nullable=False)
    abbr = Column(String, nullable=True)  # Abbreviation for naming series
    default_currency = Column(String, default="USD")
    country = Column(String, nullable=True)
    is_group = Column(Boolean, default=False)
    parent_company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    children = relationship("Company", backref="parent", remote_side=[id])


class FiscalYear(Base):
    """Fiscal Year"""
    __tablename__ = "fiscal_years"
    
    id = Column(Integer, primary_key=True, index=True)
    year = Column(String, unique=True, index=True, nullable=False)  # e.g., "2024"
    year_start_date = Column(Date, nullable=False)
    year_end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    is_closed = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company")


class Currency(Base):
    """Currency master"""
    __tablename__ = "currencies"
    
    id = Column(Integer, primary_key=True, index=True)
    currency_name = Column(String, unique=True, index=True, nullable=False)  # e.g., "USD"
    currency_symbol = Column(String, nullable=True)  # e.g., "$"
    fraction_units = Column(Integer, default=2)  # Decimal places
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ExchangeRate(Base):
    """Currency Exchange Rates"""
    __tablename__ = "exchange_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    from_currency = Column(String, ForeignKey("currencies.currency_name"), nullable=False)
    to_currency = Column(String, ForeignKey("currencies.currency_name"), nullable=False)
    exchange_rate = Column(Float, nullable=False)
    date = Column(Date, nullable=False, default=datetime.utcnow().date())
    created_at = Column(DateTime, default=datetime.utcnow)


class CostCenter(Base):
    """Cost Center"""
    __tablename__ = "cost_centers"
    
    id = Column(Integer, primary_key=True, index=True)
    cost_center_name = Column(String, unique=True, index=True, nullable=False)
    parent_cost_center_id = Column(Integer, ForeignKey("cost_centers.id"), nullable=True)
    is_group = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    children = relationship("CostCenter", backref="parent", remote_side=[id])
    company = relationship("Company")


class Territory(Base):
    """Territory for sales"""
    __tablename__ = "territories"
    
    id = Column(Integer, primary_key=True, index=True)
    territory_name = Column(String, unique=True, index=True, nullable=False)
    parent_territory_id = Column(Integer, ForeignKey("territories.id"), nullable=True)
    is_group = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    children = relationship("Territory", backref="parent", remote_side=[id])


class SalesPerson(Base):
    """Sales Person"""
    __tablename__ = "sales_persons"
    
    id = Column(Integer, primary_key=True, index=True)
    sales_person_name = Column(String, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Employee(Base):
    """Employee (simplified)"""
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_name = Column(String, nullable=False)
    employee_number = Column(String, unique=True, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company")


class ItemGroup(Base):
    """Item Group"""
    __tablename__ = "item_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    item_group_name = Column(String, unique=True, index=True, nullable=False)
    parent_item_group_id = Column(Integer, ForeignKey("item_groups.id"), nullable=True)
    is_group = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    children = relationship("ItemGroup", backref="parent", remote_side=[id])


class CustomerGroup(Base):
    """Customer Group"""
    __tablename__ = "customer_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_group_name = Column(String, unique=True, index=True, nullable=False)
    parent_customer_group_id = Column(Integer, ForeignKey("customer_groups.id"), nullable=True)
    is_group = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    children = relationship("CustomerGroup", backref="parent", remote_side=[id])


class SupplierGroup(Base):
    """Supplier Group"""
    __tablename__ = "supplier_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_group_name = Column(String, unique=True, index=True, nullable=False)
    parent_supplier_group_id = Column(Integer, ForeignKey("supplier_groups.id"), nullable=True)
    is_group = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    children = relationship("SupplierGroup", backref="parent", remote_side=[id])


class PriceList(Base):
    """Price List Master"""
    __tablename__ = "price_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    price_list_name = Column(String, unique=True, index=True, nullable=False)
    enabled = Column(Boolean, default=True)
    buying = Column(Boolean, default=False) # True for Buying Price List
    selling = Column(Boolean, default=False) # True for Selling Price List
    currency = Column(String, default="USD")
    created_at = Column(DateTime, default=datetime.utcnow)

