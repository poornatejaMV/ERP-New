'use client';

import { useState, useEffect } from 'react';
import { fetchMaterialRequests, createMaterialRequest, submitMaterialRequest, makePurchaseOrderFromMR, fetchItems, MaterialRequest, Item } from '@/lib/api';

export default function MaterialRequestsPage() {
    const [requests, setRequests] = useState<MaterialRequest[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [newMR, setNewMR] = useState({
        transaction_date: new Date().toISOString().split('T')[0],
        schedule_date: new Date().toISOString().split('T')[0],
        material_request_type: 'Purchase',
        items: [{ item_code: '', qty: 1, schedule_date: new Date().toISOString().split('T')[0] }]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [mrData, itemsData] = await Promise.all([
                fetchMaterialRequests(),
                fetchItems()
            ]);
            setRequests(mrData);
            setItems(itemsData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const updatedItems = [...newMR.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setNewMR({ ...newMR, items: updatedItems });
    };

    const addItem = () => {
        setNewMR({
            ...newMR,
            items: [...newMR.items, { item_code: '', qty: 1, schedule_date: newMR.schedule_date }]
        });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createMaterialRequest(newMR);
            setShowModal(false);
            loadData();
            setNewMR({
                transaction_date: new Date().toISOString().split('T')[0],
                schedule_date: new Date().toISOString().split('T')[0],
                material_request_type: 'Purchase',
                items: [{ item_code: '', qty: 1, schedule_date: new Date().toISOString().split('T')[0] }]
            });
        } catch (e) {
            alert('Failed to create material request');
        }
    };

    const handleSubmit = async (id: number) => {
        try {
            await submitMaterialRequest(id);
            loadData();
        } catch (e) {
            alert('Failed to submit material request');
        }
    };

    const handleMakePO = async (id: number) => {
        try {
            const res: any = await makePurchaseOrderFromMR(id);
            alert(`Purchase Order created: ${res.purchase_order_id}`);
            loadData();
        } catch (e) {
            alert('Failed to create purchase order');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Material Requests</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    New Material Request
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No material requests found.</td>
                            </tr>
                        ) : (
                            requests.map((mr) => (
                                <tr key={mr.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{mr.name || mr.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mr.transaction_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mr.material_request_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mr.schedule_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${mr.status === 'Submitted' ? 'bg-blue-100 text-blue-800' : 
                                              mr.status === 'Ordered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {mr.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {mr.status === 'Draft' && (
                                            <button onClick={() => handleSubmit(mr.id)} className="text-green-600 hover:text-green-900">Submit</button>
                                        )}
                                        {(mr.status === 'Submitted' || mr.status === 'Partial') && mr.material_request_type === 'Purchase' && (
                                            <button onClick={() => handleMakePO(mr.id)} className="text-blue-600 hover:text-blue-900">Make PO</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
                    <div className="bg-white p-8 rounded-lg w-full max-w-4xl m-4">
                        <h2 className="text-xl font-bold mb-4">New Material Request</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <select
                                    className="border p-2 rounded"
                                    value={newMR.material_request_type}
                                    onChange={e => setNewMR({...newMR, material_request_type: e.target.value})}
                                    required
                                >
                                    <option value="Purchase">Purchase</option>
                                    <option value="Material Transfer">Material Transfer</option>
                                    <option value="Material Issue">Material Issue</option>
                                    <option value="Manufacture">Manufacture</option>
                                </select>
                                <input
                                    type="date"
                                    className="border p-2 rounded"
                                    value={newMR.transaction_date}
                                    onChange={e => setNewMR({...newMR, transaction_date: e.target.value})}
                                    required
                                />
                                <input
                                    type="date"
                                    className="border p-2 rounded"
                                    value={newMR.schedule_date}
                                    onChange={e => setNewMR({...newMR, schedule_date: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Items</h3>
                                <table className="min-w-full border mb-2">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 text-left">Item</th>
                                            <th className="p-2 text-right w-24">Qty</th>
                                            <th className="p-2 text-right w-40">Required Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newMR.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="p-2">
                                                    <select
                                                        className="w-full border p-1 rounded"
                                                        value={item.item_code}
                                                        onChange={e => handleItemChange(index, 'item_code', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select Item</option>
                                                        {items.map(i => <option key={i.id} value={i.item_code}>{i.item_name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="w-full border p-1 rounded text-right"
                                                        value={item.qty}
                                                        onChange={e => handleItemChange(index, 'qty', Number(e.target.value))}
                                                        min="1"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="date"
                                                        className="w-full border p-1 rounded"
                                                        value={item.schedule_date}
                                                        onChange={e => handleItemChange(index, 'schedule_date', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button type="button" onClick={addItem} className="text-blue-600 text-sm hover:underline">+ Add Row</button>
                            </div>

                            <div className="flex justify-end space-x-2 border-t pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

