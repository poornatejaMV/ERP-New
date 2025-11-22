"""
Setup Module Router
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from core.auth import get_current_active_user
from models import User
from . import models, schemas

router = APIRouter(
    prefix="/setup",
    tags=["setup"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Company endpoints
@router.post("/companies/", response_model=schemas.Company)
def create_company(
    company: schemas.CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new company"""
    db_company = models.Company(**company.dict())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


@router.get("/companies/", response_model=List[schemas.Company])
def read_companies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all companies"""
    companies = db.query(models.Company).offset(skip).limit(limit).all()
    return companies


@router.get("/companies/{company_id}", response_model=schemas.Company)
def read_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a company by ID"""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


# Fiscal Year endpoints
@router.post("/fiscal-years/", response_model=schemas.FiscalYear)
def create_fiscal_year(
    fiscal_year: schemas.FiscalYearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new fiscal year"""
    db_fy = models.FiscalYear(**fiscal_year.dict())
    db.add(db_fy)
    db.commit()
    db.refresh(db_fy)
    return db_fy


@router.get("/fiscal-years/", response_model=List[schemas.FiscalYear])
def read_fiscal_years(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all fiscal years"""
    fiscal_years = db.query(models.FiscalYear).offset(skip).limit(limit).all()
    return fiscal_years


# Currency endpoints
@router.post("/currencies/", response_model=schemas.Currency)
def create_currency(
    currency: schemas.CurrencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new currency"""
    db_currency = models.Currency(**currency.dict())
    db.add(db_currency)
    db.commit()
    db.refresh(db_currency)
    return db_currency


@router.get("/currencies/", response_model=List[schemas.Currency])
def read_currencies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all currencies"""
    currencies = db.query(models.Currency).offset(skip).limit(limit).all()
    return currencies


# Cost Center endpoints
@router.post("/cost-centers/", response_model=schemas.CostCenter)
def create_cost_center(
    cost_center: schemas.CostCenterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new cost center"""
    db_cc = models.CostCenter(**cost_center.dict())
    db.add(db_cc)
    db.commit()
    db.refresh(db_cc)
    return db_cc


@router.get("/cost-centers/", response_model=List[schemas.CostCenter])
def read_cost_centers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all cost centers"""
    cost_centers = db.query(models.CostCenter).offset(skip).limit(limit).all()
    return cost_centers


# Item Group endpoints
@router.post("/item-groups/", response_model=schemas.ItemGroup)
def create_item_group(
    item_group: schemas.ItemGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new item group"""
    db_ig = models.ItemGroup(**item_group.dict())
    db.add(db_ig)
    db.commit()
    db.refresh(db_ig)
    return db_ig


@router.get("/item-groups/", response_model=List[schemas.ItemGroup])
def read_item_groups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all item groups"""
    item_groups = db.query(models.ItemGroup).offset(skip).limit(limit).all()
    return item_groups


# Customer Group endpoints
@router.post("/customer-groups/", response_model=schemas.CustomerGroup)
def create_customer_group(
    customer_group: schemas.CustomerGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new customer group"""
    db_cg = models.CustomerGroup(**customer_group.dict())
    db.add(db_cg)
    db.commit()
    db.refresh(db_cg)
    return db_cg


@router.get("/customer-groups/", response_model=List[schemas.CustomerGroup])
def read_customer_groups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all customer groups"""
    customer_groups = db.query(models.CustomerGroup).offset(skip).limit(limit).all()
    return customer_groups


# Supplier Group endpoints
@router.post("/supplier-groups/", response_model=schemas.SupplierGroup)
def create_supplier_group(
    supplier_group: schemas.SupplierGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new supplier group"""
    db_sg = models.SupplierGroup(**supplier_group.dict())
    db.add(db_sg)
    db.commit()
    db.refresh(db_sg)
    return db_sg


@router.get("/supplier-groups/", response_model=List[schemas.SupplierGroup])
def read_supplier_groups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all supplier groups"""
    supplier_groups = db.query(models.SupplierGroup).offset(skip).limit(limit).all()
    return supplier_groups


# Price List endpoints
@router.post("/price-lists/", response_model=schemas.PriceList)
def create_price_list(
    price_list: schemas.PriceListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new price list"""
    db_pl = models.PriceList(**price_list.dict())
    db.add(db_pl)
    db.commit()
    db.refresh(db_pl)
    return db_pl

@router.get("/price-lists/", response_model=List[schemas.PriceList])
def read_price_lists(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all price lists"""
    price_lists = db.query(models.PriceList).offset(skip).limit(limit).all()
    return price_lists
