from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class BudgetDistributionBase(BaseModel):
    month: int  # 1-12
    budget_allocation: float

class BudgetDistributionCreate(BudgetDistributionBase):
    pass

class BudgetDistribution(BudgetDistributionBase):
    id: int
    budget_id: int
    
    class Config:
        from_attributes = True

class BudgetBase(BaseModel):
    budget_name: str
    company_id: int
    account_id: int
    budget_start_date: date
    budget_end_date: date
    budget_amount: float
    budget_against: str = "Cost Center"
    budget_against_id: Optional[int] = None
    action_if_annual_budget_exceeded: str = "Warn"
    action_if_accumulated_monthly_budget_exceeded: str = "Warn"
    applicable_on_purchase_order: bool = True
    applicable_on_booking_actual_expenses: bool = True
    monthly_distribution: bool = False

class BudgetCreate(BudgetBase):
    distributions: List[BudgetDistributionCreate] = []

class Budget(BudgetBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    distributions: List[BudgetDistribution] = []
    
    class Config:
        from_attributes = True

class BudgetVsActual(BaseModel):
    """Budget vs Actual comparison"""
    budget_id: int
    budget_name: str
    account_id: int
    account_name: str
    budget_amount: float
    actual_expense: float
    variance: float
    variance_percentage: float
    period_start: date
    period_end: date

