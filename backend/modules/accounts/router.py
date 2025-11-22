from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from core.auth import get_current_active_user
from core.document_lifecycle import submit_document, cancel_document, can_submit, can_cancel
from core.numbering import get_next_number
from models import User
from . import models, schemas
from .gl_utils import make_gl_entries, make_reverse_gl_entries
from datetime import date, datetime

router = APIRouter(
    prefix="/accounts",
    tags=["accounts"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/accounts/", response_model=schemas.Account)
def create_account(account: schemas.AccountCreate, db: Session = Depends(get_db)):
    db_account = models.Account(**account.dict())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.get("/accounts/", response_model=List[schemas.Account])
def read_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    accounts = db.query(models.Account).offset(skip).limit(limit).all()
    return accounts

@router.post("/journal-entries/", response_model=schemas.JournalEntry)
def create_journal_entry(
    entry: schemas.JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new Journal Entry (Draft)"""
    # Generate document number
    doc_name = get_next_number(db, "Journal Entry", date=entry.posting_date)
    
    # Validate debit = credit
    total_debit = sum(acc.debit for acc in entry.accounts)
    total_credit = sum(acc.credit for acc in entry.accounts)
    
    if abs(total_debit - total_credit) > 0.01:  # Allow small rounding differences
        raise HTTPException(
            status_code=400,
            detail=f"Total debit ({total_debit}) must equal total credit ({total_credit})"
        )
    
    db_entry = models.JournalEntry(
        name=doc_name,
        posting_date=entry.posting_date,
        title=entry.title,
        total_debit=total_debit,
        total_credit=total_credit,
        docstatus=0,  # Draft
        status="Draft"
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    for acc in entry.accounts:
        db_acc = models.JournalEntryAccount(
            journal_entry_id=db_entry.id,
            **acc.dict()
        )
        db.add(db_acc)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("/journal-entries/", response_model=List[schemas.JournalEntry])
def read_journal_entries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all journal entries"""
    entries = db.query(models.JournalEntry).order_by(
        models.JournalEntry.posting_date.desc()
    ).offset(skip).limit(limit).all()
    return entries


@router.get("/journal-entries/{entry_id}", response_model=schemas.JournalEntry)
def read_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a journal entry by ID"""
    entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal Entry not found")
    return entry


@router.post("/journal-entries/{entry_id}/submit")
def submit_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submit a journal entry (creates GL entries)"""
    entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal Entry not found")
    
    if not can_submit(entry):
        raise HTTPException(
            status_code=400,
            detail="Journal Entry cannot be submitted. It must be in Draft status."
        )
    
    # Validate debit = credit
    if abs(entry.total_debit - entry.total_credit) > 0.01:
        raise HTTPException(
            status_code=400,
            detail="Total debit must equal total credit"
        )
    
    # Submit the document
    submit_document(db, entry, current_user.id)
    
    # Create GL entries
    gl_map = []
    for je_account in entry.accounts:
        account = db.query(models.Account).filter(
            models.Account.id == je_account.account_id
        ).first()
        
        if je_account.debit > 0:
            gl_map.append({
                "account": account.account_name,
                "debit": je_account.debit,
                "credit": 0.0,
                "against": je_account.against_account,
                "voucher_type": "Journal Entry",
                "voucher_no": entry.name or str(entry.id),
                "posting_date": entry.posting_date,
            })
        if je_account.credit > 0:
            gl_map.append({
                "account": account.account_name,
                "debit": 0.0,
                "credit": je_account.credit,
                "against": je_account.against_account,
                "voucher_type": "Journal Entry",
                "voucher_no": entry.name or str(entry.id),
                "posting_date": entry.posting_date,
            })
    
    make_gl_entries(db, gl_map, company_id=entry.company_id)
    
    return {"message": "Journal Entry submitted successfully", "status": entry.status}


@router.post("/journal-entries/{entry_id}/cancel")
def cancel_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a journal entry (creates reverse GL entries)"""
    entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal Entry not found")
    
    if not can_cancel(entry):
        raise HTTPException(
            status_code=400,
            detail="Journal Entry cannot be cancelled. It must be in Submitted status."
        )
    
    # Create reverse GL entries
    make_reverse_gl_entries(
        db,
        voucher_type="Journal Entry",
        voucher_no=entry.name,
        company_id=entry.company_id
    )
    
    # Cancel the document
    cancel_document(db, entry, current_user.id)
    
    return {"message": "Journal Entry cancelled successfully", "status": entry.status}

# Payment Entry Endpoints
from . import payment_schemas

@router.post("/payments/", response_model=payment_schemas.PaymentEntry)
def create_payment_entry(payment: payment_schemas.PaymentEntryCreate, db: Session = Depends(get_db)):
    from .payment_models import PaymentEntry, PaymentReference
    
    # Create Payment Entry
    db_payment = PaymentEntry(**payment.dict(exclude={'references'}))
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)

    # Fetch Party Name
    from modules.selling.models import Customer
    from modules.buying.models import Supplier
    from .payment_ledger_utils import make_payment_ledger_entry
    
    party_name = "Unknown"
    if payment.party_type == "Customer":
        party_obj = db.query(Customer).filter(Customer.id == payment.party_id).first()
        if party_obj: party_name = party_obj.customer_name
    elif payment.party_type == "Supplier":
        party_obj = db.query(Supplier).filter(Supplier.id == payment.party_id).first()
        if party_obj: party_name = party_obj.supplier_name

    # Create Payment References and update invoice outstanding
    for ref_data in payment.references:
        db_ref = PaymentReference(
            payment_entry_id=db_payment.id,
            **ref_data.dict()
        )
        db.add(db_ref)
        
        # Update invoice outstanding amount
        if ref_data.reference_doctype == "Sales Invoice":
            from modules.selling.invoice_models import SalesInvoice
            invoice = db.query(SalesInvoice).filter(SalesInvoice.id == ref_data.reference_name).first()
            if invoice:
                invoice.outstanding_amount -= ref_data.allocated_amount
                if invoice.outstanding_amount <= 0:
                    invoice.status = "Paid"
        elif ref_data.reference_doctype == "Purchase Invoice":
            from modules.buying.invoice_models import PurchaseInvoice
            invoice = db.query(PurchaseInvoice).filter(PurchaseInvoice.id == ref_data.reference_name).first()
            if invoice:
                invoice.outstanding_amount -= ref_data.allocated_amount
                if invoice.outstanding_amount <= 0:
                    invoice.status = "Paid"
        
        # Create Payment Ledger Entry (Allocation)
        ple_amount = 0.0
        account_type = ""
        account_id = 0
        
        if payment.payment_type == "Receive":
            ple_amount = -ref_data.allocated_amount
            account_type = "Receivable"
            account_id = 1 # Debtors
        else:
            ple_amount = ref_data.allocated_amount
            account_type = "Payable"
            account_id = 4 # Creditors
            
        make_payment_ledger_entry(
            db=db,
            posting_date=payment.posting_date,
            account_type=account_type,
            account_id=account_id,
            party_type=payment.party_type,
            party=party_name,
            voucher_type="Payment Entry",
            voucher_no=str(db_payment.id),
            against_voucher_type=ref_data.reference_doctype,
            against_voucher_no=str(ref_data.reference_name),
            amount=ple_amount,
            company_id=1
        )
    
    # Create Journal Entry for payment
    je = models.JournalEntry(
        posting_date=payment.posting_date,
        title=f"Payment Entry #{db_payment.id}",
        total_debit=payment.paid_amount,
        total_credit=payment.paid_amount
    )
    db.add(je)
    db.commit()
    db.refresh(je)

    if payment.payment_type == "Receive":
        # Receive from Customer: Dr. Cash, Cr. Debtors
        db.add(models.JournalEntryAccount(journal_entry_id=je.id, account_id=5, debit=payment.paid_amount, credit=0))  # Cash
        db.add(models.JournalEntryAccount(journal_entry_id=je.id, account_id=1, debit=0, credit=payment.paid_amount))  # Debtors
    else:
        # Pay to Supplier: Dr. Creditors, Cr. Cash
        db.add(models.JournalEntryAccount(journal_entry_id=je.id, account_id=4, debit=payment.paid_amount, credit=0))  # Creditors
        db.add(models.JournalEntryAccount(journal_entry_id=je.id, account_id=5, debit=0, credit=payment.paid_amount))  # Cash

    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.get("/payments/", response_model=List[payment_schemas.PaymentEntry])
def read_payment_entries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    from .payment_models import PaymentEntry
    payments = db.query(PaymentEntry).offset(skip).limit(limit).all()
    return payments

# Reports
@router.get("/reports/trial-balance")
def get_trial_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate Trial Balance Report"""
    from sqlalchemy import func
    
    # Get all journal entry accounts and sum by account
    accounts_data = db.query(
        models.JournalEntryAccount.account_id,
        func.sum(models.JournalEntryAccount.debit).label('total_debit'),
        func.sum(models.JournalEntryAccount.credit).label('total_credit')
    ).group_by(models.JournalEntryAccount.account_id).all()
    
    trial_balance = []
    total_debits = 0.0
    total_credits = 0.0
    
    for acc_id, debit, credit in accounts_data:
        account = db.query(models.Account).filter(models.Account.id == acc_id).first()
        if account:
            balance = debit - credit
            trial_balance.append({
                'account_id': acc_id,
                'account_name': account.account_name,
                'debit': float(debit) if debit else 0.0,
                'credit': float(credit) if credit else 0.0,
                'balance': float(balance)
            })
            total_debits += float(debit) if debit else 0.0
            total_credits += float(credit) if credit else 0.0
    
    return {
        'trial_balance': trial_balance,
        'total_debit': total_debits,
        'total_credit': total_credits,
        'difference': total_debits - total_credits
    }

@router.get("/reports/profit-loss")
def get_profit_loss(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate Profit & Loss Statement"""
    from sqlalchemy import func
    
    # Get Income accounts
    income_accounts = db.query(
        models.Account.account_name,
        func.sum(models.JournalEntryAccount.credit - models.JournalEntryAccount.debit).label('amount')
    ).join(
        models.JournalEntryAccount, models.Account.id == models.JournalEntryAccount.account_id
    ).filter(
        models.Account.root_type == 'Income'
    ).group_by(models.Account.account_name).all()
    
    # Get Expense accounts
    expense_accounts = db.query(
        models.Account.account_name,
        func.sum(models.JournalEntryAccount.debit - models.JournalEntryAccount.credit).label('amount')
    ).join(
        models.JournalEntryAccount, models.Account.id == models.JournalEntryAccount.account_id
    ).filter(
        models.Account.root_type == 'Expense'
    ).group_by(models.Account.account_name).all()
    
    total_income = sum([float(amt) if amt else 0.0 for _, amt in income_accounts])
    total_expense = sum([float(amt) if amt else 0.0 for _, amt in expense_accounts])
    
    return {
        'income': [{'account': name, 'amount': float(amt) if amt else 0.0} for name, amt in income_accounts],
        'expenses': [{'account': name, 'amount': float(amt) if amt else 0.0} for name, amt in expense_accounts],
        'total_income': total_income,
        'total_expense': total_expense,
        'net_profit': total_income - total_expense
    }


@router.get("/reports/balance-sheet")
def get_balance_sheet(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate Balance Sheet Report"""
    from sqlalchemy import func
    from .gl_utils import get_account_balance
    
    # Get Asset accounts
    asset_accounts = db.query(models.Account).filter(
        models.Account.root_type == 'Asset',
        models.Account.is_group == False
    ).all()
    
    # Get Liability accounts
    liability_accounts = db.query(models.Account).filter(
        models.Account.root_type == 'Liability',
        models.Account.is_group == False
    ).all()
    
    # Get Equity accounts
    equity_accounts = db.query(models.Account).filter(
        models.Account.root_type == 'Equity',
        models.Account.is_group == False
    ).all()
    
    assets = []
    total_assets = 0.0
    for account in asset_accounts:
        balance = get_account_balance(db, account.id)
        if balance['balance'] != 0:
            assets.append({
                'account': account.account_name,
                'balance': balance['balance']
            })
            total_assets += balance['balance']
    
    liabilities = []
    total_liabilities = 0.0
    for account in liability_accounts:
        balance = get_account_balance(db, account.id)
        if balance['balance'] != 0:
            liabilities.append({
                'account': account.account_name,
                'balance': balance['balance']
            })
            total_liabilities += balance['balance']
    
    equity = []
    total_equity = 0.0
    for account in equity_accounts:
        balance = get_account_balance(db, account.id)
        if balance['balance'] != 0:
            equity.append({
                'account': account.account_name,
                'balance': balance['balance']
            })
            total_equity += balance['balance']
    
    return {
        'assets': assets,
        'liabilities': liabilities,
        'equity': equity,
        'total_assets': total_assets,
        'total_liabilities': total_liabilities,
        'total_equity': total_equity,
        'total_liabilities_and_equity': total_liabilities + total_equity
    }


@router.get("/gl-entries/")
def get_gl_entries(
    account_id: int = None,
    from_date: date = None,
    to_date: date = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get General Ledger entries"""
    from .models import GLEntry
    
    query = db.query(GLEntry).filter(GLEntry.is_cancelled == False)
    
    if account_id:
        query = query.filter(GLEntry.account_id == account_id)
    if from_date:
        query = query.filter(GLEntry.posting_date >= from_date)
    if to_date:
        query = query.filter(GLEntry.posting_date <= to_date)
    
    entries = query.order_by(
        GLEntry.posting_date.desc(),
        GLEntry.id.desc()
    ).offset(skip).limit(limit).all()
    
    return entries

# Aging Reports

def generate_aging_report(db: Session, account_type: str):
    from .models import PaymentLedgerEntry
    
    entries = db.query(PaymentLedgerEntry).filter(
        PaymentLedgerEntry.account_type == account_type,
        PaymentLedgerEntry.is_cancelled == False
    ).order_by(PaymentLedgerEntry.posting_date).all()
    
    report = {}
    today = date.today()
    
    for entry in entries:
        voucher_no = entry.against_voucher_no or entry.voucher_no 
        
        key = (entry.party, voucher_no)
        
        if key not in report:
            report[key] = {
                "party": entry.party,
                "voucher_type": entry.against_voucher_type or entry.voucher_type,
                "voucher_no": voucher_no,
                "posting_date": entry.posting_date,
                "outstanding": 0.0,
                "age": 0
            }
        
        report[key]["outstanding"] += entry.amount
        
    result = []
    for data in report.values():
        if abs(data["outstanding"]) > 0.01:
            data["age"] = (today - data["posting_date"]).days
            result.append(data)
            
    return result

@router.get("/reports/accounts-receivable")
def get_ar_report(db: Session = Depends(get_db)):
    return generate_aging_report(db, "Receivable")

@router.get("/reports/accounts-payable")
def get_ap_report(db: Session = Depends(get_db)):
    return generate_aging_report(db, "Payable")

# Tax Templates
from . import tax_schemas, tax_models

# Sales Tax Templates
@router.post("/sales-tax-templates/", response_model=tax_schemas.SalesTaxTemplate)
def create_sales_tax_template(
    template: tax_schemas.SalesTaxTemplateCreate,
    db: Session = Depends(get_db)
):
    db_template = tax_models.SalesTaxTemplate(
        title=template.title,
        company_id=template.company_id,
        is_default=template.is_default
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    for tax in template.taxes:
        db_tax = tax_models.SalesTaxTemplateDetail(
            parent_id=db_template.id,
            **tax.dict()
        )
        db.add(db_tax)
        
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/sales-tax-templates/", response_model=List[tax_schemas.SalesTaxTemplate])
def read_sales_tax_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(tax_models.SalesTaxTemplate).offset(skip).limit(limit).all()

# Purchase Tax Templates
@router.post("/purchase-tax-templates/", response_model=tax_schemas.PurchaseTaxTemplate)
def create_purchase_tax_template(
    template: tax_schemas.PurchaseTaxTemplateCreate,
    db: Session = Depends(get_db)
):
    db_template = tax_models.PurchaseTaxTemplate(
        title=template.title,
        company_id=template.company_id,
        is_default=template.is_default
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    for tax in template.taxes:
        db_tax = tax_models.PurchaseTaxTemplateDetail(
            parent_id=db_template.id,
            **tax.dict()
        )
        db.add(db_tax)
        
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/purchase-tax-templates/", response_model=List[tax_schemas.PurchaseTaxTemplate])
def read_purchase_tax_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(tax_models.PurchaseTaxTemplate).offset(skip).limit(limit).all()

# Bank Reconciliation
from . import bank_reconciliation_models, bank_reconciliation_schemas

@router.post("/bank-statements/", response_model=bank_reconciliation_schemas.BankStatement)
def create_bank_statement(
    statement: bank_reconciliation_schemas.BankStatementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a bank statement with transactions"""
    db_statement = bank_reconciliation_models.BankStatement(
        bank_account_id=statement.bank_account_id,
        company_id=statement.company_id,
        statement_date=statement.statement_date
    )
    db.add(db_statement)
    db.commit()
    db.refresh(db_statement)
    
    # Add transactions
    for trans in statement.transactions:
        db_trans = bank_reconciliation_models.BankStatementTransaction(
            bank_statement_id=db_statement.id,
            **trans.dict()
        )
        db.add(db_trans)
    
    db.commit()
    db.refresh(db_statement)
    return db_statement

@router.get("/bank-statements/", response_model=List[bank_reconciliation_schemas.BankStatement])
def read_bank_statements(
    bank_account_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all bank statements"""
    query = db.query(bank_reconciliation_models.BankStatement)
    if bank_account_id:
        query = query.filter(bank_reconciliation_models.BankStatement.bank_account_id == bank_account_id)
    return query.order_by(bank_reconciliation_models.BankStatement.statement_date.desc()).offset(skip).limit(limit).all()

@router.get("/bank-statements/{statement_id}", response_model=bank_reconciliation_schemas.BankStatement)
def read_bank_statement(
    statement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific bank statement with transactions"""
    statement = db.query(bank_reconciliation_models.BankStatement).filter(
        bank_reconciliation_models.BankStatement.id == statement_id
    ).first()
    if not statement:
        raise HTTPException(status_code=404, detail="Bank statement not found")
    return statement

@router.get("/bank-statements/{statement_id}/match/{transaction_id}", response_model=List[bank_reconciliation_schemas.MatchingVoucher])
def get_matching_vouchers(
    statement_id: int,
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get potential matching vouchers for a bank transaction"""
    # Get the transaction
    trans = db.query(bank_reconciliation_models.BankStatementTransaction).filter(
        bank_reconciliation_models.BankStatementTransaction.id == transaction_id,
        bank_reconciliation_models.BankStatementTransaction.bank_statement_id == statement_id
    ).first()
    if not trans:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if trans.is_reconciled:
        return []
    
    amount = trans.deposit if trans.deposit > 0 else trans.withdrawal
    matches = []
    
    # Match Payment Entries
    from .payment_models import PaymentEntry
    payment_type = "Receive" if trans.deposit > 0 else "Pay"
    payments = db.query(PaymentEntry).filter(
        PaymentEntry.payment_type == payment_type,
        PaymentEntry.status == "Submitted"
    ).all()
    
    for payment in payments:
        score = 0.0
        if abs(payment.paid_amount - amount) < 0.01:
            score += 50.0
        if payment.reference_no and trans.reference_number and payment.reference_no == trans.reference_number:
            score += 30.0
        if payment.posting_date == trans.transaction_date:
            score += 20.0
        
        if score > 0:
            matches.append(bank_reconciliation_schemas.MatchingVoucher(
                voucher_type="Payment Entry",
                voucher_id=payment.id,
                voucher_no=str(payment.id),
                posting_date=payment.posting_date,
                amount=payment.paid_amount,
                party_type=payment.party_type,
                reference_no=payment.reference_no,
                reference_date=payment.reference_date,
                match_score=score
            ))
    
    # Match Journal Entries (with bank account)
    from .models import JournalEntry, JournalEntryAccount
    from sqlalchemy import func
    
    # Get bank account from statement
    statement = db.query(bank_reconciliation_models.BankStatement).filter(
        bank_reconciliation_models.BankStatement.id == statement_id
    ).first()
    
    if statement:
        je_accounts = db.query(JournalEntryAccount).join(JournalEntry).filter(
            JournalEntryAccount.account_id == statement.bank_account_id,
            JournalEntry.status == "Submitted"
        ).all()
        
        for je_account in je_accounts:
            je = je_account.journal_entry
            je_amount = abs(je_account.debit - je_account.credit)
            score = 0.0
            
            if abs(je_amount - amount) < 0.01:
                score += 50.0
            if je.posting_date == trans.transaction_date:
                score += 20.0
            if je.cheque_no and trans.reference_number and je.cheque_no == trans.reference_number:
                score += 30.0
            
            if score > 0:
                matches.append(bank_reconciliation_schemas.MatchingVoucher(
                    voucher_type="Journal Entry",
                    voucher_id=je.id,
                    voucher_no=je.name or str(je.id),
                    posting_date=je.posting_date,
                    amount=je_amount,
                    reference_no=je.cheque_no,
                    reference_date=je.cheque_date,
                    match_score=score
                ))
    
    # Sort by match score descending
    matches.sort(key=lambda x: x.match_score, reverse=True)
    return matches[:10]  # Return top 10 matches

@router.post("/bank-reconciliations/", response_model=bank_reconciliation_schemas.BankReconciliation)
def create_bank_reconciliation(
    reconciliation: bank_reconciliation_schemas.BankReconciliationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reconcile a bank transaction with a voucher"""
    # Verify transaction exists and is not reconciled
    trans = db.query(bank_reconciliation_models.BankStatementTransaction).filter(
        bank_reconciliation_models.BankStatementTransaction.id == reconciliation.transaction_id
    ).first()
    if not trans:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if trans.is_reconciled:
        raise HTTPException(status_code=400, detail="Transaction already reconciled")
    
    # Create reconciliation
    db_reconciliation = bank_reconciliation_models.BankReconciliation(
        **reconciliation.dict(),
        matched_by_user_id=current_user.id
    )
    db.add(db_reconciliation)
    
    # Mark transaction as reconciled
    trans.is_reconciled = True
    trans.reconciled_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_reconciliation)
    return db_reconciliation

@router.get("/bank-reconciliations/", response_model=List[bank_reconciliation_schemas.BankReconciliation])
def read_bank_reconciliations(
    statement_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all bank reconciliations"""
    query = db.query(bank_reconciliation_models.BankReconciliation)
    if statement_id:
        query = query.filter(bank_reconciliation_models.BankReconciliation.bank_statement_id == statement_id)
    return query.order_by(bank_reconciliation_models.BankReconciliation.matched_at.desc()).offset(skip).limit(limit).all()

# Budget Management
from . import budget_models, budget_schemas
from sqlalchemy import func, and_

@router.post("/budgets/", response_model=budget_schemas.Budget)
def create_budget(
    budget: budget_schemas.BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new budget"""
    # Validate dates
    if budget.budget_start_date >= budget.budget_end_date:
        raise HTTPException(status_code=400, detail="Budget start date must be before end date")
    
    # Validate budget amount
    if budget.budget_amount <= 0:
        raise HTTPException(status_code=400, detail="Budget amount must be greater than 0")
    
    # If monthly distribution, validate distributions
    if budget.monthly_distribution:
        total_allocation = sum(d.budget_allocation for d in budget.distributions)
        if abs(total_allocation - budget.budget_amount) > 0.01:
            raise HTTPException(status_code=400, detail=f"Total monthly allocation ({total_allocation}) must equal budget amount ({budget.budget_amount})")
    
    # Create budget
    db_budget = budget_models.Budget(**budget.dict(exclude={'distributions'}))
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    
    # Add distributions if provided
    if budget.monthly_distribution and budget.distributions:
        for dist in budget.distributions:
            db_dist = budget_models.BudgetDistribution(
                budget_id=db_budget.id,
                **dist.dict()
            )
            db.add(db_dist)
    
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.get("/budgets/", response_model=List[budget_schemas.Budget])
def read_budgets(
    company_id: int = None,
    account_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all budgets"""
    query = db.query(budget_models.Budget)
    if company_id:
        query = query.filter(budget_models.Budget.company_id == company_id)
    if account_id:
        query = query.filter(budget_models.Budget.account_id == account_id)
    return query.order_by(budget_models.Budget.budget_start_date.desc()).offset(skip).limit(limit).all()

@router.get("/budgets/{budget_id}", response_model=budget_schemas.Budget)
def read_budget(
    budget_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific budget"""
    budget = db.query(budget_models.Budget).filter(budget_models.Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget

@router.post("/budgets/{budget_id}/submit")
def submit_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submit a budget"""
    budget = db.query(budget_models.Budget).filter(budget_models.Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    if budget.status != "Draft":
        raise HTTPException(status_code=400, detail="Budget is already submitted")
    
    budget.status = "Submitted"
    db.commit()
    return {"message": "Budget submitted successfully", "status": budget.status}

@router.get("/budgets/{budget_id}/vs-actual", response_model=budget_schemas.BudgetVsActual)
def get_budget_vs_actual(
    budget_id: int,
    as_on_date: date = None,
    db: Session = Depends(get_db)
):
    """Get budget vs actual comparison"""
    budget = db.query(budget_models.Budget).filter(budget_models.Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Calculate actual expense from GL Entries
    end_date = as_on_date if as_on_date else budget.budget_end_date
    if end_date > budget.budget_end_date:
        end_date = budget.budget_end_date
    
    # Get actual expense from GL Entries
    actual_expense = db.query(func.sum(models.GLEntry.debit) - func.sum(models.GLEntry.credit)).filter(
        models.GLEntry.account_id == budget.account_id,
        models.GLEntry.posting_date >= budget.budget_start_date,
        models.GLEntry.posting_date <= end_date,
        models.GLEntry.is_cancelled == False
    ).scalar() or 0.0
    
    # Make it positive (expenses are debits)
    if actual_expense < 0:
        actual_expense = abs(actual_expense)
    
    variance = budget.budget_amount - actual_expense
    variance_percentage = (variance / budget.budget_amount * 100) if budget.budget_amount > 0 else 0.0
    
    account = db.query(models.Account).filter(models.Account.id == budget.account_id).first()
    
    return budget_schemas.BudgetVsActual(
        budget_id=budget.id,
        budget_name=budget.budget_name,
        account_id=budget.account_id,
        account_name=account.account_name if account else "Unknown",
        budget_amount=budget.budget_amount,
        actual_expense=actual_expense,
        variance=variance,
        variance_percentage=variance_percentage,
        period_start=budget.budget_start_date,
        period_end=end_date
    )

@router.get("/budgets/vs-actual/all", response_model=List[budget_schemas.BudgetVsActual])
def get_all_budgets_vs_actual(
    company_id: int = None,
    as_on_date: date = None,
    db: Session = Depends(get_db)
):
    """Get budget vs actual for all submitted budgets"""
    query = db.query(budget_models.Budget).filter(budget_models.Budget.status == "Submitted")
    if company_id:
        query = query.filter(budget_models.Budget.company_id == company_id)
    
    budgets = query.all()
    results = []
    
    for budget in budgets:
        end_date = as_on_date if as_on_date else budget.budget_end_date
        if end_date > budget.budget_end_date:
            end_date = budget.budget_end_date
        
        actual_expense = db.query(func.sum(models.GLEntry.debit) - func.sum(models.GLEntry.credit)).filter(
            models.GLEntry.account_id == budget.account_id,
            models.GLEntry.posting_date >= budget.budget_start_date,
            models.GLEntry.posting_date <= end_date,
            models.GLEntry.is_cancelled == False
        ).scalar() or 0.0
        
        if actual_expense < 0:
            actual_expense = abs(actual_expense)
        
        variance = budget.budget_amount - actual_expense
        variance_percentage = (variance / budget.budget_amount * 100) if budget.budget_amount > 0 else 0.0
        
        account = db.query(models.Account).filter(models.Account.id == budget.account_id).first()
        
        results.append(budget_schemas.BudgetVsActual(
            budget_id=budget.id,
            budget_name=budget.budget_name,
            account_id=budget.account_id,
            account_name=account.account_name if account else "Unknown",
            budget_amount=budget.budget_amount,
            actual_expense=actual_expense,
            variance=variance,
            variance_percentage=variance_percentage,
            period_start=budget.budget_start_date,
            period_end=end_date
        ))
    
    return results
