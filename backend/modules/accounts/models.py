from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_name = Column(String, index=True, nullable=False)
    account_number = Column(String, unique=True, nullable=True)  # Account number for chart
    parent_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    is_group = Column(Boolean, default=False)
    root_type = Column(String, nullable=True)  # Asset, Liability, Equity, Income, Expense
    report_type = Column(String, nullable=True) # Balance Sheet, Profit and Loss
    account_type = Column(String, nullable=True)  # More specific: Bank, Cash, Debtors, etc.
    account_currency = Column(String, default="USD")
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    children = relationship("Account", backref="parent", remote_side=[id])

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=True)  # Document number
    posting_date = Column(Date)
    title = Column(String)
    total_debit = Column(Float, default=0.0)
    total_credit = Column(Float, default=0.0)
    docstatus = Column(Integer, default=0)  # 0=Draft, 1=Submitted, 2=Cancelled
    status = Column(String, default="Draft")
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    submitted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    cancelled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    accounts = relationship("JournalEntryAccount", back_populates="journal_entry")

class JournalEntryAccount(Base):
    __tablename__ = "journal_entry_accounts"

    id = Column(Integer, primary_key=True, index=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id"))
    account_id = Column(Integer, ForeignKey("accounts.id"))
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    against_account = Column(String, nullable=True)  # Against account name
    cost_center_id = Column(Integer, ForeignKey("cost_centers.id"), nullable=True)
    project = Column(String, nullable=True)
    remarks = Column(String, nullable=True)

    journal_entry = relationship("JournalEntry", back_populates="accounts")
    account = relationship("Account")


class GLEntry(Base):
    """General Ledger Entry - All accounting entries are stored here"""
    __tablename__ = "gl_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    posting_date = Column(Date, nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    party_type = Column(String, nullable=True)  # Customer, Supplier, Employee, etc.
    party = Column(String, nullable=True)  # Party name
    cost_center_id = Column(Integer, ForeignKey("cost_centers.id"), nullable=True)
    project = Column(String, nullable=True)
    against_voucher_type = Column(String, nullable=True)  # Sales Invoice, Purchase Invoice, etc.
    against_voucher_no = Column(String, nullable=True)  # Document number
    voucher_type = Column(String, nullable=False)  # Journal Entry, Sales Invoice, etc.
    voucher_no = Column(String, nullable=False, index=True)  # Document number
    against = Column(String, nullable=True)  # Against account name
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    fiscal_year = Column(String, nullable=True)
    is_cancelled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    account = relationship("Account")


class PaymentLedgerEntry(Base):
    """Payment Ledger Entry - For tracking receivables and payables"""
    __tablename__ = "payment_ledger_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    posting_date = Column(Date, nullable=False, index=True)
    account_type = Column(String, nullable=False)  # Receivable or Payable
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    party_type = Column(String, nullable=True)  # Customer, Supplier
    party = Column(String, nullable=False, index=True)
    voucher_type = Column(String, nullable=False)
    voucher_no = Column(String, nullable=False, index=True)
    against_voucher_type = Column(String, nullable=True)
    against_voucher_no = Column(String, nullable=True, index=True)
    amount = Column(Float, nullable=False)  # Can be positive or negative
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_cancelled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    account = relationship("Account")
