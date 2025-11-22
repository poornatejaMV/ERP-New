from typing import List, Optional
from pydantic import BaseModel

class LeadBase(BaseModel):
    lead_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str = "Lead"

class LeadCreate(LeadBase):
    pass

class Lead(LeadBase):
    id: int

    class Config:
        from_attributes = True

class OpportunityBase(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    opportunity_amount: float = 0.0
    status: str = "Open"

class OpportunityCreate(OpportunityBase):
    pass

class Opportunity(OpportunityBase):
    id: int

    class Config:
        from_attributes = True
