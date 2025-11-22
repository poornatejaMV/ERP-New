from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String, unique=True, index=True)
    item_name = Column(String, index=True)
    description = Column(String, nullable=True)
    standard_rate = Column(Float, default=0.0)
    uom = Column(String, default="Nos")
    is_stock_item = Column(Boolean, default=True)
    has_serial_no = Column(Boolean, default=False)
    has_batch_no = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # In a real ERP, we'd have more complex relationships, but this is a start.
