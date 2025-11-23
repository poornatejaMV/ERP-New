'use client';

import { useState, useEffect } from 'react';
import { 
    fetchAssetCategories, 
    createAssetCategory,
    fetchCompanies,
    fetchAccounts,
    AssetCategory,
    Company,
    Account
} from '@/lib/api';

export default function AssetCategoriesPage() {
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [newCategory, setNewCategory] = useState({
        category_name: '',
        description: '',
        company_id: 0,
        fixed_asset_account_id: 0,
        accumulated_depreciation_account_id: 0,
        depreciation_expense_account_id: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [categoriesData, companiesData, accountsData] = await Promise.all([
                fetchAssetCategories(),
                fetchCompanies(),
                fetchAccounts()
            ]);
            setCategories(categoriesData);
            setCompanies(companiesData);
            setAccounts(accountsData);
        } catch (e) {
            console.error('Error loading data:', e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newCategory.category_name) {
            alert('Please enter category name');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...newCategory,
                company_id: newCategory.company_id || undefined,
                fixed_asset_account_id: newCategory.fixed_asset_account_id || undefined,
                accumulated_depreciation_account_id: newCategory.accumulated_depreciation_account_id || undefined,
                depreciation_expense_account_id: newCategory.depreciation_expense_account_id || undefined
            };
            
            await createAssetCategory(payload);
            setShowModal(false);
            setNewCategory({
                category_name: '',
                description: '',
                company_id: 0,
                fixed_asset_account_id: 0,
                accumulated_depreciation_account_id: 0,
                depreciation_expense_account_id: 0
            });
            loadData();
        } catch (e: any) {
            console.error('Error creating category:', e);
            alert('Failed to create category: ' + (e.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Asset Categories</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    New Category
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fixed Asset Account</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depreciation Accounts</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {categories.map((cat) => (
                            <tr key={cat.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.category_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{cat.description || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {companies.find(c => c.id === cat.company_id)?.company_name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {accounts.find(a => a.id === cat.fixed_asset_account_id)?.account_name || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="text-xs">
                                        <div>Accumulated: {accounts.find(a => a.id === cat.accumulated_depreciation_account_id)?.account_name || '-'}</div>
                                        <div>Expense: {accounts.find(a => a.id === cat.depreciation_expense_account_id)?.account_name || '-'}</div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {categories.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    No categories found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Category Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-full max-w-2xl m-4">
                        <h2 className="text-xl font-bold mb-4">New Asset Category</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={newCategory.category_name}
                                    onChange={(e) => setNewCategory({...newCategory, category_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={newCategory.company_id}
                                    onChange={(e) => setNewCategory({...newCategory, company_id: Number(e.target.value)})}
                                >
                                    <option value="0">Select Company</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.company_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Asset Account</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newCategory.fixed_asset_account_id}
                                        onChange={(e) => setNewCategory({...newCategory, fixed_asset_account_id: Number(e.target.value)})}
                                    >
                                        <option value="0">Select Account</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.account_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Accumulated Depreciation</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newCategory.accumulated_depreciation_account_id}
                                        onChange={(e) => setNewCategory({...newCategory, accumulated_depreciation_account_id: Number(e.target.value)})}
                                    >
                                        <option value="0">Select Account</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.account_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Depreciation Expense</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newCategory.depreciation_expense_account_id}
                                        onChange={(e) => setNewCategory({...newCategory, depreciation_expense_account_id: Number(e.target.value)})}
                                    >
                                        <option value="0">Select Account</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.account_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
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
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}





