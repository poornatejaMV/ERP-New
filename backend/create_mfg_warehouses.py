from sqlalchemy.orm import Session
from database import SessionLocal, engine
from modules.stock.warehouse_models import Warehouse
from modules.setup.models import Company

def create_warehouses():
    db = SessionLocal()
    try:
        # Get Company
        company = db.query(Company).filter(Company.company_name == "Test Company").first()
        company_id = company.id if company else 1

        # 1. Work In Progress
        wip = db.query(Warehouse).filter(Warehouse.warehouse_name == "Work In Progress").first()
        if not wip:
            wip = Warehouse(
                warehouse_name="Work In Progress",
                is_group=False,
                company_id=company_id
            )
            db.add(wip)
            print("Created Warehouse: Work In Progress")

        # 2. Finished Goods
        fg = db.query(Warehouse).filter(Warehouse.warehouse_name == "Finished Goods").first()
        if not fg:
            fg = Warehouse(
                warehouse_name="Finished Goods",
                is_group=False,
                company_id=company_id
            )
            db.add(fg)
            print("Created Warehouse: Finished Goods")
        
        db.commit()
        print("Manufacturing Warehouses Created.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_warehouses()

