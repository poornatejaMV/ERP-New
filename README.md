# ERPNext-like ERP System

A comprehensive Enterprise Resource Planning (ERP) system built with **Next.js** (frontend) and **FastAPI** (backend), inspired by ERPNext. This system provides complete business management capabilities including accounting, sales, purchasing, inventory, manufacturing, HR, projects, and more.

## 🚀 Features

### Core Modules

- ✅ **Authentication & Authorization** - JWT-based authentication with role-based access control (RBAC)
- ✅ **Setup Module** - Companies, Fiscal Years, Currencies, Cost Centers, Item/Customer/Supplier Groups, Price Lists
- ✅ **Accounts Module** - Chart of Accounts, General Ledger, Payment Ledger, Journal Entries, Payment Entries
- ✅ **Financial Reports** - Trial Balance, Profit & Loss, Balance Sheet, Accounts Receivable/Payable Aging
- ✅ **Tax Management** - Sales Tax Templates, Purchase Tax Templates
- ✅ **Budget Management** - Budgets, Monthly Distribution, Budget vs Actual Reports
- ✅ **Bank Reconciliation** - Statement Upload, Transaction Matching, Reconciliation

### Sales Module
- Customer Master
- Quotations
- Sales Orders
- Delivery Notes
- Sales Invoices
- Sales Returns (Credit Notes)

### Buying Module
- Supplier Master
- Purchase Orders
- Purchase Receipts
- Purchase Invoices
- Purchase Returns (Debit Notes)

### Stock Module
- Item Master (Standard, Serial No, Batch No)
- Item Prices
- Stock Entries (Receipt, Issue, Transfer)
- Stock Ledger with Valuation Logic
- Stock Balance Reports
- Serial/Batch Tracking
- Stock Reconciliation

### Manufacturing Module
- Bill of Materials (BOMs)
- Work Orders
- Material Transfer to WIP
- Finished Goods Receipt

### HR Module
- Employee Master
- Attendance Tracking
- Leave Types
- Leave Applications

### Projects Module
- Projects
- Tasks
- Timesheets

### CRM Module
- Leads
- Opportunities

### Assets Module
- Asset Categories
- Assets
- Depreciation Schedules (Straight Line, Written Down Value)
- Asset Disposal

## 📋 Prerequisites

- Docker and Docker Compose
- OR
- Node.js 20+ and Python 3.12+
- PostgreSQL 15+

## 🐳 Quick Start with Docker

### 1. Clone the repository

```bash
git clone <repository-url>
cd next-fastapi-erp
```

### 2. Start all services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port `5432`
- Backend API on port `8000`
- Frontend on port `3000`

### 3. Initialize the database

```bash
# Create tables and seed initial data
docker-compose exec backend python create_demo_data.py
```

### 4. Access the application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 5. Default Credentials

After running `create_demo_data.py`, you can login with:
- **Username:** `admin`
- **Password:** `admin123`

## 🛠️ Manual Setup (Without Docker)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://erp_user:erp_password@localhost:5432/erp_db
SECRET_KEY=your-secret-key-change-in-production
EOF
```

5. Initialize database:
```bash
python create_demo_data.py
```

6. Run the server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

4. Run the development server:
```bash
npm run dev
```

5. Access the application:
- Frontend: http://localhost:3000

## 📁 Project Structure

```
next-fastapi-erp/
├── backend/
│   ├── modules/          # Feature modules
│   │   ├── accounts/     # Accounting module
│   │   ├── assets/       # Asset management
│   │   ├── buying/       # Purchase module
│   │   ├── crm/          # CRM module
│   │   ├── hr/           # HR module
│   │   ├── manufacturing/# Manufacturing module
│   │   ├── projects/     # Projects module
│   │   ├── selling/      # Sales module
│   │   ├── setup/        # Setup module
│   │   └── stock/        # Inventory module
│   ├── core/             # Core utilities
│   ├── templates/        # PDF templates
│   ├── utils/            # Utility functions
│   ├── main.py           # FastAPI application
│   ├── database.py       # Database configuration
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Backend Dockerfile
├── frontend/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utility libraries
│   ├── package.json      # Node dependencies
│   └── Dockerfile        # Frontend Dockerfile
├── docker-compose.yml     # Docker Compose configuration
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key-for-jwt
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Database

The application uses PostgreSQL by default. You can also use SQLite for development by setting:
```env
DATABASE_URL=sqlite:///./sql_app.db
```

## 📚 API Documentation

Once the backend is running, you can access:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database credentials

### Port Already in Use
- Change ports in `docker-compose.yml` or stop conflicting services
- Backend: Change `8000:8000` to `8001:8000`
- Frontend: Change `3000:3000` to `3001:3000`

### Docker Issues
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📝 Development

### Adding New Features

1. Create module in `backend/modules/`
2. Define models in `models.py`
3. Define schemas in `schemas.py`
4. Create router in `router.py`
5. Register router in `backend/main.py`
6. Create frontend pages in `frontend/app/`

### Database Migrations

Currently, the application uses SQLAlchemy's `create_all()`. For production, consider using Alembic for migrations.

## 🚧 Pending Features

See [PENDING_FEATURES.md](./PENDING_FEATURES.md) for a complete list of features to be implemented.

High priority items:
- Expense Claims (Employee Expense Reimbursement)
- Period Closing / Year End Closing
- Material Request
- Quality Inspection
- Cost Center Allocation Enhancement

## 📄 License

This project is for educational purposes. Please review and comply with all license requirements for dependencies.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on the repository.

## 🎯 Roadmap

- [ ] Expense Claims Module
- [ ] Period Closing
- [ ] Advanced Reporting
- [ ] Email Integration
- [ ] Print Formats Enhancement
- [ ] Payroll Module
- [ ] POS Module

---

**Built with ❤️ using Next.js and FastAPI**

