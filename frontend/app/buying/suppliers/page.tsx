'use client';

import { useState, useEffect } from 'react';
import { fetchSuppliers, createSupplier, Supplier } from '@/lib/api';
import Link from 'next/link';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ supplier_name: '', email: '', phone: '' });

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        const data = await fetchSuppliers();
        setSuppliers(data);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createSupplier(newSupplier);
            setShowModal(false);
            setNewSupplier({ supplier_name: '', email: '', phone: '' });
            loadSuppliers();
        } catch (e) {
            console.error(e);
            alert('Failed to create supplier');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Suppliers</h1>
                <div className="space-x-4">
                    <Link href="/buying/orders" className="text-blue-600 hover:underline">View Purchase Orders</Link>
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        New Supplier
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {suppliers.map((s) => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.supplier_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.phone}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Supplier</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                placeholder="Name"
                                className="w-full border p-2 rounded"
                                value={newSupplier.supplier_name}
                                onChange={(e) => setNewSupplier({ ...newSupplier, supplier_name: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Email"
                                className="w-full border p-2 rounded"
                                value={newSupplier.email}
                                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                            />
                            <input
                                placeholder="Phone"
                                className="w-full border p-2 rounded"
                                value={newSupplier.phone}
                                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                            />
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
