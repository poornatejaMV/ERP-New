from typing import List, Optional
from pydantic import BaseModel
from datetime import date

# BOM Schemas
class BOMItemCreate(BaseModel):
    item_code: str
    qty: float
    rate: float = 0.0

class BOMItem(BOMItemCreate):
    id: int
    bom_id: int
    amount: float

    class Config:
        from_attributes = True

class BOMOperationCreate(BaseModel):
    operation_name: str
    workstation: Optional[str] = None
    time_in_mins: float = 0.0
    operating_cost: float = 0.0
    sequence: int = 0

class BOMOperation(BOMOperationCreate):
    id: int
    bom_id: int

    class Config:
        from_attributes = True

class BOMCreate(BaseModel):
    item_code: str
    bom_name: Optional[str] = None
    quantity: float = 1.0
    items: List[BOMItemCreate] = []
    operations: List[BOMOperationCreate] = []

class BOM(BaseModel):
    id: int
    item_code: str
    bom_name: Optional[str]
    quantity: float
    is_active: bool
    is_default: bool
    items: List[BOMItem] = []
    operations: List[BOMOperation] = []

    class Config:
        from_attributes = True

# Work Order Schemas
class WorkOrderMaterialCreate(BaseModel):
    item_code: str
    required_qty: float
    source_warehouse: str = "Main Store"

class WorkOrderMaterial(WorkOrderMaterialCreate):
    id: int
    work_order_id: int
    consumed_qty: float

    class Config:
        from_attributes = True

class WorkOrderCreate(BaseModel):
    production_item: str
    bom_id: Optional[int] = None
    qty_to_manufacture: float
    planned_start_date: date
    warehouse: str = "Main Store"
    fg_warehouse: str = "Finished Goods"
    wip_warehouse: str = "Work In Progress"

class WorkOrder(BaseModel):
    id: int
    production_item: str
    bom_id: Optional[int]
    qty_to_manufacture: float
    qty_manufactured: float
    planned_start_date: date
    status: str
    warehouse: str
    fg_warehouse: str
    wip_warehouse: str
    material_requests: List[WorkOrderMaterial] = []

    class Config:
        from_attributes = True
