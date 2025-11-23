'use client';

import { useState, useEffect } from 'react';

interface Warehouse {
    id: number;
    warehouse_name: string;
    address: string | null;
    contact_person: string | null;
    phone: string | null;
    is_default: boolean;
    is_active: boolean;
    stock_value: number;
    item_count: number;
}

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        warehouse_name: '',
        address: '',
        contact_person: '',
        phone: '',
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await fetch('http://localhost:8000/stock/warehouses/');
            const data = await res.json();
            setWarehouses(data);
        } catch (error) {
            console.error('Failed to load warehouses:', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8000/stock/warehouses/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ warehouse_name: '', address: '', contact_person: '', phone: '', is_active: true });
                loadData();
            }
        } catch (error) {
            console.error('Failed to create warehouse:', error);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Warehouses</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage warehouse locations</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                        + New Warehouse
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Value</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {warehouses.map((wh) => (
                            <tr key={wh.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {wh.warehouse_name}
                                    {wh.is_default && (
                                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Default</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{wh.address || '-'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {wh.contact_person || '-'}
                                    {wh.phone && <div className="text-xs text-gray-500">{wh.phone}</div>}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                                    ${wh.stock_value.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 text-right">{wh.item_count}</td>
                                <td className="px-6 py-4 text-sm text-center">
                                    <span className={`px-2 py-1 text-xs rounded ${wh.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {wh.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {warehouses.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No warehouses found</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
                        >
                            + Create your first warehouse
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded shadow-lg max-w-md w-full mx-4">
                        <div className="border-b px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">New Warehouse</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Warehouse Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={formData.warehouse_name}
                                    onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows={2}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={formData.contact_person}
                                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
