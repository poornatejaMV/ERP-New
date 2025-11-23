'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    return (
        <div className="h-screen w-64 bg-gray-800 text-white fixed left-0 top-0 overflow-y-auto">
            <div className="p-4 border-b border-gray-700">
                <Link href="/" className="text-xl font-bold">ERP System</Link>
                <p className="text-xs text-gray-400">Next.js + FastAPI</p>
                {user && (
                    <div className="mt-2 text-xs text-gray-400">
                        {user.email}
                    </div>
                )}
            </div>

            <nav className="p-4">
                <Link href="/" className={`block py-2 px-4 rounded mb-1 ${isActive('/') && pathname === '/' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Dashboard
                </Link>

                <Link href="/items" className={`block py-2 px-4 rounded mb-1 ${isActive('/items') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Items
                </Link>

                <div className="mt-4 mb-2 px-4 text-xs text-gray-400 uppercase">Selling</div>
                <Link href="/selling/customers" className={`block py-2 px-4 rounded mb-1 ${isActive('/selling/customers') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Customers
                </Link>
                <Link href="/selling/quotations" className={`block py-2 px-4 rounded mb-1 ${isActive('/selling/quotations') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Quotations
                </Link>
                <Link href="/selling/orders" className={`block py-2 px-4 rounded mb-1 ${isActive('/selling/orders') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Sales Orders
                </Link>
                <Link href="/selling/invoices" className={`block py-2 px-4 rounded mb-1 ${isActive('/selling/invoices') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Sales Invoices
                </Link>
                <Link href="/selling/delivery-notes" className={`block py-2 px-4 rounded mb-1 ${isActive('/selling/delivery-notes') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Delivery Notes
                </Link>
                <Link href="/selling/price-lists" className={`block py-2 px-4 rounded mb-1 ${isActive('/selling/price-lists') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Price Lists
                </Link>

                <div className="mt-4 mb-2 px-4 text-xs text-gray-400 uppercase">Buying</div>
                <Link href="/buying/suppliers" className={`block py-2 px-4 rounded mb-1 ${isActive('/buying/suppliers') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Suppliers
                </Link>
                <Link href="/buying/orders" className={`block py-2 px-4 rounded mb-1 ${isActive('/buying/orders') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Purchase Orders
                </Link>
                <Link href="/buying/invoices" className={`block py-2 px-4 rounded mb-1 ${isActive('/buying/invoices') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Purchase Invoices
                </Link>

                <div className="mt-4 mb-2 px-4 text-xs text-gray-400 uppercase">Stock</div>
                <Link href="/stock/warehouses" className={`block py-2 px-4 rounded mb-1 ${isActive('/stock/warehouses') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Warehouses
                </Link>
                <Link href="/stock/entries" className={`block py-2 px-4 rounded mb-1 ${isActive('/stock/entries') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Stock Entries
                </Link>
                <Link href="/stock/material-requests" className={`block py-2 px-4 rounded mb-1 ${isActive('/stock/material-requests') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Material Requests
                </Link>
                <Link href="/stock/reconciliations" className={`block py-2 px-4 rounded mb-1 ${isActive('/stock/reconciliations') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Stock Reconciliation
                </Link>

                <div className="mt-4 mb-2 px-4 text-xs text-gray-400 uppercase">Manufacturing</div>
                <Link href="/manufacturing/boms" className={`block py-2 px-4 rounded mb-1 ${isActive('/manufacturing/boms') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    BOMs
                </Link>
                <Link href="/manufacturing/work-orders" className={`block py-2 px-4 rounded mb-1 ${isActive('/manufacturing/work-orders') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Work Orders
                </Link>

                <div className="mt-4 mb-2 px-4 text-xs text-gray-400 uppercase">HR</div>
                <Link href="/hr/employees" className={`block py-2 px-4 rounded mb-1 ${isActive('/hr/employees') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Employees
                </Link>
                <Link href="/hr/attendance" className={`block py-2 px-4 rounded mb-1 ${isActive('/hr/attendance') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Attendance
                </Link>
                <Link href="/hr/leave-applications" className={`block py-2 px-4 rounded mb-1 ${isActive('/hr/leave-applications') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Leave Applications
                </Link>

                <div className="mt-4 mb-2 px-4 text-xs text-gray-400 uppercase">Projects</div>
                <Link href="/projects/projects" className={`block py-2 px-4 rounded mb-1 ${isActive('/projects/projects') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Projects
                </Link>
                <Link href="/projects/tasks" className={`block py-2 px-4 rounded mb-1 ${isActive('/projects/tasks') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Tasks
                </Link>
                <Link href="/projects/timesheets" className={`block py-2 px-4 rounded mb-1 ${isActive('/projects/timesheets') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Timesheets
                </Link>

                <div className="mt-4 mb-2 px-4 text-xs text-gray-400 uppercase">Accounts</div>
                <Link href="/accounts/chart-of-accounts" className={`block py-2 px-4 rounded mb-1 ${isActive('/accounts/chart-of-accounts') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Chart of Accounts
                </Link>
                <Link href="/accounts/journal-entries" className={`block py-2 px-4 rounded mb-1 ${isActive('/accounts/journal-entries') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Journal Entries
                </Link>
                <Link href="/accounts/payments" className={`block py-2 px-4 rounded mb-1 ${isActive('/accounts/payments') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Payment Entries
                </Link>
                <Link href="/accounts/tax-templates" className={`block py-2 px-4 rounded mb-1 ${isActive('/accounts/tax-templates') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Tax Templates
                </Link>
                <Link href="/accounts/bank-reconciliation" className={`block py-2 px-4 rounded mb-1 ${isActive('/accounts/bank-reconciliation') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Bank Reconciliation
                </Link>
                <Link href="/accounts/budgets" className={`block py-2 px-4 rounded mb-1 ${isActive('/accounts/budgets') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Budgets
                </Link>

                <div className="mt-4 mb-2 px-4 text-xs text-gray-400 uppercase">Assets</div>
                <Link href="/assets" className={`block py-2 px-4 rounded mb-1 ${isActive('/assets') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Assets
                </Link>
                <Link href="/assets/categories" className={`block py-2 px-4 rounded mb-1 ${isActive('/assets/categories') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Asset Categories
                </Link>

                <div className="mt-4 mb-2 px-4 text-xs text-gray-400 uppercase">Reports</div>
                <Link href="/reports/accounts-receivable" className={`block py-2 px-4 rounded mb-1 ${isActive('/reports/accounts-receivable') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Accounts Receivable
                </Link>
                <Link href="/reports/accounts-payable" className={`block py-2 px-4 rounded mb-1 ${isActive('/reports/accounts-payable') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Accounts Payable
                </Link>
                <Link href="/reports/trial-balance" className={`block py-2 px-4 rounded mb-1 ${isActive('/reports/trial-balance') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Trial Balance
                </Link>
                <Link href="/reports/profit-loss" className={`block py-2 px-4 rounded mb-1 ${isActive('/reports/profit-loss') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Profit & Loss
                </Link>
                <Link href="/reports/stock-balance" className={`block py-2 px-4 rounded mb-1 ${isActive('/reports/stock-balance') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    Stock Balance
                </Link>
            </nav>
            
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={logout}
                    className="w-full text-center py-2 px-4 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
