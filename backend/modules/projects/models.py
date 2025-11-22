from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
from modules.setup.models import Employee

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="Open") # Open, Completed, Cancelled
    expected_start_date = Column(Date, nullable=True)
    expected_end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    status = Column(String, default="Open")
    priority = Column(String, default="Medium")
    exp_start_date = Column(Date, nullable=True)
    exp_end_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project")

class Timesheet(Base):
    __tablename__ = "timesheets"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default="Draft") # Draft, Submitted, Billed
    total_hours = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    employee = relationship("Employee")
    details = relationship("TimesheetDetail", back_populates="timesheet")

class TimesheetDetail(Base):
    __tablename__ = "timesheet_details"
    id = Column(Integer, primary_key=True, index=True)
    timesheet_id = Column(Integer, ForeignKey("timesheets.id"), nullable=False)
    activity_type = Column(String, nullable=True)
    from_time = Column(DateTime, nullable=True)
    to_time = Column(DateTime, nullable=True)
    hours = Column(Float, default=0.0)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    
    timesheet = relationship("Timesheet", back_populates="details")
    project = relationship("Project")
    task = relationship("Task")

