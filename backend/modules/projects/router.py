from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from . import models, schemas

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Projects
@router.post("/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/projects/", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Project).offset(skip).limit(limit).all()

@router.get("/projects/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

# Tasks
@router.post("/tasks/", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/tasks/", response_model=List[schemas.Task])
def read_tasks(skip: int = 0, limit: int = 100, project_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Task)
    if project_id:
        query = query.filter(models.Task.project_id == project_id)
    return query.offset(skip).limit(limit).all()

# Timesheets
@router.post("/timesheets/", response_model=schemas.Timesheet)
def create_timesheet(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db)):
    # Calculate total hours from details
    total_hours = sum(detail.hours for detail in timesheet.details)
    
    db_timesheet = models.Timesheet(
        employee_id=timesheet.employee_id,
        start_date=timesheet.start_date,
        end_date=timesheet.end_date,
        status=timesheet.status,
        total_hours=total_hours
    )
    db.add(db_timesheet)
    db.commit()
    db.refresh(db_timesheet)
    
    for detail in timesheet.details:
        db_detail = models.TimesheetDetail(
            timesheet_id=db_timesheet.id,
            **detail.dict()
        )
        db.add(db_detail)
    
    db.commit()
    db.refresh(db_timesheet)
    return db_timesheet

@router.get("/timesheets/", response_model=List[schemas.Timesheet])
def read_timesheets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Timesheet).offset(skip).limit(limit).all()

