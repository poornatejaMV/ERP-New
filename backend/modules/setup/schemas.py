"""
Setup Module Schemas
"""
from typing import Optional
from pydantic import BaseModel
from datetime import date, datetime


class CompanyBase(BaseModel):
    company_name: str
    abbr: Optional[str] = None
    default_currency: str = "USD"
    country: Optional[str] = None
    is_group: bool = False
    parent_company_id: Optional[int] = None
    is_active: bool = True


class CompanyCreate(CompanyBase):
    pass


class Company(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FiscalYearBase(BaseModel):
    year: str
    year_start_date: date
    year_end_date: date
    is_active: bool = True
    is_closed: bool = False
    company_id: Optional[int] = None


class FiscalYearCreate(FiscalYearBase):
    pass


class FiscalYear(FiscalYearBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class CurrencyBase(BaseModel):
    currency_name: str
    currency_symbol: Optional[str] = None
    fraction_units: int = 2
    is_active: bool = True


class CurrencyCreate(CurrencyBase):
    pass


class Currency(CurrencyBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ExchangeRateBase(BaseModel):
    from_currency: str
    to_currency: str
    exchange_rate: float
    date: date


class ExchangeRateCreate(ExchangeRateBase):
    pass


class ExchangeRate(ExchangeRateBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class CostCenterBase(BaseModel):
    cost_center_name: str
    parent_cost_center_id: Optional[int] = None
    is_group: bool = False
    company_id: Optional[int] = None
    is_active: bool = True


class CostCenterCreate(CostCenterBase):
    pass


class CostCenter(CostCenterBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TerritoryBase(BaseModel):
    territory_name: str
    parent_territory_id: Optional[int] = None
    is_group: bool = False
    is_active: bool = True


class TerritoryCreate(TerritoryBase):
    pass


class Territory(TerritoryBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ItemGroupBase(BaseModel):
    item_group_name: str
    parent_item_group_id: Optional[int] = None
    is_group: bool = False
    is_active: bool = True


class ItemGroupCreate(ItemGroupBase):
    pass


class ItemGroup(ItemGroupBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class CustomerGroupBase(BaseModel):
    customer_group_name: str
    parent_customer_group_id: Optional[int] = None
    is_group: bool = False
    is_active: bool = True


class CustomerGroupCreate(CustomerGroupBase):
    pass


class CustomerGroup(CustomerGroupBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class SupplierGroupBase(BaseModel):
    supplier_group_name: str
    parent_supplier_group_id: Optional[int] = None
    is_group: bool = False
    is_active: bool = True


class SupplierGroupCreate(SupplierGroupBase):
    pass


class SupplierGroup(SupplierGroupBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class PriceListBase(BaseModel):
    price_list_name: str
    enabled: bool = True
    buying: bool = False
    selling: bool = False
    currency: str = "USD"

class PriceListCreate(PriceListBase):
    pass

class PriceList(PriceListBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    employee_name: str
    employee_number: Optional[str] = None
    company_id: Optional[int] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
