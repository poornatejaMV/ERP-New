'use client';

import { useState, useEffect } from 'react';
import { 
    fetchBudgets, 
    createBudget, 
    submitBudget,
    fetchAccounts,
    fetchCompanies,
    Budget, 
    Account,
    Company
} from '@/lib/api';
import Link from 'next/link';

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [newBudget, setNewBudget] = useState({
        budget_name: '',
        company_id: 0,
        account_id: 0,
        budget_start_date: new Date().toISOString().split('T')[0],
        budget_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        budget_amount: 0,
        budget_against: 'Cost Center',
        monthly_distribution: false,
        action_if_annual_budget_exceeded: 'Warn',
        action_if_accumulated_monthly_budget_exceeded: 'Warn',
        applicable_on_purchase_order: true,
        applicable_on_booking_actual_expenses: true
    });

    const [monthlyAllocations, setMonthlyAllocations] = useState<number[]>(new Array(12).fill(0));

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [budgetsData, accountsData, companiesData] = await Promise.all([
                fetchBudgets(),
                fetchAccounts(),
                fetchCompanies()
            ]);
            setBudgets(budgetsData);
            setAccounts(accountsData.filter(a => a.root_type === 'Expense'));
            setCompanies(companiesData);
        } catch (e) {
            console.error('Error loading data:', e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newBudget.company_id || newBudget.company_id === 0) {
            alert('Please select a company');
            return;
        }
        if (!newBudget.account_id || newBudget.account_id === 0) {
            alert('Please select an account');
            return;
        }
        if (newBudget.budget_amount <= 0) {
            alert('Budget amount must be greater than 0');
            return;
        }

        try {
            setLoading(true);
            const payload: any = {
                ...newBudget,
                company_id: Number(newBudget.company_id),
                account_id: Number(newBudget.account_id),
                budget_amount: Number(newBudget.budget_amount)
            };

            if (newBudget.monthly_distribution) {
                payload.distributions = monthlyAllocations.map((amount, index) => ({
                    month: index + 1,
                    budget_allocation: amount
                })).filter(d => d.budget_allocation > 0);
            }
            
            await createBudget(payload);
            setShowModal(false);
            setNewBudget({
                budget_name: '',
                company_id: 0,
                account_id: 0,
                budget_start_date: new Date().toISOString().split('T')[0],
                budget_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                budget_amount: 0,
                budget_against: 'Cost Center',
                monthly_distribution: false,
                action_if_annual_budget_exceeded: 'Warn',
                action_if_accumulated_monthly_budget_exceeded: 'Warn',
                applicable_on_purchase_order: true,
                applicable_on_booking_actual_expenses: true
            });
            setMonthlyAllocations(new Array(12).fill(0));
            loadData();
        } catch (e: any) {
            console.error('Error creating budget:', e);
            alert('Failed to create budget: ' + (e.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (id: number) => {
        if (!confirm('Submit this budget?')) return;
        try {
            await submitBudget(id);
            loadData();
        } catch (e: any) {
            alert('Failed to submit budget: ' + (e.message || 'Unknown error'));
        }
    };

    const distributeEvenly = () => {
        const monthlyAmount = newBudget.budget_amount / 12;
        setMonthlyAllocations(new Array(12).fill(monthlyAmount));
    };

    const totalAllocated = monthlyAllocations.reduce((sum, val) => sum + val, 0);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Budgets</h1>
                <div className="space-x-2">
                    <Link href="/accounts/budgets/vs-actual" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Budget vs Actual
                    </Link>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        New Budget
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {budgets.map((budget) => (
                            <tr key={budget.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <Link href={`/accounts/budgets/${budget.id}`} className="text-blue-600 hover:text-blue-900">
                                        {budget.budget_name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {accounts.find(a => a.id === budget.account_id)?.account_name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {companies.find(c => c.id === budget.company_id)?.company_name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {budget.budget_start_date} to {budget.budget_end_date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    ${budget.budget_amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        budget.status === 'Submitted' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {budget.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {budget.status === 'Draft' && (
                                        <button
                                            onClick={() => handleSubmit(budget.id)}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Submit
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {budgets.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                    No budgets found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Budget Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white p-8 rounded-lg w-full max-w-3xl m-4">
                        <h2 className="text-xl font-bold mb-4">New Budget</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={newBudget.budget_name}
                                        onChange={(e) => setNewBudget({...newBudget, budget_name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newBudget.company_id}
                                        onChange={(e) => setNewBudget({...newBudget, company_id: Number(e.target.value)})}
                                        required
                                    >
                                        <option value="0">Select Company</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.company_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newBudget.account_id}
                                        onChange={(e) => setNewBudget({...newBudget, account_id: Number(e.target.value)})}
                                        required
                                    >
                                        <option value="0">Select Account</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.account_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border p-2 rounded"
                                        value={newBudget.budget_amount}
                                        onChange={(e) => setNewBudget({...newBudget, budget_amount: Number(e.target.value)})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded"
                                        value={newBudget.budget_start_date}
                                        onChange={(e) => setNewBudget({...newBudget, budget_start_date: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded"
                                        value={newBudget.budget_end_date}
                                        onChange={(e) => setNewBudget({...newBudget, budget_end_date: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Action if Annual Budget Exceeded</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newBudget.action_if_annual_budget_exceeded}
                                        onChange={(e) => setNewBudget({...newBudget, action_if_annual_budget_exceeded: e.target.value})}
                                    >
                                        <option value="Warn">Warn</option>
                                        <option value="Stop">Stop</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Action if Monthly Budget Exceeded</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newBudget.action_if_accumulated_monthly_budget_exceeded}
                                        onChange={(e) => setNewBudget({...newBudget, action_if_accumulated_monthly_budget_exceeded: e.target.value})}
                                    >
                                        <option value="Warn">Warn</option>
                                        <option value="Stop">Stop</option>
                                    </select>
                                </div>
                            </div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={newBudget.monthly_distribution}
                                    onChange={(e) => setNewBudget({...newBudget, monthly_distribution: e.target.checked})}
                                />
                                <span>Use Monthly Distribution</span>
                            </label>

                            {newBudget.monthly_distribution && (
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold">Monthly Distribution</h3>
                                        <button
                                            type="button"
                                            onClick={distributeEvenly}
                                            className="text-blue-600 text-sm hover:underline"
                                        >
                                            Distribute Evenly
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {monthlyAllocations.map((amount, index) => (
                                            <div key={index}>
                                                <label className="block text-xs text-gray-600 mb-1">
                                                    {new Date(2000, index, 1).toLocaleString('default', { month: 'short' })}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full border p-1 rounded text-sm"
                                                    value={amount}
                                                    onChange={(e) => {
                                                        const newAllocations = [...monthlyAllocations];
                                                        newAllocations[index] = Number(e.target.value);
                                                        setMonthlyAllocations(newAllocations);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                        Total Allocated: ${totalAllocated.toFixed(2)} / ${newBudget.budget_amount.toFixed(2)}
                                        {Math.abs(totalAllocated - newBudget.budget_amount) > 0.01 && (
                                            <span className="text-red-600 ml-2">⚠️ Must equal budget amount</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (newBudget.monthly_distribution && Math.abs(totalAllocated - newBudget.budget_amount) > 0.01)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Budget'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}





