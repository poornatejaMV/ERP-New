from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class BankStatementTransactionBase(BaseModel):
    transaction_date: date
    description: Optional[str] = None
    reference_number: Optional[str] = None
    deposit: float = 0.0
    withdrawal: float = 0.0
    balance: Optional[float] = None

class BankStatementTransactionCreate(BankStatementTransactionBase):
    pass

class BankStatementTransaction(BankStatementTransactionBase):
    id: int
    bank_statement_id: int
    is_reconciled: bool
    reconciled_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BankStatementBase(BaseModel):
    bank_account_id: int
    company_id: Optional[int] = None
    statement_date: date

class BankStatementCreate(BankStatementBase):
    transactions: List[BankStatementTransactionCreate] = []

class BankStatement(BankStatementBase):
    id: int
    uploaded_at: datetime
    status: str
    transactions: List[BankStatementTransaction] = []
    
    class Config:
        from_attributes = True

class BankReconciliationBase(BaseModel):
    bank_statement_id: int
    transaction_id: int
    voucher_type: str
    voucher_id: int
    voucher_no: str
    matched_amount: float

class BankReconciliationCreate(BankReconciliationBase):
    pass

class BankReconciliation(BankReconciliationBase):
    id: int
    matched_at: datetime
    matched_by_user_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class MatchingVoucher(BaseModel):
    """Potential matching voucher for a bank transaction"""
    voucher_type: str
    voucher_id: int
    voucher_no: str
    posting_date: date
    amount: float
    party: Optional[str] = None
    party_type: Optional[str] = None
    reference_no: Optional[str] = None
    reference_date: Optional[date] = None
    match_score: float  # 0-100, higher is better match

