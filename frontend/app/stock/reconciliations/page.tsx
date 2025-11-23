'use client';

import { useState, useEffect } from 'react';
import { fetchStockReconciliations, createStockReconciliation, submitStockReconciliation, fetchItems, StockReconciliation, Item } from '@/lib/api';

export default function StockReconciliationPage() {
    const [reconciliations, setReconciliations] = useState<StockReconciliation[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [newReco, setNewReco] = useState({
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: '00:00:00',
        purpose: 'Stock Reconciliation',
        items: [{ item_code: '', warehouse: 'Main Store', qty: 0, valuation_rate: 0 }]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [recoData, itemsData] = await Promise.all([
                fetchStockReconciliations(),
                fetchItems()
            ]);
            setReconciliations(recoData);
            setItems(itemsData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const updatedItems = [...newReco.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        
        if (field === 'item_code') {
            const selectedItem = items.find(i => i.item_code === value);
            if (selectedItem) {
                updatedItems[index].valuation_rate = selectedItem.standard_rate;
            }
        }
        
        setNewReco({ ...newReco, items: updatedItems });
    };

    const addItem = () => {
        setNewReco({
            ...newReco,
            items: [...newReco.items, { item_code: '', warehouse: 'Main Store', qty: 0, valuation_rate: 0 }]
        });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createStockReconciliation(newReco);
            setShowModal(false);
            loadData();
            setNewReco({
                posting_date: new Date().toISOString().split('T')[0],
                posting_time: '00:00:00',
                purpose: 'Stock Reconciliation',
                items: [{ item_code: '', warehouse: 'Main Store', qty: 0, valuation_rate: 0 }]
            });
        } catch (e) {
            alert('Failed to create reconciliation');
        }
    };

    const handleSubmit = async (id: number) => {
        try {
            await submitStockReconciliation(id);
            loadData();
        } catch (e) {
            alert('Failed to submit reconciliation');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Stock Reconciliation</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    New Reconciliation
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reconciliations.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No reconciliations found.</td>
                            </tr>
                        ) : (
                            reconciliations.map((reco) => (
                                <tr key={reco.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{reco.name || reco.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reco.posting_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reco.purpose}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${reco.status === 'Submitted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {reco.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {reco.status === 'Draft' && (
                                            <button onClick={() => handleSubmit(reco.id)} className="text-green-600 hover:text-green-900">Submit</button>
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
                        <h2 className="text-xl font-bold mb-4">New Stock Reconciliation</h2>
                        <p className="text-sm text-gray-500 mb-4">Use this to set the stock quantity and value as of a specific date/time.</p>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <input
                                    type="date"
                                    className="border p-2 rounded"
                                    value={newReco.posting_date}
                                    onChange={e => setNewReco({...newReco, posting_date: e.target.value})}
                                    required
                                />
                                <input
                                    type="time"
                                    step="1"
                                    className="border p-2 rounded"
                                    value={newReco.posting_time}
                                    onChange={e => setNewReco({...newReco, posting_time: e.target.value})}
                                    required
                                />
                                <select 
                                    className="border p-2 rounded"
                                    value={newReco.purpose}
                                    onChange={e => setNewReco({...newReco, purpose: e.target.value})}
                                >
                                    <option value="Stock Reconciliation">Stock Reconciliation</option>
                                    <option value="Opening Stock">Opening Stock</option>
                                </select>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Items</h3>
                                <table className="min-w-full border mb-2">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 text-left">Item</th>
                                            <th className="p-2 text-left">Warehouse</th>
                                            <th className="p-2 text-right w-24">Qty</th>
                                            <th className="p-2 text-right w-32">Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newReco.items.map((item, index) => (
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
                                                        type="text"
                                                        className="w-full border p-1 rounded"
                                                        value={item.warehouse}
                                                        onChange={e => handleItemChange(index, 'warehouse', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="w-full border p-1 rounded text-right"
                                                        value={item.qty}
                                                        onChange={e => handleItemChange(index, 'qty', Number(e.target.value))}
                                                        min="0"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="w-full border p-1 rounded text-right"
                                                        value={item.valuation_rate}
                                                        onChange={e => handleItemChange(index, 'valuation_rate', Number(e.target.value))}
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
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Reconciliation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

