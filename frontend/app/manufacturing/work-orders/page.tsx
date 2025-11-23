'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { fetchItems, Item } from '@/lib/api';

export interface WorkOrder {
    id: number;
    production_item: string;
    qty_to_manufacture: number;
    qty_manufactured: number;
    planned_start_date: string;
    status: string; // Draft, In Progress, Completed
}

export interface WorkOrderCreate {
    production_item: string;
    qty_to_manufacture: number;
    planned_start_date: string;
    warehouse: string; // Source
    wip_warehouse: string;
    fg_warehouse: string;
}

export default function WorkOrdersPage() {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [showModal, setShowModal] = useState(false);
    
    const [newWO, setNewWO] = useState<WorkOrderCreate>({
        production_item: '',
        qty_to_manufacture: 1,
        planned_start_date: new Date().toISOString().split('T')[0],
        warehouse: 'Stores',
        wip_warehouse: 'Work In Progress',
        fg_warehouse: 'Finished Goods'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [woData, itemsData] = await Promise.all([
                apiRequest<WorkOrder[]>('/manufacturing/work-orders/'),
                fetchItems()
            ]);
            setWorkOrders(woData);
            setItems(itemsData);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/manufacturing/work-orders/', {
                method: 'POST',
                body: JSON.stringify(newWO)
            });
            setShowModal(false);
            loadData();
        } catch (e) {
            console.error(e);
            alert('Failed to create Work Order');
        }
    };

    const handleStart = async (id: number) => {
        try {
            await apiRequest(`/manufacturing/work-orders/${id}/start`, { method: 'POST' });
            loadData();
        } catch (e) {
            console.error(e);
            alert('Failed to start Work Order');
        }
    };

    const handleComplete = async (id: number) => {
        try {
            await apiRequest(`/manufacturing/work-orders/${id}/complete`, { method: 'POST' });
            loadData();
        } catch (e) {
            console.error(e);
            alert('Failed to complete Work Order');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Work Orders</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                    New Work Order
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {workOrders.map((wo) => (
                            <tr key={wo.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{wo.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wo.production_item}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    {wo.qty_manufactured} / {wo.qty_to_manufacture}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        wo.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                        wo.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {wo.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                                    {wo.status === 'Draft' && (
                                        <button onClick={() => handleStart(wo.id)} className="text-blue-600 hover:text-blue-900">Start</button>
                                    )}
                                    {wo.status === 'In Progress' && (
                                        <button onClick={() => handleComplete(wo.id)} className="text-green-600 hover:text-green-900">Finish</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Work Order</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Production Item</label>
                                <select
                                    className="w-full border p-2 rounded mt-1"
                                    value={newWO.production_item}
                                    onChange={(e) => setNewWO({ ...newWO, production_item: e.target.value })}
                                    required
                                >
                                    <option value="">Select Item</option>
                                    {items.map(i => <option key={i.id} value={i.item_code}>{i.item_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Qty to Manufacture</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded mt-1"
                                    value={newWO.qty_to_manufacture}
                                    onChange={(e) => setNewWO({ ...newWO, qty_to_manufacture: Number(e.target.value) })}
                                    required
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded mt-1"
                                    value={newWO.planned_start_date}
                                    onChange={(e) => setNewWO({ ...newWO, planned_start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
