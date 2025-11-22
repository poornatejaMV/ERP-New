"""
Document Lifecycle Management
Handles Draft/Submit/Cancel workflow similar to ERPNext
"""
from enum import IntEnum
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException

class DocStatus(IntEnum):
    """Document status (similar to ERPNext docstatus)"""
    DRAFT = 0
    SUBMITTED = 1
    CANCELLED = 2


def get_docstatus_fields():
    """Return SQLAlchemy columns for docstatus tracking"""
    return {
        'docstatus': Column(Integer, default=DocStatus.DRAFT.value, nullable=False),
        'status': Column(String, default="Draft"),
        'submitted_by': Column(Integer, ForeignKey("users.id"), nullable=True),
        'submitted_at': Column(DateTime, nullable=True),
        'cancelled_by': Column(Integer, ForeignKey("users.id"), nullable=True),
        'cancelled_at': Column(DateTime, nullable=True),
        'amended_from': Column(Integer, nullable=True),  # For amended documents
    }


def validate_submit(db: Session, doc, user_id: int):
    """
    Validate document before submission
    Override this in specific document controllers
    """
    if doc.docstatus == DocStatus.SUBMITTED.value:
        raise HTTPException(
            status_code=400,
            detail="Document is already submitted"
        )
    if doc.docstatus == DocStatus.CANCELLED.value:
        raise HTTPException(
            status_code=400,
            detail="Cannot submit a cancelled document"
        )


def submit_document(db: Session, doc, user_id: int):
    """
    Submit a document (change status from Draft to Submitted)
    """
    validate_submit(db, doc, user_id)
    
    doc.docstatus = DocStatus.SUBMITTED.value
    doc.status = "Submitted"
    doc.submitted_by = user_id
    doc.submitted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(doc)
    return doc


def validate_cancel(db: Session, doc, user_id: int):
    """
    Validate document before cancellation
    """
    if doc.docstatus == DocStatus.DRAFT.value:
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel a draft document. Delete it instead."
        )
    if doc.docstatus == DocStatus.CANCELLED.value:
        raise HTTPException(
            status_code=400,
            detail="Document is already cancelled"
        )


def cancel_document(db: Session, doc, user_id: int):
    """
    Cancel a document (change status from Submitted to Cancelled)
    Creates reversal entries for accounting/stock ledgers
    """
    validate_cancel(db, doc, user_id)
    
    doc.docstatus = DocStatus.CANCELLED.value
    doc.status = "Cancelled"
    doc.cancelled_by = user_id
    doc.cancelled_at = datetime.utcnow()
    
    # TODO: Create reversal ledger entries here
    # This should be handled by specific document controllers
    
    db.commit()
    db.refresh(doc)
    return doc


def is_draft(doc) -> bool:
    """Check if document is in draft status"""
    return doc.docstatus == DocStatus.DRAFT.value


def is_submitted(doc) -> bool:
    """Check if document is submitted"""
    return doc.docstatus == DocStatus.SUBMITTED.value


def is_cancelled(doc) -> bool:
    """Check if document is cancelled"""
    return doc.docstatus == DocStatus.CANCELLED.value


def can_edit(doc) -> bool:
    """Check if document can be edited"""
    return doc.docstatus == DocStatus.DRAFT.value


def can_submit(doc) -> bool:
    """Check if document can be submitted"""
    return doc.docstatus == DocStatus.DRAFT.value


def can_cancel(doc) -> bool:
    """Check if document can be cancelled"""
    return doc.docstatus == DocStatus.SUBMITTED.value

