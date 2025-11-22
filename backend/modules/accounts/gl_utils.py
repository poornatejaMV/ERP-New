"""
General Ledger Utilities
Functions for creating GL entries from transactions
"""
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from .models import GLEntry, Account


def make_gl_entries(
    db: Session,
    gl_map: List[dict],
    company_id: Optional[int] = None,
    fiscal_year: Optional[str] = None,
    update_outstanding: bool = True
):
    """
    Create GL entries from a list of GL map dictionaries
    
    gl_map format:
    [
        {
            "account": "Debtors",
            "party_type": "Customer",
            "party": "Customer Name",
            "debit": 1000.0,
            "credit": 0.0,
            "against": "Sales",
            "cost_center": None,
            "project": None,
            "voucher_type": "Sales Invoice",
            "voucher_no": "SINV-00001",
            "against_voucher_type": None,
            "against_voucher_no": None,
        },
        ...
    ]
    """
    entries = []
    
    for entry_dict in gl_map:
        # Get account by name
        account = db.query(Account).filter(
            Account.account_name == entry_dict.get("account")
        ).first()
        
        if not account:
            raise ValueError(f"Account '{entry_dict.get('account')}' not found")
        
        gl_entry = GLEntry(
            posting_date=entry_dict.get("posting_date", date.today()),
            account_id=account.id,
            party_type=entry_dict.get("party_type"),
            party=entry_dict.get("party"),
            cost_center_id=entry_dict.get("cost_center_id"),
            project=entry_dict.get("project"),
            against_voucher_type=entry_dict.get("against_voucher_type"),
            against_voucher_no=entry_dict.get("against_voucher_no"),
            voucher_type=entry_dict.get("voucher_type"),
            voucher_no=entry_dict.get("voucher_no"),
            against=entry_dict.get("against"),
            debit=entry_dict.get("debit", 0.0),
            credit=entry_dict.get("credit", 0.0),
            company_id=company_id or entry_dict.get("company_id"),
            fiscal_year=fiscal_year or entry_dict.get("fiscal_year"),
            is_cancelled=False
        )
        
        db.add(gl_entry)
        entries.append(gl_entry)
    
    db.commit()
    return entries


def make_reverse_gl_entries(
    db: Session,
    voucher_type: str,
    voucher_no: str,
    company_id: Optional[int] = None
):
    """
    Create reverse GL entries for cancellation
    """
    # Get original entries
    original_entries = db.query(GLEntry).filter(
        GLEntry.voucher_type == voucher_type,
        GLEntry.voucher_no == voucher_no,
        GLEntry.is_cancelled == False,
        GLEntry.company_id == company_id
    ).all()
    
    reverse_entries = []
    
    for entry in original_entries:
        reverse_entry = GLEntry(
            posting_date=entry.posting_date,
            account_id=entry.account_id,
            party_type=entry.party_type,
            party=entry.party,
            cost_center_id=entry.cost_center_id,
            project=entry.project,
            against_voucher_type=entry.voucher_type,
            against_voucher_no=entry.voucher_no,
            voucher_type=entry.voucher_type,
            voucher_no=f"{entry.voucher_no}-CANCEL",
            against=entry.against,
            debit=entry.credit,  # Reverse: debit becomes credit
            credit=entry.debit,  # Reverse: credit becomes debit
            company_id=entry.company_id,
            fiscal_year=entry.fiscal_year,
            is_cancelled=True
        )
        
        # Mark original as cancelled
        entry.is_cancelled = True
        
        db.add(reverse_entry)
        reverse_entries.append(reverse_entry)
    
    db.commit()
    return reverse_entries


def get_account_balance(
    db: Session,
    account_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    company_id: Optional[int] = None
) -> dict:
    """
    Get account balance from GL entries
    Returns: {"debit": float, "credit": float, "balance": float}
    """
    from sqlalchemy import func
    
    query = db.query(
        func.sum(GLEntry.debit).label('total_debit'),
        func.sum(GLEntry.credit).label('total_credit')
    ).filter(
        GLEntry.account_id == account_id,
        GLEntry.is_cancelled == False
    )
    
    if company_id:
        query = query.filter(GLEntry.company_id == company_id)
    if from_date:
        query = query.filter(GLEntry.posting_date >= from_date)
    if to_date:
        query = query.filter(GLEntry.posting_date <= to_date)
    
    result = query.first()
    
    total_debit = float(result.total_debit) if result.total_debit else 0.0
    total_credit = float(result.total_credit) if result.total_credit else 0.0
    balance = total_debit - total_credit
    
    return {
        "debit": total_debit,
        "credit": total_credit,
        "balance": balance
    }

