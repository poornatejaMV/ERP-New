import sys
import os
from datetime import datetime, date

# Add the current directory to sys.path so we can import from modules
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base

# Import Models
# Core/Auth
from models import User, Item
# Setup
from modules.setup.models import (
    Company, ItemGroup, CustomerGroup, SupplierGroup, 
    FiscalYear, Currency, CostCenter
)
# Selling
from modules.selling.models import Customer, SalesOrder
# Buying
from modules.buying.models import Supplier
# Stock
from modules.stock.warehouse_models import Warehouse
# Accounts
from modules.accounts.models import Account

# Ensure tables exist
def init_db():
    print("Initializing Database Tables...")
    # Import all models to ensure they are registered with Base
    import models
    import modules.setup.models
    import modules.selling.models
    import modules.selling.invoice_models # Import Sales Invoice Models
    import modules.selling.delivery_models # Import Delivery Note Models
    import modules.buying.models
    import modules.stock.models
    import modules.stock.warehouse_models
    import modules.accounts.models
    import modules.accounts.tax_models # Import Tax Models
    import modules.crm.models # Import CRM Models
    
    Base.metadata.create_all(bind=engine)
    print("Tables Created.")

def create_demo_data():
    init_db()
    db: Session = SessionLocal()
    try:
        print("Creating Demo Data...")

        # 1. Company
        company = db.query(Company).filter(Company.company_name == "Test Company").first()
        if not company:
            company = Company(
                company_name="Test Company",
                abbr="TC",
                default_currency="USD",
                country="United States",
                is_active=True
            )
            db.add(company)
            db.commit()
            db.refresh(company)
            print(f"Created Company: {company.company_name}")
        else:
            print(f"Company already exists: {company.company_name}")

        # 2. Item Group
        item_group = db.query(ItemGroup).filter(ItemGroup.item_group_name == "Products").first()
        if not item_group:
            item_group = ItemGroup(item_group_name="Products", is_group=True)
            db.add(item_group)
            db.commit()
            print("Created Item Group: Products")

        # 3. Item
        item = db.query(Item).filter(Item.item_code == "TEST-ITEM-001").first()
        if not item:
            item = Item(
                item_code="TEST-ITEM-001",
                item_name="Test Item 1",
                description="A standard test item",
                uom="Nos",
                standard_rate=100.0,
                is_stock_item=True,
                owner_id=1 # Assuming admin is ID 1
            )
            db.add(item)
            db.commit()
            print("Created Item: TEST-ITEM-001")

        # 4. Customer Group
        cust_group = db.query(CustomerGroup).filter(CustomerGroup.customer_group_name == "All Customer Groups").first()
        if not cust_group:
            cust_group = CustomerGroup(customer_group_name="All Customer Groups", is_group=True)
            db.add(cust_group)
            db.commit()
            print("Created Customer Group")

        # 5. Customer
        customer = db.query(Customer).filter(Customer.customer_name == "Test Customer").first()
        if not customer:
            customer = Customer(
                customer_name="Test Customer",
                email="customer@test.com",
                phone="1234567890"
            )
            db.add(customer)
            db.commit()
            print("Created Customer: Test Customer")

        # 6. Supplier Group
        supp_group = db.query(SupplierGroup).filter(SupplierGroup.supplier_group_name == "All Supplier Groups").first()
        if not supp_group:
            supp_group = SupplierGroup(supplier_group_name="All Supplier Groups", is_group=True)
            db.add(supp_group)
            db.commit()
            print("Created Supplier Group")

        # 7. Supplier
        supplier = db.query(Supplier).filter(Supplier.supplier_name == "Test Supplier").first()
        if not supplier:
            supplier = Supplier(
                supplier_name="Test Supplier",
                email="supplier@test.com",
                phone="0987654321"
            )
            db.add(supplier)
            db.commit()
            print("Created Supplier: Test Supplier")

        # 8. Warehouse
        warehouse = db.query(Warehouse).filter(Warehouse.warehouse_name == "Stores").first()
        if not warehouse:
            warehouse = Warehouse(
                warehouse_name="Stores",
                is_group=False,
                company_id=company.id
            )
            db.add(warehouse)
            db.commit()
            print("Created Warehouse: Stores")
        
        # 9. Accounts (Basic Chart of Accounts)
        # Root Types
        roots = ["Asset", "Liability", "Equity", "Income", "Expense"]
        root_accounts = {}
        
        for r_name in roots:
            acc = db.query(Account).filter(Account.account_name == r_name).first()
            if not acc:
                acc = Account(
                    account_name=r_name,
                    account_number=None,
                    is_group=True,
                    root_type=r_name,
                    report_type="Balance Sheet" if r_name in ["Asset", "Liability", "Equity"] else "Profit and Loss",
                    account_currency="USD",
                    company_id=company.id
                )
                db.add(acc)
                db.commit()
                db.refresh(acc)
                print(f"Created Root Account: {r_name}")
            root_accounts[r_name] = acc

        # Child Accounts
        # Bank (Asset)
        bank = db.query(Account).filter(Account.account_name == "Bank").first()
        if not bank:
            bank = Account(
                account_name="Bank",
                parent_account_id=root_accounts["Asset"].id,
                is_group=False,
                root_type="Asset",
                report_type="Balance Sheet",
                account_type="Bank",
                account_currency="USD",
                company_id=company.id
            )
            db.add(bank)
            db.commit()
            print("Created Account: Bank")
        
        # Debtors (Asset)
        debtors = db.query(Account).filter(Account.account_name == "Debtors").first()
        if not debtors:
            debtors = Account(
                account_name="Debtors",
                parent_account_id=root_accounts["Asset"].id,
                is_group=False,
                root_type="Asset",
                report_type="Balance Sheet",
                account_type="Receivable",
                account_currency="USD",
                company_id=company.id
            )
            db.add(debtors)
            db.commit()
            print("Created Account: Debtors")

        # Creditors (Liability)
        creditors = db.query(Account).filter(Account.account_name == "Creditors").first()
        if not creditors:
            creditors = Account(
                account_name="Creditors",
                parent_account_id=root_accounts["Liability"].id,
                is_group=False,
                root_type="Liability",
                report_type="Balance Sheet",
                account_type="Payable",
                account_currency="USD",
                company_id=company.id
            )
            db.add(creditors)
            db.commit()
            print("Created Account: Creditors")

        # Sales (Income)
        sales = db.query(Account).filter(Account.account_name == "Sales").first()
        if not sales:
            sales = Account(
                account_name="Sales",
                parent_account_id=root_accounts["Income"].id,
                is_group=False,
                root_type="Income",
                report_type="Profit and Loss",
                account_type="Income Account",
                account_currency="USD",
                company_id=company.id
            )
            db.add(sales)
            db.commit()
            print("Created Account: Sales")

        # Cost of Goods Sold (Expense)
        cogs = db.query(Account).filter(Account.account_name == "Cost of Goods Sold").first()
        if not cogs:
            cogs = Account(
                account_name="Cost of Goods Sold",
                parent_account_id=root_accounts["Expense"].id,
                is_group=False,
                root_type="Expense",
                report_type="Profit and Loss",
                account_type="Expense Account",
                account_currency="USD",
                company_id=company.id
            )
            db.add(cogs)
            db.commit()
            print("Created Account: Cost of Goods Sold")
            
        print("Demo Data Creation Complete!")

    except Exception as e:
        print(f"Error creating demo data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_data()

