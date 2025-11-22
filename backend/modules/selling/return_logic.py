from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from datetime import date
from . import invoice_models

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_sales_return(invoice_id: int, db: Session):
    """Create a Sales Return (Credit Note) against a Sales Invoice"""
    # 1. Fetch original invoice
    original_invoice = db.query(invoice_models.SalesInvoice).filter(invoice_models.SalesInvoice.id == invoice_id).first()
    if not original_invoice:
        raise HTTPException(status_code=404, detail="Sales Invoice not found")
    
    if original_invoice.status != "Submitted" and original_invoice.status != "Paid" and original_invoice.status != "Overdue":
            raise HTTPException(status_code=400, detail="Invoice must be Submitted or Paid to create a return")

    if original_invoice.is_return:
        raise HTTPException(status_code=400, detail="Cannot create a return against a return invoice")

    # 2. Create Return Invoice (Credit Note)
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
    
    return_invoice = invoice_models.SalesInvoice(
        customer_id=original_invoice.customer_id,
        sales_order_id=original_invoice.sales_order_id, # Link to original SO if needed
        posting_date=date.today(),
        due_date=date.today(), # Returns usually due immediately
        total_amount=total_amount,
        grand_total=total_amount,
        outstanding_amount=total_amount, # Negative outstanding means we owe them
        status="Draft",
        is_return=True,
        return_against=original_invoice.id
    )
    db.add(return_invoice)
    db.commit()
    db.refresh(return_invoice)
    
    # Add Items
    for item_data in return_items:
        db_item = invoice_models.SalesInvoiceItem(
            sales_invoice_id=return_invoice.id,
            **item_data
        )
        db.add(db_item)
        
    db.commit()
    
    return {"message": "Sales Return (Credit Note) created", "invoice_id": return_invoice.id}

def submit_sales_return(invoice_id: int, db: Session):
    """Submit a Sales Return: Update Stock (In) and GL (Reverse)"""
    return_invoice = db.query(invoice_models.SalesInvoice).filter(invoice_models.SalesInvoice.id == invoice_id).first()
    
    if not return_invoice:
        raise HTTPException(status_code=404, detail="Sales Invoice not found")
    
    if not return_invoice.is_return:
            raise HTTPException(status_code=400, detail="This is not a return invoice")
            
    if return_invoice.status != "Draft":
        raise HTTPException(status_code=400, detail="Return Invoice must be in Draft status")
        
    # 1. Create Stock Entry (Material Receipt - Return)
    # Items coming back IN to warehouse
    from modules.stock.router import create_stock_entry_with_ledger
    
    stock_entry_data = {
        'transaction_date': return_invoice.posting_date,
        'purpose': "Sales Return", # This acts like a Receipt
        'voucher_type': "Sales Return",
        'items': []
    }
    
    for item in return_invoice.items:
        # Qty in return invoice is negative, but for stock entry we want positive movement INTO warehouse
        # Logic: If we sold 5 (OUT), Return is -5. 
        # Stock Entry for Return means +5 IN.
        # So we take absolute value of qty
        stock_entry_data['items'].append({
            'item_code': item.item_code,
            'qty': abs(item.qty), 
            'basic_rate': item.rate
        })
        
    create_stock_entry_with_ledger(db, stock_entry_data)
    
    # 2. Create GL Entries (Reverse Revenue)
    # Debit: Income (Revenue) - Reduce Income
    # Credit: Debtors (Asset) - Reduce Receivable (since we owe them or they don't owe us)
    from modules.accounts.models import JournalEntry, JournalEntryAccount
    
    je = JournalEntry(
        posting_date=return_invoice.posting_date,
        title=f"Sales Return #{return_invoice.id}",
        total_debit=abs(return_invoice.total_amount),
        total_credit=abs(return_invoice.total_amount),
        status="Submitted",
        docstatus=1
    )
    db.add(je)
    db.commit()
    db.refresh(je)
    
    # Debit Income (Account ID 6 for Sales)
    db.add(JournalEntryAccount(journal_entry_id=je.id, account_id=6, debit=abs(return_invoice.total_amount), credit=0))
    
    # Credit Debtors (Account ID 1 for Debtors)
    db.add(JournalEntryAccount(journal_entry_id=je.id, account_id=1, debit=0, credit=abs(return_invoice.total_amount)))
    
    # 3. Update Invoice Status
    return_invoice.status = "Return"
    
    # 4. Update Original Invoice Outstanding (if linked)
    if return_invoice.return_against:
        original_invoice = db.query(invoice_models.SalesInvoice).filter(invoice_models.SalesInvoice.id == return_invoice.return_against).first()
        if original_invoice:
            # Reduce outstanding on original invoice
            # Total amount is negative, so we add it? No, outstanding is positive.
            # If outstanding is 100, and return is -20. New outstanding is 80.
            # So we add the negative amount.
            original_invoice.outstanding_amount += return_invoice.total_amount
            if original_invoice.outstanding_amount < 0:
                original_invoice.outstanding_amount = 0 # Floor at 0
            
            if original_invoice.outstanding_amount == 0:
                original_invoice.status = "Paid" # Or "Returned" / "Credit Note Issued"
    
    db.commit()
    
    return {"message": "Sales Return submitted successfully", "status": "Return"}

