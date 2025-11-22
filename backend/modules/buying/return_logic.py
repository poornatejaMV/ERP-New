from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from datetime import date
from . import models

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_purchase_return(invoice_id: int, db: Session):
    """Create a Purchase Return (Debit Note) against a Purchase Invoice"""
    # 1. Fetch original invoice
    original_invoice = db.query(models.PurchaseInvoice).filter(models.PurchaseInvoice.id == invoice_id).first()
    if not original_invoice:
        raise HTTPException(status_code=404, detail="Purchase Invoice not found")
    
    if original_invoice.status != "Submitted" and original_invoice.status != "Paid" and original_invoice.status != "Overdue":
            raise HTTPException(status_code=400, detail="Invoice must be Submitted or Paid to create a return")

    if original_invoice.is_return:
        raise HTTPException(status_code=400, detail="Cannot create a return against a return invoice")

    # 2. Create Return Invoice (Debit Note)
    # A return invoice is a negative invoice
    
    # Generate return items (negative qty)
    return_items = []
    for item in original_invoice.items:
        return_items.append({
            "item_code": item.item_code,
            "qty": -1 * item.qty, # Negative quantity
            "rate": item.rate,
            "amount": -1 * item.amount
        })
        
    # Calculate totals
    total_amount = sum([item['amount'] for item in return_items])
    
    return_invoice = models.PurchaseInvoice(
        supplier_id=original_invoice.supplier_id,
        purchase_order_id=original_invoice.purchase_order_id,
        posting_date=date.today(),
        due_date=date.today(), 
        total_amount=total_amount,
        grand_total=total_amount,
        outstanding_amount=total_amount, # Negative outstanding means they owe us
        status="Draft",
        is_return=True,
        return_against=original_invoice.id
    )
    db.add(return_invoice)
    db.commit()
    db.refresh(return_invoice)
    
    # Add Items
    for item_data in return_items:
        db_item = models.PurchaseInvoiceItem(
            purchase_invoice_id=return_invoice.id,
            **item_data
        )
        db.add(db_item)
        
    db.commit()
    
    return {"message": "Purchase Return (Debit Note) created", "invoice_id": return_invoice.id}

def submit_purchase_return(invoice_id: int, db: Session):
    """Submit a Purchase Return: Update Stock (Out) and GL (Reverse)"""
    return_invoice = db.query(models.PurchaseInvoice).filter(models.PurchaseInvoice.id == invoice_id).first()
    
    if not return_invoice:
        raise HTTPException(status_code=404, detail="Purchase Invoice not found")
    
    if not return_invoice.is_return:
            raise HTTPException(status_code=400, detail="This is not a return invoice")
            
    if return_invoice.status != "Draft":
        raise HTTPException(status_code=400, detail="Return Invoice must be in Draft status")
        
    # 1. Create Stock Entry (Material Issue - Return)
    # Items going OUT from warehouse (returning to supplier)
    from modules.stock.router import create_stock_entry_with_ledger
    
    stock_entry_data = {
        'transaction_date': return_invoice.posting_date,
        'purpose': "Purchase Return", 
        'voucher_type': "Purchase Return",
        'items': []
    }
    
    for item in return_invoice.items:
        # Qty in return invoice is negative (-5).
        # For stock entry, we are moving items OUT.
        # Logic: Original Purchase was +5 IN. Return is -5 (logical).
        # Stock Entry for Return means 5 OUT.
        stock_entry_data['items'].append({
            'item_code': item.item_code,
            'qty': abs(item.qty), 
            'basic_rate': item.rate
        })
        
    create_stock_entry_with_ledger(db, stock_entry_data)
    
    # 2. Create GL Entries (Reverse Expense)
    # Debit: Creditors (Liability) - Reduce Liability (we owe less)
    # Credit: Expense (COGS/Stock Assets) - Reduce Expense/Asset value
    from modules.accounts.models import JournalEntry, JournalEntryAccount
    
    je = JournalEntry(
        posting_date=return_invoice.posting_date,
        title=f"Purchase Return #{return_invoice.id}",
        total_debit=abs(return_invoice.total_amount),
        total_credit=abs(return_invoice.total_amount),
        status="Submitted",
        docstatus=1
    )
    db.add(je)
    db.commit()
    db.refresh(je)
    
    # Debit Creditors (Account ID 4 for Suppliers)
    db.add(JournalEntryAccount(journal_entry_id=je.id, account_id=4, debit=abs(return_invoice.total_amount), credit=0))
    
    # Credit Expenses/Stock Assets (Account ID 9 for Cost of Goods Sold - simplified)
    db.add(JournalEntryAccount(journal_entry_id=je.id, account_id=9, debit=0, credit=abs(return_invoice.total_amount)))
    
    # 3. Update Invoice Status
    return_invoice.status = "Return"
    
    # 4. Update Original Invoice Outstanding (if linked)
    if return_invoice.return_against:
        original_invoice = db.query(models.PurchaseInvoice).filter(models.PurchaseInvoice.id == return_invoice.return_against).first()
        if original_invoice:
            # Reduce outstanding on original invoice
            # Total amount is negative, so we add it? No, outstanding is positive.
            # If outstanding is 100, and return is -20. New outstanding is 80.
            original_invoice.outstanding_amount += return_invoice.total_amount
            if original_invoice.outstanding_amount < 0:
                original_invoice.outstanding_amount = 0 # Floor at 0
            
            if original_invoice.outstanding_amount == 0:
                original_invoice.status = "Paid" # Or "Returned"
    
    db.commit()
    
    return {"message": "Purchase Return submitted successfully", "status": "Return"}

