from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class BOM(Base):
    """Bill of Materials - Recipe for manufacturing"""
    __tablename__ = "boms"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String, nullable=False, index=True)  # Finished goods item
    bom_name = Column(String)
    quantity = Column(Float, default=1.0)  # Quantity this BOM produces
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    items = relationship("BOMItem", back_populates="bom", cascade="all, delete-orphan")
    operations = relationship("BOMOperation", back_populates="bom", cascade="all, delete-orphan")

class BOMItem(Base):
    """Raw materials/sub-assemblies required for BOM"""
    __tablename__ = "bom_items"

    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("boms.id"))
    item_code = Column(String, nullable=False)
    qty = Column(Float, nullable=False)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    
    bom = relationship("BOM", back_populates="items")

class BOMOperation(Base):
    """Manufacturing operations/steps"""
    __tablename__ = "bom_operations"

    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("boms.id"))
    operation_name = Column(String)
    workstation = Column(String, nullable=True)
    time_in_mins = Column(Float, default=0.0)
    operating_cost = Column(Float, default=0.0)
    sequence = Column(Integer, default=0)
    
    bom = relationship("BOM", back_populates="operations")

class WorkOrder(Base):
    """Production Work Order"""
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    production_item = Column(String, nullable=False)
    bom_id = Column(Integer, ForeignKey("boms.id"), nullable=True)
    qty_to_manufacture = Column(Float, nullable=False)
    qty_manufactured = Column(Float, default=0.0)
    planned_start_date = Column(Date)
    status = Column(String, default="Draft")  # Draft, In Progress, Completed, Cancelled
    warehouse = Column(String, default="Main Store")
    fg_warehouse = Column(String, default="Finished Goods")  # Finished Goods warehouse
    wip_warehouse = Column(String, default="Work In Progress")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    material_requests = relationship("WorkOrderMaterial", back_populates="work_order", cascade="all, delete-orphan")

class WorkOrderMaterial(Base):
    """Materials required for Work Order"""
    __tablename__ = "work_order_materials"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"))
    item_code = Column(String, nullable=False)
    required_qty = Column(Float, nullable=False)
    consumed_qty = Column(Float, default=0.0)
    source_warehouse = Column(String, default="Main Store")
    
    work_order = relationship("WorkOrder", back_populates="material_requests")
