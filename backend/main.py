from typing import List
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

import models, schemas
from database import SessionLocal, engine
import auth

# Import Routers
from modules.selling import router as selling_router
from modules.buying import router as buying_router
from modules.stock import router as stock_router
from modules.crm import router as crm_router
from modules.accounts import router as accounts_router
from modules.dashboard import router as dashboard_router
from modules.manufacturing import router as manufacturing_router
from modules.hr import router as hr_router
from modules.projects import router as projects_router
from modules.setup import router as setup_router
from modules.assets import router as assets_router

# Import Models for Database Creation
# Note: Importing the base models is sufficient if they import all sub-models
from modules.selling import models as selling_models
from modules.selling.invoice_models import Base as selling_invoice_base
from modules.selling.delivery_models import Base as selling_delivery_base # Import Delivery Note Models
from modules.buying import models as buying_models
from modules.buying.receipt_models import Base as buying_receipt_base # Import Purchase Receipt Models
from modules.stock import models as stock_models
from modules.stock.serial_batch_models import Base as serial_batch_base # Import Serial/Batch Models
from modules.crm import models as crm_models
from modules.accounts import models as accounts_models
from modules.accounts import tax_models as tax_models # Import Tax Models
from modules.accounts.payment_models import Base as accounts_payment_base
from modules.accounts.bank_reconciliation_models import Base as bank_reconciliation_base
from modules.accounts.budget_models import Base as budget_base
from modules.manufacturing import models as manufacturing_models
from modules.hr import models as hr_models
from modules.projects import models as projects_models
from modules.setup import models as setup_models
from modules.assets import models as assets_models

# Create Tables
# Core models
models.Base.metadata.create_all(bind=engine)

# Module models
selling_models.Base.metadata.create_all(bind=engine)
selling_invoice_base.metadata.create_all(bind=engine)
selling_delivery_base.metadata.create_all(bind=engine) # Create Delivery Note Tables
buying_models.Base.metadata.create_all(bind=engine)
buying_receipt_base.metadata.create_all(bind=engine) # Create Purchase Receipt Tables
stock_models.Base.metadata.create_all(bind=engine)
serial_batch_base.metadata.create_all(bind=engine) # Create Serial/Batch Tables
crm_models.Base.metadata.create_all(bind=engine)
accounts_models.Base.metadata.create_all(bind=engine)
tax_models.Base.metadata.create_all(bind=engine) # Create Tax Tables
accounts_payment_base.metadata.create_all(bind=engine)
bank_reconciliation_base.metadata.create_all(bind=engine) # Create Bank Reconciliation Tables
budget_base.metadata.create_all(bind=engine) # Create Budget Tables
manufacturing_models.Base.metadata.create_all(bind=engine)
hr_models.Base.metadata.create_all(bind=engine)
projects_models.Base.metadata.create_all(bind=engine)
setup_models.Base.metadata.create_all(bind=engine)
assets_models.Base.metadata.create_all(bind=engine) # Create Asset Tables

app = FastAPI(title="NextFastAPI ERP")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(setup_router.router)
app.include_router(selling_router.router)
app.include_router(buying_router.router)
app.include_router(stock_router.router)
app.include_router(crm_router.router)
app.include_router(accounts_router.router)
app.include_router(dashboard_router.router)
app.include_router(manufacturing_router.router)
app.include_router(hr_router.router)
app.include_router(projects_router.router)
app.include_router(assets_router.router)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Global Item Routes (Consider moving to a separate 'stock' or 'setup' module if it grows)
@app.post("/items/", response_model=schemas.Item)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    db_item = models.Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/items/", response_model=List[schemas.Item])
def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = db.query(models.Item).offset(skip).limit(limit).all()
    return items

@app.get("/items/{item_id}", response_model=schemas.Item)
def read_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@app.get("/")
def read_root():
    return {"message": "Welcome to NextFastAPI ERP"}

# Create Quotation Tables
from modules.selling import models as selling_models
selling_models.Base.metadata.create_all(bind=engine)

# Create Material Request Tables
from modules.stock import models as stock_models
stock_models.Base.metadata.create_all(bind=engine)

# Re-create Stock Tables (for Reconciliation)
stock_models.Base.metadata.create_all(bind=engine)

# Create Stock Reconciliation Tables
from modules.stock import models as stock_models
stock_models.Base.metadata.create_all(bind=engine)
