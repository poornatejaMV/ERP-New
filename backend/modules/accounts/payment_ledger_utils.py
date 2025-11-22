"""
Payment Ledger Utilities
For tracking receivables and payables separately from GL
"""
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from .models import PaymentLedgerEntry, Account


def make_payment_ledger_entry(
    db: Session,
    account_type: str,  # "Receivable" or "Payable"
    account_id: int,
    party: str,
    party_type: Optional[str],
    voucher_type: str,
    voucher_no: str,
    amount: float,
    against_voucher_type: Optional[str] = None,
    against_voucher_no: Optional[str] = None,
    company_id: Optional[int] = None,
    posting_date: Optional[date] = None
):
    """
    Create a payment ledger entry
    """
    entry = PaymentLedgerEntry(
        posting_date=posting_date or date.today(),
        account_type=account_type,
        account_id=account_id,
        party_type=party_type,
        party=party,
        voucher_type=voucher_type,
        voucher_no=voucher_no,
        against_voucher_type=against_voucher_type,
        against_voucher_no=against_voucher_no,
        amount=amount,
        company_id=company_id,
        is_cancelled=False
    )
    
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_outstanding_amount(
    db: Session,
    party: str,
    against_voucher_no: str,
    company_id: Optional[int] = None
) -> float:
    """
    Get outstanding amount for a party against a specific voucher
    Outstanding = Sum of all payment ledger entries for this voucher
    """
    from sqlalchemy import func
    
    query = db.query(
        func.sum(PaymentLedgerEntry.amount).label('outstanding')
    ).filter(
        PaymentLedgerEntry.party == party,
        PaymentLedgerEntry.against_voucher_no == against_voucher_no,
        PaymentLedgerEntry.is_cancelled == False
    )
    
    if company_id:
        query = query.filter(PaymentLedgerEntry.company_id == company_id)
    
    result = query.first()
    return float(result.outstanding) if result.outstanding else 0.0


def get_party_outstanding(
    db: Session,
    party: str,
    account_type: Optional[str] = None,  # "Receivable" or "Payable"
    company_id: Optional[int] = None
) -> float:
    """
    Get total outstanding amount for a party
    """
    from sqlalchemy import func
    
    query = db.query(
        func.sum(PaymentLedgerEntry.amount).label('outstanding')
    ).filter(
        PaymentLedgerEntry.party == party,
        PaymentLedgerEntry.is_cancelled == False
    )
    
    if account_type:
        query = query.filter(PaymentLedgerEntry.account_type == account_type)
    if company_id:
        query = query.filter(PaymentLedgerEntry.company_id == company_id)
    
    result = query.first()
    return float(result.outstanding) if result.outstanding else 0.0


def cancel_payment_ledger_entries(
    db: Session,
    voucher_type: str,
    voucher_no: str,
    company_id: Optional[int] = None
):
    """
    Cancel payment ledger entries (mark as cancelled and create reverse entries)
    """
    # Get original entries
    original_entries = db.query(PaymentLedgerEntry).filter(
        PaymentLedgerEntry.voucher_type == voucher_type,
        PaymentLedgerEntry.voucher_no == voucher_no,
        PaymentLedgerEntry.is_cancelled == False,
        PaymentLedgerEntry.company_id == company_id
    ).all()
    
    reverse_entries = []
    
    for entry in original_entries:
        # Create reverse entry
        reverse_entry = PaymentLedgerEntry(
            posting_date=entry.posting_date,
            account_type=entry.account_type,
            account_id=entry.account_id,
            party_type=entry.party_type,
            party=entry.party,
            voucher_type=entry.voucher_type,
            voucher_no=f"{entry.voucher_no}-CANCEL",
            against_voucher_type=entry.against_voucher_type,
            against_voucher_no=entry.against_voucher_no,
            amount=-entry.amount,  # Reverse the amount
            company_id=entry.company_id,
            is_cancelled=True
        )
        
        # Mark original as cancelled
        entry.is_cancelled = True
        
        db.add(reverse_entry)
        reverse_entries.append(reverse_entry)
    
    db.commit()
    return reverse_entries

