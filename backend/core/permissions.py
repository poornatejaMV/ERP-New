"""
Role-Based Access Control (RBAC) and Permissions
"""
from typing import List, Optional
from enum import Enum
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from models import User
from core.auth import get_current_active_user

class Permission(Enum):
    """Document-level permissions"""
    CREATE = "create"
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    SUBMIT = "submit"
    CANCEL = "cancel"
    PRINT = "print"
    EXPORT = "export"


class Role(Enum):
    """System roles"""
    ADMINISTRATOR = "Administrator"
    ACCOUNTANT = "Accountant"
    SALES_MANAGER = "Sales Manager"
    SALES_USER = "Sales User"
    PURCHASE_MANAGER = "Purchase Manager"
    PURCHASE_USER = "Purchase User"
    STOCK_MANAGER = "Stock Manager"
    STOCK_USER = "Stock User"
    CRM_USER = "CRM User"
    PROJECT_MANAGER = "Project Manager"
    READ_ONLY = "Read Only"


# Role-Permission mapping for each doctype
ROLE_PERMISSIONS = {
    Role.ADMINISTRATOR: {
        "*": [p.value for p in Permission]  # All permissions for all doctypes
    },
    Role.ACCOUNTANT: {
        "Account": ["create", "read", "write", "delete", "submit", "cancel"],
        "Journal Entry": ["create", "read", "write", "delete", "submit", "cancel"],
        "Payment Entry": ["create", "read", "write", "delete", "submit", "cancel"],
        "Sales Invoice": ["read", "submit", "cancel"],
        "Purchase Invoice": ["read", "submit", "cancel"],
    },
    Role.SALES_MANAGER: {
        "Customer": ["create", "read", "write", "delete"],
        "Sales Order": ["create", "read", "write", "delete", "submit", "cancel"],
        "Sales Invoice": ["create", "read", "write", "delete", "submit", "cancel"],
        "Quotation": ["create", "read", "write", "delete", "submit", "cancel"],
    },
    Role.SALES_USER: {
        "Customer": ["read", "write"],
        "Sales Order": ["create", "read", "write"],
        "Sales Invoice": ["read"],
        "Quotation": ["create", "read", "write"],
    },
    # Add more role mappings as needed
}


def has_permission(
    user: User,
    doctype: str,
    permission: Permission,
    db: Session
) -> bool:
    """
    Check if user has permission for a doctype
    
    TODO: Implement proper role assignment to users
    For now, we'll use a simple check based on user email or add role field to User model
    """
    # Temporary: Check if user is admin (email contains admin)
    # In production, you'd have a UserRole table
    if "admin" in user.email.lower():
        return True
    
    # Default permissions for now
    # TODO: Implement proper role checking from database
    return True


def require_permission(
    doctype: str,
    permission: Permission
):
    """
    Decorator/dependency to require permission
    """
    def permission_checker(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        if not has_permission(current_user, doctype, permission, db):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: {permission.value} on {doctype}"
            )
        return current_user
    return permission_checker

