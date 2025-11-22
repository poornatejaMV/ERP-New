from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from database import Base

class PriceList(Base):
    __tablename__ = "price_lists"

    id = Column(Integer, primary_key=True, index=True)
    price_list_name = Column(String, unique=True, index=True, nullable=False)
    currency = Column(String, default="USD")
    buying = Column(Boolean, default=False)
    selling = Column(Boolean, default=False)
    enabled = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)

class ItemPrice(Base):
    __tablename__ = "item_prices"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String, index=True, nullable=False)
    price_list_id = Column(Integer, ForeignKey("price_lists.id"))
    rate = Column(Float, default=0.0)
    valid_from = Column(Date, nullable=True)
    
    price_list = relationship("PriceList")

