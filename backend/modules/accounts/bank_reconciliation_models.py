from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class BankStatement(Base):
    """Bank Statement - Uploaded bank statement transactions"""
    __tablename__ = "bank_statements"
    
    id = Column(Integer, primary_key=True, index=True)
    bank_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    statement_date = Column(Date, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Draft")  # Draft, Reconciled, Cancelled
    
    transactions = relationship("BankStatementTransaction", back_populates="bank_statement")
    reconciliations = relationship("BankReconciliation", back_populates="bank_statement")
    
    account = relationship("Account")

class BankStatementTransaction(Base):
    """Individual transactions from bank statement"""
    __tablename__ = "bank_statement_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    bank_statement_id = Column(Integer, ForeignKey("bank_statements.id"), nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    reference_number = Column(String, nullable=True)
    deposit = Column(Float, default=0.0)  # Amount deposited
    withdrawal = Column(Float, default=0.0)  # Amount withdrawn
    balance = Column(Float, nullable=True)  # Running balance
    is_reconciled = Column(Boolean, default=False)
    reconciled_at = Column(DateTime, nullable=True)
    
    bank_statement = relationship("BankStatement", back_populates="transactions")
    reconciliations = relationship("BankReconciliation", back_populates="transaction")

class BankReconciliation(Base):
    """Links bank statement transactions to accounting vouchers"""
    __tablename__ = "bank_reconciliations"
    
    id = Column(Integer, primary_key=True, index=True)
    bank_statement_id = Column(Integer, ForeignKey("bank_statements.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("bank_statement_transactions.id"), nullable=False)
    voucher_type = Column(String, nullable=False)  # Payment Entry, Journal Entry, Sales Invoice, Purchase Invoice
    voucher_id = Column(Integer, nullable=False)  # ID of the voucher
    voucher_no = Column(String, nullable=False)  # Document number
    matched_amount = Column(Float, nullable=False)
    matched_at = Column(DateTime, default=datetime.utcnow)
    matched_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    bank_statement = relationship("BankStatement", back_populates="reconciliations")
    transaction = relationship("BankStatementTransaction", back_populates="reconciliations")





