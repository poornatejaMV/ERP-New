from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import SessionLocal
from core.auth import get_current_active_user
from core.document_lifecycle import submit_document, cancel_document, can_submit, can_cancel
from core.numbering import get_next_number
from models import User
from . import models, schemas
from . import invoice_schemas
from utils.pdf_generator import generate_pdf
from modules.setup.models import Company

router = APIRouter(
    prefix="/selling",
    tags=["selling"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/invoices/{invoice_id}/pdf")
def get_sales_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate PDF for Sales Invoice"""
    # 1. Fetch Invoice
    from .invoice_models import SalesInvoice
    invoice = db.query(SalesInvoice).filter(SalesInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # 2. Fetch Company (Assume single company or linked company)
    # Ideally invoice should have company_id, but for now we take the first one or default
    company = db.query(Company).first()
    if not company:
        # Fallback dummy company
        company = type('obj', (object,), {'company_name': 'My ERP Company', 'country': 'Country'})
        
    # 3. Prepare Data
    doc_data = {
        'doc_type': 'Sales Invoice',
        'doc': {
            'name': f"SINV-{invoice.id}", # Placeholder name if not set
            'id': invoice.id,
            'transaction_date': invoice.posting_date,
            'due_date': invoice.due_date,
            'status': invoice.status,
            'total_amount': invoice.total_amount,
            'customer_name': 'Customer' # We need to fetch customer name relation
        },
        'company': company,
        'items': []
    }
    
    # Fetch Customer Name if possible
    if invoice.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == invoice.customer_id).first()
        if customer:
            doc_data['doc']['customer_name'] = customer.customer_name
            
    # Map items
    for item in invoice.items:
        doc_data['items'].append({
            'item_code': item.item_code,
            'item_name': item.item_code, # Fetch name if available
            'qty': item.qty,
            'rate': item.rate,
            'amount': item.amount
        })

    # 4. Generate PDF
    pdf_bytes = generate_pdf(doc_data)
    
    # 5. Return Response
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Invoice-{invoice_id}.pdf"}
    )

@router.post("/customers/", response_model=schemas.Customer)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/customers/", response_model=List[schemas.Customer])
def read_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    customers = db.query(models.Customer).offset(skip).limit(limit).all()
    return customers

@router.post("/orders/", response_model=schemas.SalesOrder)
def create_sales_order(
    order: schemas.SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new Sales Order (Draft)"""
    # Generate document number
    doc_name = get_next_number(db, "Sales Order", date=order.transaction_date)
    
    # Calculate total amount from items
    total_amount = sum(item.amount for item in order.items)
    
    # Calculate Taxes
    total_taxes_and_charges = 0.0
    grand_total = total_amount
    
    if order.tax_template_id:
        from modules.accounts.tax_models import SalesTaxTemplate
        template = db.query(SalesTaxTemplate).filter(SalesTaxTemplate.id == order.tax_template_id).first()
        if template:
            for tax in template.taxes:
                total_taxes_and_charges += (total_amount * tax.rate) / 100.0
    
    grand_total = total_amount + total_taxes_and_charges
    
    db_order = models.SalesOrder(
        name=doc_name,
        customer_id=order.customer_id,
        transaction_date=order.transaction_date,
        total_amount=total_amount,
        total_taxes_and_charges=total_taxes_and_charges,
        grand_total=grand_total,
        tax_template_id=order.tax_template_id,
        docstatus=0,  # Draft
        status="Draft"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for item in order.items:
        db_item = models.SalesOrderItem(
            sales_order_id=db_order.id,
            **item.dict()
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/orders/", response_model=List[schemas.SalesOrder])
def read_sales_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all sales orders"""
    orders = db.query(models.SalesOrder).order_by(
        models.SalesOrder.transaction_date.desc()
    ).offset(skip).limit(limit).all()
    return orders


@router.get("/orders/{order_id}", response_model=schemas.SalesOrder)
def read_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a sales order by ID"""
    order = db.query(models.SalesOrder).filter(models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sales Order not found")
    return order

@router.post("/orders/{order_id}/submit")
def submit_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submit a sales order"""
    order = db.query(models.SalesOrder).filter(models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if not can_submit(order):
        raise HTTPException(
            status_code=400,
            detail="Order cannot be submitted. It must be in Draft status."
        )
    
    # Validate order has items
    if not order.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")
    
    # Submit the document
    submit_document(db, order, current_user.id)
    
    # TODO: Create stock reservation or other business logic here
    
    return {"message": "Sales Order submitted successfully", "status": order.status}

@router.post("/orders/{order_id}/make-delivery")
def make_delivery_note(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a delivery note from a sales order"""
    # 1. Fetch Order
    order = db.query(models.SalesOrder).filter(models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.docstatus != 1:  # Must be Submitted
        raise HTTPException(status_code=400, detail="Order must be Submitted first")
    if order.delivery_status == "Fully Delivered":
        raise HTTPException(status_code=400, detail="Order already delivered")

    # 2. Create Stock Entry (Material Issue) with Ledger
    from modules.stock.router import create_stock_entry_with_ledger
    
    stock_entry_data = {
        'transaction_date': order.transaction_date,
        'purpose': "Material Issue",
        'voucher_type': "Sales Order",
        'warehouse': "Stores", # Default to Stores for now
        'items': [{
            'item_code': item.item_code,
            'qty': item.qty,
            'basic_rate': item.rate
        } for item in order.items]
    }
    stock_entry = create_stock_entry_with_ledger(db, stock_entry_data)
    
    # 3. Create Delivery Note
    from .delivery_models import DeliveryNote, DeliveryNoteItem
    
    delivery_note = DeliveryNote(
        name=f"DN-{order.name}", # Simple naming for now
        sales_order_id=order.id,
        customer_id=order.customer_id,
        posting_date=order.transaction_date,
        total_amount=order.total_amount,
        status="Submitted"
    )
    db.add(delivery_note)
    db.commit()
    db.refresh(delivery_note)

    for item in order.items:
        dn_item = DeliveryNoteItem(
            delivery_note_id=delivery_note.id,
            item_code=item.item_code,
            qty=item.qty,
            rate=item.rate,
            amount=item.amount
        )
        db.add(dn_item)
    
    # 4. Update Order Status
    order.delivery_status = "Fully Delivered"
    db.commit()
    
    return {"message": "Delivery Note created", "stock_entry_id": stock_entry.id, "delivery_note_id": delivery_note.id}

@router.get("/delivery-notes/", response_model=List[Dict[str, Any]])
def read_delivery_notes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all delivery notes"""
    from .delivery_models import DeliveryNote
    notes = db.query(DeliveryNote).order_by(
        DeliveryNote.posting_date.desc()
    ).offset(skip).limit(limit).all()
    return [{
        "id": note.id,
        "name": note.name,
        "sales_order_id": note.sales_order_id,
        "customer_id": note.customer_id,
        "posting_date": note.posting_date.isoformat() if note.posting_date else None,
        "total_amount": note.total_amount,
        "status": note.status
    } for note in notes]

@router.post("/orders/{order_id}/make-invoice")
def make_sales_invoice(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a sales invoice from a sales order"""
    # 1. Fetch Order
    order = db.query(models.SalesOrder).filter(models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.docstatus != 1:  # Must be Submitted
        raise HTTPException(status_code=400, detail="Order must be Submitted first")
    if order.billing_status == "Fully Billed":
        raise HTTPException(status_code=400, detail="Order already billed")

    # 2. Create Sales Invoice
    from .invoice_models import SalesInvoice, SalesInvoiceItem
    from datetime import timedelta
    
    # Calculate Taxes again (or assume order totals are correct, but better to recalc if template changed, though here we use order's)
    # We assume order.grand_total is correct.
    
    # Handle orders created before tax columns were added
    total_taxes = getattr(order, 'total_taxes_and_charges', 0.0) or 0.0
    grand_total = getattr(order, 'grand_total', None) or (order.total_amount + total_taxes)
    
    invoice = SalesInvoice(
        customer_id=order.customer_id,
        sales_order_id=order.id,
        posting_date=order.transaction_date,
        due_date=order.transaction_date + timedelta(days=30),  # 30 days payment term
        total_amount=order.total_amount,
        total_taxes_and_charges=total_taxes,
        grand_total=grand_total,
        outstanding_amount=grand_total,
        tax_template_id=getattr(order, 'tax_template_id', None),
        status="Submitted"
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    for item in order.items:
        invoice_item = SalesInvoiceItem(
            sales_invoice_id=invoice.id,
            item_code=item.item_code,
            qty=item.qty,
            rate=item.rate,
            amount=item.amount
        )
        db.add(invoice_item)
    
    # 3. Create Journal Entry (for accounting)
    from modules.accounts.models import JournalEntry, JournalEntryAccount
    
    je = JournalEntry(
        posting_date=order.transaction_date,
        title=f"Sales Invoice #{invoice.id}",
        total_debit=grand_total,
        total_credit=grand_total
    )
    db.add(je)
    db.commit()
    db.refresh(je)

    # Debit Debtors (placeholder account_id=1)
    db.add(JournalEntryAccount(journal_entry_id=je.id, account_id=1, debit=grand_total, credit=0))
    # Credit Sales (placeholder account_id=2)
    db.add(JournalEntryAccount(journal_entry_id=je.id, account_id=2, debit=0, credit=order.total_amount))
    
    # Credit Taxes
    tax_template_id = getattr(order, 'tax_template_id', None)
    if tax_template_id:
        from modules.accounts.tax_models import SalesTaxTemplate
        template = db.query(SalesTaxTemplate).filter(SalesTaxTemplate.id == tax_template_id).first()
        if template:
            for tax in template.taxes:
                tax_amt = (order.total_amount * tax.rate) / 100.0
                if tax_amt > 0:
                    db.add(JournalEntryAccount(journal_entry_id=je.id, account_id=tax.account_id, debit=0, credit=tax_amt))

    # 4. Create Payment Ledger Entry (Receivable)
    from modules.accounts.payment_ledger_utils import make_payment_ledger_entry
    customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()
    party_name = customer.customer_name if customer else "Unknown"
    
    make_payment_ledger_entry(
        db=db,
        posting_date=order.transaction_date,
        account_type="Receivable",
        account_id=1, # Debtors
        party_type="Customer",
        party=party_name,
        voucher_type="Sales Invoice",
        voucher_no=str(invoice.id),
        amount=grand_total,
        company_id=1 
    )

    # 5. Deduct Stock IF NOT Delivered
    # ERPNext Logic: If Delivery Note exists, stock is already deducted. If not, Sales Invoice deducts stock (Update Stock = 1).
    # For simplicity, if delivery_status is "Not Delivered", we deduct stock here.
    # Ideally, we should have an "Update Stock" checkbox.
    if order.delivery_status == "Not Delivered":
        from modules.stock.router import create_stock_entry_with_ledger
        
        stock_entry_data = {
            'transaction_date': order.transaction_date,
            'purpose': "Material Issue",
            'voucher_type': "Sales Invoice", # Use Invoice as voucher type
            'warehouse': "Stores",
            'items': [{
                'item_code': item.item_code,
                'qty': item.qty,
                'basic_rate': item.rate
            } for item in order.items]
        }
        create_stock_entry_with_ledger(db, stock_entry_data)
        # We mark as delivered implicitly for stock purposes, but let's keep delivery_status tracking physical delivery.
        # In strict ERP, we might update delivery_status only if we create a Delivery Note.
        # Here, let's say if you invoice without delivery, you still need to deliver physically, but stock is out (e.g. POS).
        # For now, let's NOT update order.delivery_status to avoid confusion with Delivery Note flow.

    # 5. Update Order Status
    order.billing_status = "Fully Billed"
    if order.delivery_status == "Fully Delivered":
        order.status = "Completed"
        
    db.commit()
    
    return {"message": "Sales Invoice created", "invoice_id": invoice.id, "journal_entry_id": je.id}

# Sales Invoice CRUD
@router.post("/invoices/", response_model=invoice_schemas.SalesInvoice)
def create_sales_invoice(invoice: invoice_schemas.SalesInvoiceCreate, db: Session = Depends(get_db)):
    from .invoice_models import SalesInvoice, SalesInvoiceItem
    
    # Calculate total amount from items
    total_amount = sum(item.amount for item in invoice.items)
    
    # Calculate Taxes
    total_taxes_and_charges = 0.0
    grand_total = total_amount
    
    if invoice.tax_template_id:
        from modules.accounts.tax_models import SalesTaxTemplate
        template = db.query(SalesTaxTemplate).filter(SalesTaxTemplate.id == invoice.tax_template_id).first()
        if template:
            for tax in template.taxes:
                total_taxes_and_charges += (total_amount * tax.rate) / 100.0
    
    grand_total = total_amount + total_taxes_and_charges
    
    # Create Invoice Dict and override totals
    invoice_data = invoice.dict(exclude={'items'})
    invoice_data['total_amount'] = total_amount
    invoice_data['total_taxes_and_charges'] = total_taxes_and_charges
    invoice_data['grand_total'] = grand_total
    invoice_data['outstanding_amount'] = grand_total
    
    db_invoice = SalesInvoice(**invoice_data)
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    for item_data in invoice.items:
        db_item = SalesInvoiceItem(
            sales_invoice_id=db_invoice.id,
            **item_data.dict()
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

# Import Return Logic
from .return_logic import create_sales_return, submit_sales_return

@router.post("/invoices/{invoice_id}/return")
def create_return_endpoint(invoice_id: int, db: Session = Depends(get_db)):
    return create_sales_return(invoice_id, db)

@router.post("/invoices/{invoice_id}/submit-return")
def submit_return_endpoint(invoice_id: int, db: Session = Depends(get_db)):
    return submit_sales_return(invoice_id, db)

@router.get("/invoices/", response_model=List[invoice_schemas.SalesInvoice])
def read_sales_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    from .invoice_models import SalesInvoice
    invoices = db.query(SalesInvoice).offset(skip).limit(limit).all()
    return invoices

@router.get("/invoices/{invoice_id}", response_model=invoice_schemas.SalesInvoice)
def read_sales_invoice(invoice_id: int, db: Session = Depends(get_db)):
    from .invoice_models import SalesInvoice
    invoice = db.query(SalesInvoice).filter(SalesInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

# Quotations
@router.post("/quotations/", response_model=schemas.Quotation)
def create_quotation(
    quotation: schemas.QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new Quotation"""
    doc_name = get_next_number(db, "Quotation", date=quotation.transaction_date)
    
    # Calculate total
    total_amount = sum(item.amount for item in quotation.items)
    
    # Calculate Taxes
    total_taxes_and_charges = 0.0
    grand_total = total_amount
    
    if quotation.tax_template_id:
        from modules.accounts.tax_models import SalesTaxTemplate
        template = db.query(SalesTaxTemplate).filter(SalesTaxTemplate.id == quotation.tax_template_id).first()
        if template:
            for tax in template.taxes:
                total_taxes_and_charges += (total_amount * tax.rate) / 100.0
    
    grand_total = total_amount + total_taxes_and_charges
    
    db_quotation = models.Quotation(
        name=doc_name,
        customer_id=quotation.customer_id,
        lead_id=quotation.lead_id,
        transaction_date=quotation.transaction_date,
        valid_till=quotation.valid_till,
        total_amount=total_amount,
        total_taxes_and_charges=total_taxes_and_charges,
        grand_total=grand_total,
        tax_template_id=quotation.tax_template_id,
        docstatus=0,
        status="Draft"
    )
    db.add(db_quotation)
    db.commit()
    db.refresh(db_quotation)
    
    for item in quotation.items:
        db_item = models.QuotationItem(
            quotation_id=db_quotation.id,
            **item.dict()
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(db_quotation)
    return db_quotation

@router.get("/quotations/", response_model=List[schemas.Quotation])
def read_quotations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Quotation).offset(skip).limit(limit).all()

@router.post("/quotations/{quotation_id}/submit")
def submit_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    quotation = db.query(models.Quotation).filter(models.Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    submit_document(db, quotation, current_user.id)
    return {"message": "Quotation submitted", "status": quotation.status}

@router.post("/quotations/{quotation_id}/make-sales-order")
def make_sales_order_from_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a Sales Order from a Quotation"""
    quotation = db.query(models.Quotation).filter(models.Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if quotation.docstatus != 1:
        raise HTTPException(status_code=400, detail="Quotation must be submitted")
        
    # Create Sales Order
    from datetime import date
    today = date.today()
    doc_name = get_next_number(db, "Sales Order", date=today)
    
    db_order = models.SalesOrder(
        name=doc_name,
        customer_id=quotation.customer_id, # Must have customer_id (convert lead first if needed)
        transaction_date=today,
        total_amount=quotation.total_amount,
        total_taxes_and_charges=quotation.total_taxes_and_charges,
        grand_total=quotation.grand_total,
        tax_template_id=quotation.tax_template_id,
        docstatus=0,
        status="Draft"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    for item in quotation.items:
        db_item = models.SalesOrderItem(
            sales_order_id=db_order.id,
            item_code=item.item_code,
            qty=item.qty,
            rate=item.rate,
            amount=item.amount
        )
        db.add(db_item)
        
    # Update Quotation
    quotation.status = "Ordered"
    db.commit()
    
    return {"message": "Sales Order created", "sales_order_id": db_order.id}
