"""
Create test users for development
Run this script to create admin and test users
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User, Base
from core.auth import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

def create_user(db: Session, email: str, password: str, is_active: bool = True):
    """Create a user"""
    # Check if user exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"⚠️  User {email} already exists, skipping...")
        return existing
    
    # Create new user
    hashed_password = get_password_hash(password)
    user = User(
        email=email,
        hashed_password=hashed_password,
        is_active=is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"✅ Created user: {email} (ID: {user.id})")
    return user

def main():
    db = SessionLocal()
    try:
        print("Creating test users...")
        print("=" * 50)
        
        # Create admin user
        create_user(db, "admin@erp.com", "admin123")
        
        # Create test users
        create_user(db, "accountant@erp.com", "test123")
        create_user(db, "sales@erp.com", "test123")
        create_user(db, "manager@erp.com", "test123")
        
        print("=" * 50)
        print("✅ Test users created successfully!")
        print("")
        print("📋 Test Credentials:")
        print("   Admin:     admin@erp.com / admin123")
        print("   Accountant: accountant@erp.com / test123")
        print("   Sales:     sales@erp.com / test123")
        print("   Manager:   manager@erp.com / test123")
        print("")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()

