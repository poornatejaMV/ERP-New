'use client';

import { useState, useEffect } from 'react';
import { fetchCustomers, createCustomer, Customer } from '@/lib/api';
import Link from 'next/link';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ customer_name: '', email: '', phone: '' });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await fetchCustomers();
            setCustomers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createCustomer(newCustomer);
            setShowModal(false);
            setNewCustomer({ customer_name: '', email: '', phone: '' });
            loadCustomers();
        } catch (e) {
            console.error(e);
            alert('Failed to create customer');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
                <div className="space-x-4">
                    <Link href="/selling/orders" className="text-blue-600 hover:underline">View Sales Orders</Link>
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        New Customer
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
                        {customers.map((c) => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.customer_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.phone}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Customer</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                placeholder="Name"
                                className="w-full border p-2 rounded"
                                value={newCustomer.customer_name}
                                onChange={(e) => setNewCustomer({ ...newCustomer, customer_name: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Email"
                                className="w-full border p-2 rounded"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            />
                            <input
                                placeholder="Phone"
                                className="w-full border p-2 rounded"
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
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
