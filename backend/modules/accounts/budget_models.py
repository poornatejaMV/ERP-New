from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Budget(Base):
    """Budget - Allocated budget for accounts"""
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    budget_name = Column(String, unique=True, index=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    
    # Budget period
    budget_start_date = Column(Date, nullable=False)
    budget_end_date = Column(Date, nullable=False)
    
    # Budget amount
    budget_amount = Column(Float, nullable=False, default=0.0)
    
    # Budget against (Cost Center, Project, etc.)
    budget_against = Column(String, default="Cost Center")  # Cost Center, Project, etc.
    budget_against_id = Column(Integer, nullable=True)  # ID of cost center, project, etc.
    
    # Actions when budget exceeded
    action_if_annual_budget_exceeded = Column(String, default="Warn")  # Warn, Stop
    action_if_accumulated_monthly_budget_exceeded = Column(String, default="Warn")
    
    # Applicable on
    applicable_on_purchase_order = Column(Boolean, default=True)
    applicable_on_booking_actual_expenses = Column(Boolean, default=True)
    
    # Status
    status = Column(String, default="Draft")  # Draft, Submitted, Cancelled
    
    # Distribution
    monthly_distribution = Column(Boolean, default=False)  # If True, use monthly distribution
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    account = relationship("Account")
    distributions = relationship("BudgetDistribution", back_populates="budget", cascade="all, delete-orphan")

class BudgetDistribution(Base):
    """Monthly/Period distribution of budget"""
    __tablename__ = "budget_distributions"
    
    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    budget_allocation = Column(Float, nullable=False, default=0.0)
    
    budget = relationship("Budget", back_populates="distributions")

