from typing import List, Optional
from pydantic import BaseModel
from datetime import date

class AccountBase(BaseModel):
    account_name: str
    parent_account_id: Optional[int] = None
    is_group: bool = False
    root_type: Optional[str] = None
    report_type: Optional[str] = None
    account_type: Optional[str] = None
    account_currency: Optional[str] = "USD"

class AccountCreate(AccountBase):
    pass

class Account(AccountBase):
    id: int

    class Config:
        from_attributes = True

class JournalEntryAccountBase(BaseModel):
    account_id: int
    debit: float = 0.0
    credit: float = 0.0
    against_account: Optional[str] = None
    cost_center_id: Optional[int] = None
    project: Optional[str] = None
    remarks: Optional[str] = None

class JournalEntryAccountCreate(JournalEntryAccountBase):
    pass

class JournalEntryAccount(JournalEntryAccountBase):
    id: int
    journal_entry_id: int

    class Config:
        from_attributes = True

class JournalEntryBase(BaseModel):
    posting_date: date
    title: str
    total_debit: float = 0.0
    total_credit: float = 0.0

class JournalEntryCreate(JournalEntryBase):
    accounts: List[JournalEntryAccountCreate]

class JournalEntry(JournalEntryBase):
    id: int
    name: Optional[str] = None
    docstatus: int = 0
    status: str = "Draft"
    accounts: List[JournalEntryAccount]

    class Config:
        from_attributes = True
