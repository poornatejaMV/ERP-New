from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class SerialNo(Base):
    """Serial Number Master"""
    __tablename__ = "serial_nos"

    id = Column(Integer, primary_key=True, index=True)
    serial_no = Column(String, index=True, nullable=False)
    item_code = Column(String, ForeignKey("items.item_code"), nullable=False)
    warehouse = Column(String, nullable=True) # Current warehouse
    status = Column(String, default="Active") # Active, Inactive, Expired, Sold
    purchase_date = Column(Date, nullable=True)
    warranty_expiry_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Batch(Base):
    """Batch Master"""
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, index=True, nullable=False)
    item_code = Column(String, ForeignKey("items.item_code"), nullable=False)
    expiry_date = Column(Date, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

