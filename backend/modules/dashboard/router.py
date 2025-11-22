from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get key metrics for dashboard"""
    from modules.selling.invoice_models import SalesInvoice
    from modules.buying.models import PurchaseInvoice
    from modules.stock.models import StockLedgerEntry
    from modules.accounts.models import Account
    from modules.selling.models import SalesOrder, Customer
    from modules.buying.models import PurchaseOrder, Supplier
    
    # Sales metrics
    total_sales = db.query(func.sum(SalesInvoice.grand_total)).scalar() or 0.0
    sales_count = db.query(func.count(SalesInvoice.id)).scalar() or 0
    outstanding_receivables = db.query(func.sum(SalesInvoice.outstanding_amount)).scalar() or 0.0
    
    # Purchase metrics
    total_purchases = db.query(func.sum(PurchaseInvoice.grand_total)).scalar() or 0.0
    purchase_count = db.query(func.count(PurchaseInvoice.id)).scalar() or 0
    outstanding_payables = db.query(func.sum(PurchaseInvoice.outstanding_amount)).scalar() or 0.0
    
    # Stock metrics
    subquery = db.query(
        StockLedgerEntry.item_code,
        func.max(StockLedgerEntry.id).label('latest_id')
    ).group_by(StockLedgerEntry.item_code).subquery()
    
    stock_entries = db.query(StockLedgerEntry).join(
        subquery,
        (StockLedgerEntry.item_code == subquery.c.item_code) &
        (StockLedgerEntry.id == subquery.c.latest_id)
    ).all()
    
    inventory_value = sum([entry.stock_value for entry in stock_entries])
    total_items = len(stock_entries)
    
    # Net profit (simple calculation)
    net_profit = total_sales - total_purchases
    
    # Counts
    customer_count = db.query(func.count(Customer.id)).scalar() or 0
    supplier_count = db.query(func.count(Supplier.id)).scalar() or 0
    
    # Recent orders
    recent_sales_orders = db.query(SalesOrder).order_by(SalesOrder.id.desc()).limit(5).all()
    recent_purchase_orders = db.query(PurchaseOrder).order_by(PurchaseOrder.id.desc()).limit(5).all()
    
    # Chart Data: Sales Trends (Last 6 months)
    from datetime import datetime, timedelta
    from sqlalchemy import extract
    
    today = datetime.now()
    chart_sales_trend = []
    
    for i in range(5, -1, -1):
        month_date = today - timedelta(days=30 * i)
        month_name = month_date.strftime("%B")
        month_num = month_date.month
        year_num = month_date.year
        
        monthly_sales = db.query(func.sum(SalesInvoice.grand_total)).filter(
            extract('month', SalesInvoice.posting_date) == month_num,
            extract('year', SalesInvoice.posting_date) == year_num
        ).scalar() or 0.0
        
        chart_sales_trend.append({"month": month_name, "sales": float(monthly_sales)})

    # Chart Data: Stock Value by Warehouse
    warehouse_stock_value = []
    warehouses = db.query(StockLedgerEntry.warehouse).distinct().all()
    
    for wh in warehouses:
        wh_name = wh[0]
        # Get latest entry for each item in this warehouse
        subquery_wh = db.query(
            StockLedgerEntry.item_code,
            func.max(StockLedgerEntry.id).label('latest_id')
        ).filter(StockLedgerEntry.warehouse == wh_name).group_by(StockLedgerEntry.item_code).subquery()
        
        entries = db.query(StockLedgerEntry).join(
            subquery_wh,
            (StockLedgerEntry.item_code == subquery_wh.c.item_code) &
            (StockLedgerEntry.id == subquery_wh.c.latest_id)
        ).all()
        
        val = sum([e.stock_value for e in entries])
        if val > 0:
            warehouse_stock_value.append({"name": wh_name, "value": float(val)})

    return {
        "sales": {
            "total": float(total_sales),
            "count": sales_count,
            "outstanding_receivables": float(outstanding_receivables)
        },
        "purchases": {
            "total": float(total_purchases),
            "count": purchase_count,
            "outstanding_payables": float(outstanding_payables)
        },
        "inventory": {
            "value": float(inventory_value),
            "items": total_items
        },
        "profit": {
            "net_profit": float(net_profit),
            "margin": (net_profit / total_sales * 100) if total_sales > 0 else 0.0
        },
        "counts": {
            "customers": customer_count,
            "suppliers": supplier_count
        },
        "recent_sales_orders": [
            {
                "id": so.id,
                "customer_id": so.customer_id,
                "total_amount": so.total_amount,
                "status": so.status,
                "date": str(so.transaction_date)
            } for so in recent_sales_orders
        ],
        "recent_purchase_orders": [
            {
                "id": po.id,
                "supplier_id": po.supplier_id,
                "total_amount": po.total_amount,
                "status": po.status,
                "date": str(po.transaction_date)
            } for po in recent_purchase_orders
        ],
        "charts": {
            "sales_trend": chart_sales_trend,
            "stock_by_warehouse": warehouse_stock_value
        }
    }
