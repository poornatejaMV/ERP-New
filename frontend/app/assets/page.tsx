'use client';

import { useState, useEffect } from 'react';
import { 
    fetchAssets, 
    createAsset, 
    submitAsset,
    calculateDepreciation,
    fetchAssetCategories,
    fetchCompanies,
    fetchAccounts,
    Asset, 
    AssetCategory,
    Company,
    Account
} from '@/lib/api';
import Link from 'next/link';

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [newAsset, setNewAsset] = useState({
        asset_name: '',
        category_id: 0,
        company_id: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_amount: 0,
        additional_cost: 0,
        depreciation_method: 'Straight Line',
        frequency_of_depreciation: 12,
        total_number_of_depreciations: 60, // 5 years
        depreciation_start_date: new Date().toISOString().split('T')[0],
        rate_of_depreciation: undefined as number | undefined,
        expected_value_after_useful_life: 0,
        location: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [assetsData, categoriesData, companiesData, accountsData] = await Promise.all([
                fetchAssets(),
                fetchAssetCategories(),
                fetchCompanies(),
                fetchAccounts()
            ]);
            setAssets(assetsData);
            setCategories(categoriesData);
            setCompanies(companiesData);
            setAccounts(accountsData);
        } catch (e) {
            console.error('Error loading data:', e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newAsset.category_id || newAsset.category_id === 0) {
            alert('Please select a category');
            return;
        }
        if (!newAsset.company_id || newAsset.company_id === 0) {
            alert('Please select a company');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...newAsset,
                category_id: Number(newAsset.category_id),
                company_id: Number(newAsset.company_id),
                purchase_amount: Number(newAsset.purchase_amount),
                additional_cost: Number(newAsset.additional_cost),
                frequency_of_depreciation: Number(newAsset.frequency_of_depreciation),
                total_number_of_depreciations: Number(newAsset.total_number_of_depreciations),
                rate_of_depreciation: newAsset.rate_of_depreciation ? Number(newAsset.rate_of_depreciation) : undefined,
                expected_value_after_useful_life: Number(newAsset.expected_value_after_useful_life)
            };
            
            await createAsset(payload);
            setShowModal(false);
            setNewAsset({
                asset_name: '',
                category_id: 0,
                company_id: 0,
                purchase_date: new Date().toISOString().split('T')[0],
                purchase_amount: 0,
                additional_cost: 0,
                depreciation_method: 'Straight Line',
                frequency_of_depreciation: 12,
                total_number_of_depreciations: 60,
                depreciation_start_date: new Date().toISOString().split('T')[0],
                rate_of_depreciation: undefined,
                expected_value_after_useful_life: 0,
                location: ''
            });
            loadData();
        } catch (e: any) {
            console.error('Error creating asset:', e);
            alert('Failed to create asset: ' + (e.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (id: number) => {
        if (!confirm('Submit this asset?')) return;
        try {
            await submitAsset(id);
            loadData();
        } catch (e: any) {
            alert('Failed to submit asset: ' + (e.message || 'Unknown error'));
        }
    };

    const handleCalculateDepreciation = async (id: number) => {
        if (!confirm('Calculate depreciation schedule for this asset?')) return;
        try {
            await calculateDepreciation(id);
            alert('Depreciation schedule calculated successfully');
            loadData();
        } catch (e: any) {
            alert('Failed to calculate depreciation: ' + (e.message || 'Unknown error'));
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Assets</h1>
                <div className="space-x-2">
                    <Link href="/assets/categories" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                        Categories
                    </Link>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        New Asset
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {assets.map((asset) => (
                            <tr key={asset.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {asset.asset_number || `#${asset.id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <Link href={`/assets/${asset.id}`} className="text-blue-600 hover:text-blue-900">
                                        {asset.asset_name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {categories.find(c => c.id === asset.category_id)?.category_name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.purchase_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    ${asset.total_asset_cost.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    ${asset.value_after_depreciation.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        asset.status === 'Submitted' ? 'bg-green-100 text-green-800' :
                                        asset.status === 'Fully Depreciated' ? 'bg-gray-100 text-gray-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {asset.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    {asset.status === 'Draft' && (
                                        <button
                                            onClick={() => handleSubmit(asset.id)}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Submit
                                        </button>
                                    )}
                                    {asset.status === 'Submitted' && (
                                        <button
                                            onClick={() => handleCalculateDepreciation(asset.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Calculate Depreciation
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {assets.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                    No assets found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Asset Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white p-8 rounded-lg w-full max-w-3xl m-4">
                        <h2 className="text-xl font-bold mb-4">New Asset</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={newAsset.asset_name}
                                        onChange={(e) => setNewAsset({...newAsset, asset_name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newAsset.category_id}
                                        onChange={(e) => setNewAsset({...newAsset, category_id: Number(e.target.value)})}
                                        required
                                    >
                                        <option value="0">Select Category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.category_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newAsset.company_id}
                                        onChange={(e) => setNewAsset({...newAsset, company_id: Number(e.target.value)})}
                                        required
                                    >
                                        <option value="0">Select Company</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.company_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded"
                                        value={newAsset.purchase_date}
                                        onChange={(e) => setNewAsset({...newAsset, purchase_date: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border p-2 rounded"
                                        value={newAsset.purchase_amount}
                                        onChange={(e) => setNewAsset({...newAsset, purchase_amount: Number(e.target.value)})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Cost</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border p-2 rounded"
                                        value={newAsset.additional_cost}
                                        onChange={(e) => setNewAsset({...newAsset, additional_cost: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Depreciation Method</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newAsset.depreciation_method}
                                        onChange={(e) => setNewAsset({...newAsset, depreciation_method: e.target.value})}
                                    >
                                        <option value="Straight Line">Straight Line</option>
                                        <option value="Written Down Value">Written Down Value</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency (Months)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        value={newAsset.frequency_of_depreciation}
                                        onChange={(e) => setNewAsset({...newAsset, frequency_of_depreciation: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Depreciations</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        value={newAsset.total_number_of_depreciations}
                                        onChange={(e) => setNewAsset({...newAsset, total_number_of_depreciations: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Depreciation Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded"
                                        value={newAsset.depreciation_start_date}
                                        onChange={(e) => setNewAsset({...newAsset, depreciation_start_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Salvage Value</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border p-2 rounded"
                                        value={newAsset.expected_value_after_useful_life}
                                        onChange={(e) => setNewAsset({...newAsset, expected_value_after_useful_life: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={newAsset.location}
                                        onChange={(e) => setNewAsset({...newAsset, location: e.target.value})}
                                    />
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
                                    {loading ? 'Creating...' : 'Create Asset'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}





