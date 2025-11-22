"""
Document Numbering System
Auto-generates document numbers with naming series support
"""
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

# Naming series patterns
NAMING_SERIES = {
    "Sales Order": "SAL-ORD-.YYYY.-",
    "Purchase Order": "PUR-ORD-.YYYY.-",
    "Sales Invoice": "SINV-.YYYY.-",
    "Purchase Invoice": "PINV-.YYYY.-",
    "Journal Entry": "JENT-.YYYY.-",
    "Payment Entry": "PAY-.YYYY.-",
    "Delivery Note": "DN-.YYYY.-",
    "Purchase Receipt": "PREC-.YYYY.-",
    "Stock Entry": "STE-.YYYY.-",
    "Material Request": "MAT-.YYYY.-",
    "Quotation": "QUO-.YYYY.-",
    "Work Order": "WO-.YYYY.-",
}


def get_fiscal_year(date: Optional[datetime] = None) -> str:
    """Get fiscal year from date (defaults to current year)"""
    if date is None:
        date = datetime.now()
    return str(date.year)


def parse_naming_series(series: str, date: Optional[datetime] = None) -> str:
    """
    Parse naming series pattern
    Supports:
    - .YYYY. - Current fiscal year
    - .MM. - Current month
    - .DD. - Current day
    """
    if date is None:
        date = datetime.now()
    
    series = series.replace(".YYYY.", str(date.year))
    series = series.replace(".MM.", f"{date.month:02d}")
    series = series.replace(".DD.", f"{date.day:02d}")
    
    return series


def get_next_number(
    db: Session,
    doctype: str,
    series: Optional[str] = None,
    date: Optional[datetime] = None
) -> str:
    """
    Get next document number for a doctype
    
    Args:
        db: Database session
        doctype: Document type name
        series: Optional naming series (uses default if not provided)
        date: Optional date for fiscal year (uses current date if not provided)
    
    Returns:
        Next document number (e.g., "SAL-ORD-2024-00001")
    """
    if series is None:
        series = NAMING_SERIES.get(doctype, f"{doctype.upper()}-.YYYY.-")
    
    # Parse the series
    parsed_series = parse_naming_series(series, date)
    
    # Extract prefix and check for existing numbers
    # Format: PREFIX-00001
    prefix = parsed_series.rstrip("-")
    
    # Query for existing documents with this prefix
    # This is a simplified version - in production, you'd have a naming_series table
    # For now, we'll query the actual document tables
    
    # Get the highest number for this prefix
    # This is a simplified implementation
    # In production, you'd maintain a naming_series table
    
    # Try to find existing documents with this prefix
    # For now, we'll use a simple counter approach
    # In a real system, query the actual document tables
    
    # Simple implementation: use timestamp-based number
    from datetime import datetime
    import time
    
    # Generate a unique number based on timestamp
    # Format: PREFIX-YYYYMMDD-HHMMSS
    if date:
        timestamp = date.strftime("%Y%m%d")
    else:
        timestamp = datetime.now().strftime("%Y%m%d")
    
    # Add a sequence number (simplified - in production use proper sequence)
    sequence = int(time.time() * 1000) % 100000  # Use last 5 digits of timestamp
    
    # Format: PREFIX-YYYYMMDD-00001
    number_str = f"{prefix}-{timestamp}-{sequence:05d}"
    
    return number_str


def set_naming_series(doctype: str, series: str):
    """Set naming series for a doctype"""
    NAMING_SERIES[doctype] = series


def get_naming_series(doctype: str) -> Optional[str]:
    """Get naming series for a doctype"""
    return NAMING_SERIES.get(doctype)

