from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from . import models, schemas
from modules.setup.models import Employee
from modules.setup import schemas as setup_schemas

router = APIRouter(
    prefix="/hr",
    tags=["hr"],
    responses={404: {"description": "Not found"}},
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Departments
@router.post("/departments/", response_model=schemas.Department)
def create_department(dept: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    db_dept = models.Department(**dept.dict())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/departments/", response_model=List[schemas.Department])
def read_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Department).offset(skip).limit(limit).all()

# Designations
@router.post("/designations/", response_model=schemas.Designation)
def create_designation(desig: schemas.DesignationCreate, db: Session = Depends(get_db)):
    db_desig = models.Designation(**desig.dict())
    db.add(db_desig)
    db.commit()
    db.refresh(db_desig)
    return db_desig

@router.get("/designations/", response_model=List[schemas.Designation])
def read_designations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Designation).offset(skip).limit(limit).all()

# Leave Types
@router.post("/leave-types/", response_model=schemas.LeaveType)
def create_leave_type(lt: schemas.LeaveTypeCreate, db: Session = Depends(get_db)):
    db_lt = models.LeaveType(**lt.dict())
    db.add(db_lt)
    db.commit()
    db.refresh(db_lt)
    return db_lt

@router.get("/leave-types/", response_model=List[schemas.LeaveType])
def read_leave_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.LeaveType).offset(skip).limit(limit).all()

# Leave Applications
@router.post("/leave-applications/", response_model=schemas.LeaveApplication)
def create_leave_application(la: schemas.LeaveApplicationCreate, db: Session = Depends(get_db)):
    # Calculate total days
    days = (la.to_date - la.from_date).days + 1
    
    db_la = models.LeaveApplication(**la.dict())
    db_la.total_leave_days = float(days)
    
    db.add(db_la)
    db.commit()
    db.refresh(db_la)
    return db_la

@router.get("/leave-applications/", response_model=List[schemas.LeaveApplication])
def read_leave_applications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.LeaveApplication).offset(skip).limit(limit).all()

# Attendance
@router.post("/attendance/", response_model=schemas.Attendance)
def create_attendance(att: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    # Check if attendance already exists for this employee on this date
    existing = db.query(models.Attendance).filter(
        models.Attendance.employee_id == att.employee_id,
        models.Attendance.attendance_date == att.attendance_date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already marked for this date")
        
    db_att = models.Attendance(**att.dict())
    db.add(db_att)
    db.commit()
    db.refresh(db_att)
    return db_att

@router.get("/attendance/", response_model=List[schemas.Attendance])
def read_attendance(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Attendance).offset(skip).limit(limit).all()


# Employees
@router.post("/employees/", response_model=setup_schemas.Employee)
def create_employee(emp: setup_schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_emp = Employee(**emp.dict())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@router.get("/employees/", response_model=List[setup_schemas.Employee])
def read_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Employee).offset(skip).limit(limit).all()
