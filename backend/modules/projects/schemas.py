from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# Project
class ProjectBase(BaseModel):
    project_name: str
    status: str = "Open"
    expected_start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    is_active: bool = True

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Task
class TaskBase(BaseModel):
    subject: str
    project_id: Optional[int] = None
    status: str = "Open"
    priority: str = "Medium"
    exp_start_date: Optional[date] = None
    exp_end_date: Optional[date] = None
    description: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Timesheet
class TimesheetDetailBase(BaseModel):
    activity_type: Optional[str] = None
    from_time: Optional[datetime] = None
    to_time: Optional[datetime] = None
    hours: float = 0.0
    project_id: Optional[int] = None
    task_id: Optional[int] = None

class TimesheetDetailCreate(TimesheetDetailBase):
    pass

class TimesheetDetail(TimesheetDetailBase):
    id: int
    class Config:
        from_attributes = True

class TimesheetBase(BaseModel):
    employee_id: int
    start_date: date
    end_date: date
    status: str = "Draft"
    total_hours: float = 0.0

class TimesheetCreate(TimesheetBase):
    details: List[TimesheetDetailCreate] = []

class Timesheet(TimesheetBase):
    id: int
    created_at: datetime
    details: List[TimesheetDetail] = []
    
    class Config:
        from_attributes = True

