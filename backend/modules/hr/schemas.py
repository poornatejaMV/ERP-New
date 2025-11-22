from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# Department
class DepartmentBase(BaseModel):
    department_name: str
    parent_department_id: Optional[int] = None
    is_group: bool = False

class DepartmentCreate(DepartmentBase):
    pass

class Department(DepartmentBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Designation
class DesignationBase(BaseModel):
    designation_name: str
    description: Optional[str] = None

class DesignationCreate(DesignationBase):
    pass

class Designation(DesignationBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Leave Type
class LeaveTypeBase(BaseModel):
    leave_type_name: str
    max_days_allowed: int = 0
    is_carry_forward: bool = False
    is_active: bool = True

class LeaveTypeCreate(LeaveTypeBase):
    pass

class LeaveType(LeaveTypeBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Leave Application
class LeaveApplicationBase(BaseModel):
    employee_id: int
    leave_type_id: int
    from_date: date
    to_date: date
    reason: Optional[str] = None
    status: str = "Open"

class LeaveApplicationCreate(LeaveApplicationBase):
    pass

class LeaveApplication(LeaveApplicationBase):
    id: int
    total_leave_days: float
    posting_date: date
    created_at: datetime
    # Extra fields populated manually or via hybrid property if needed, for now just basic
    
    class Config:
        from_attributes = True

# Attendance
class AttendanceBase(BaseModel):
    employee_id: int
    attendance_date: date
    status: str
    remark: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

