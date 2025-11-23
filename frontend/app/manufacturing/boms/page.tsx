'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { fetchItems, Item } from '@/lib/api';

export interface BOMItem {
    item_code: string;
    qty: number;
    rate: number;
}

export interface BOMOperation {
    operation_name: string;
    time_in_mins: number;
    operating_cost: number;
}

export interface BOM {
    id: number;
    item_code: string;
    bom_name: string;
    quantity: number;
    is_active: boolean;
    items: BOMItem[];
    operations: BOMOperation[];
}

export interface BOMCreate {
    item_code: string;
    bom_name?: string;
    quantity: number;
    items: BOMItem[];
    operations: BOMOperation[];
}

export default function BOMsPage() {
    const [boms, setBoms] = useState<BOM[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [showModal, setShowModal] = useState(false);
    
    const [newBOM, setNewBOM] = useState<BOMCreate>({
        item_code: '',
        quantity: 1,
        items: [],
        operations: []
    });

    // Temporary state for adding items to BOM
    const [newItem, setNewItem] = useState({ item_code: '', qty: 1 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [bomData, itemsData] = await Promise.all([
                apiRequest<BOM[]>('/manufacturing/boms/'),
                fetchItems()
            ]);
            setBoms(bomData);
            setItems(itemsData);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/manufacturing/boms/', {
                method: 'POST',
                body: JSON.stringify(newBOM)
            });
            setShowModal(false);
            setNewBOM({ item_code: '', quantity: 1, items: [], operations: [] });
            loadData();
        } catch (e) {
            console.error(e);
            alert('Failed to create BOM');
        }
    };

    const addItemToBOM = () => {
        if (!newItem.item_code) return;
        const item = items.find(i => i.item_code === newItem.item_code);
        setNewBOM({
            ...newBOM,
            items: [...newBOM.items, { 
                item_code: newItem.item_code, 
                qty: Number(newItem.qty),
                rate: item?.standard_rate || 0
            }]
        });
        setNewItem({ item_code: '', qty: 1 });
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Bill of Materials (BOM)</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                    New BOM
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {boms.map((bom) => (
                            <tr key={bom.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{bom.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bom.bom_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bom.item_code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{bom.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {bom.is_active ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">New BOM</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Finished Good Item</label>
                                    <select
                                        className="w-full border p-2 rounded mt-1"
                                        value={newBOM.item_code}
                                        onChange={(e) => setNewBOM({ ...newBOM, item_code: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Item</option>
                                        {items.map(i => <option key={i.id} value={i.item_code}>{i.item_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Quantity Produced</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded mt-1"
                                        value={newBOM.quantity}
                                        onChange={(e) => setNewBOM({ ...newBOM, quantity: Number(e.target.value) })}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Raw Materials</h3>
                                <div className="flex gap-2 mb-2">
                                    <select
                                        className="flex-1 border p-2 rounded"
                                        value={newItem.item_code}
                                        onChange={(e) => setNewItem({ ...newItem, item_code: e.target.value })}
                                    >
                                        <option value="">Select Raw Material</option>
                                        {items.map(i => <option key={i.id} value={i.item_code}>{i.item_name}</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        className="w-24 border p-2 rounded"
                                        value={newItem.qty}
                                        onChange={(e) => setNewItem({ ...newItem, qty: Number(e.target.value) })}
                                        min="0.1"
                                    />
                                    <button type="button" onClick={addItemToBOM} className="bg-gray-200 px-4 rounded hover:bg-gray-300">Add</button>
                                </div>
                                
                                <div className="bg-gray-50 p-2 rounded">
                                    {newBOM.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0">
                                            <span>{item.item_code}</span>
                                            <span>Qty: {item.qty}</span>
                                        </div>
                                    ))}
                                    {newBOM.items.length === 0 && <p className="text-gray-400 text-sm text-center">No items added</p>}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create BOM</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
