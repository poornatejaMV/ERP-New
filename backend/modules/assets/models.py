from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class AssetCategory(Base):
    """Asset Category - Groups assets by type"""
    __tablename__ = "asset_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    # Depreciation accounts
    fixed_asset_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    accumulated_depreciation_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    depreciation_expense_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    
    assets = relationship("Asset", back_populates="category")
    
    fixed_asset_account = relationship("Account", foreign_keys=[fixed_asset_account_id])
    accumulated_depreciation_account = relationship("Account", foreign_keys=[accumulated_depreciation_account_id])
    depreciation_expense_account = relationship("Account", foreign_keys=[depreciation_expense_account_id])

class Asset(Base):
    """Fixed Asset"""
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_name = Column(String, index=True, nullable=False)
    asset_number = Column(String, unique=True, index=True, nullable=True)  # Auto-generated
    category_id = Column(Integer, ForeignKey("asset_categories.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Purchase details
    purchase_date = Column(Date, nullable=False)
    purchase_amount = Column(Float, nullable=False, default=0.0)
    additional_cost = Column(Float, default=0.0)  # Installation, shipping, etc.
    total_asset_cost = Column(Float, default=0.0)  # purchase_amount + additional_cost
    
    # Depreciation details
    depreciation_method = Column(String, default="Straight Line")  # Straight Line, Written Down Value
    frequency_of_depreciation = Column(Integer, default=12)  # Months
    total_number_of_depreciations = Column(Integer, default=0)
    depreciation_start_date = Column(Date, nullable=True)
    next_depreciation_date = Column(Date, nullable=True)
    rate_of_depreciation = Column(Float, nullable=True)  # Percentage
    expected_value_after_useful_life = Column(Float, default=0.0)  # Salvage value
    
    # Current values
    value_after_depreciation = Column(Float, default=0.0)
    accumulated_depreciation = Column(Float, default=0.0)
    total_number_of_booked_depreciations = Column(Integer, default=0)
    
    # Status
    status = Column(String, default="Draft")  # Draft, Submitted, Partially Depreciated, Fully Depreciated, Sold, Scrapped
    
    # Links
    purchase_invoice_id = Column(Integer, ForeignKey("purchase_invoices.id"), nullable=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    
    # Location
    location = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = relationship("AssetCategory", back_populates="assets")
    depreciation_schedules = relationship("AssetDepreciationSchedule", back_populates="asset")

class AssetDepreciationSchedule(Base):
    """Depreciation Schedule Entry"""
    __tablename__ = "asset_depreciation_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    schedule_date = Column(Date, nullable=False)
    depreciation_amount = Column(Float, nullable=False)
    accumulated_depreciation = Column(Float, default=0.0)
    value_after_depreciation = Column(Float, default=0.0)
    
    # Journal Entry link
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=True)
    
    status = Column(String, default="Draft")  # Draft, Posted, Cancelled
    posted_at = Column(DateTime, nullable=True)
    
    asset = relationship("Asset", back_populates="depreciation_schedules")

