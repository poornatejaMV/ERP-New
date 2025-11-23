'use client';

import { useState, useEffect } from 'react';
import { fetchStockEntries, createStockEntry, fetchItems, StockEntry, Item } from '@/lib/api';
import Link from 'next/link';

export default function StockEntriesPage() {
    const [entries, setEntries] = useState<StockEntry[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [showModal, setShowModal] = useState(false);

    const [newEntry, setNewEntry] = useState({
        transaction_date: new Date().toISOString().split('T')[0],
        purpose: 'Material Receipt',
        item_code: '',
        qty: 1,
        serial_no: '',
        batch_no: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [entriesData, itemsData] = await Promise.all([
            fetchStockEntries(),
            fetchItems()
        ]);
        setEntries(entriesData);
        setItems(itemsData);
    };

    const selectedItemDetails = items.find(i => i.item_code === newEntry.item_code);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedItem = items.find(i => i.item_code === newEntry.item_code);
        if (!selectedItem) return;

        try {
            await createStockEntry({
                transaction_date: newEntry.transaction_date,
                purpose: newEntry.purpose,
                items: [{
                    item_code: newEntry.item_code,
                    qty: Number(newEntry.qty),
                    basic_rate: selectedItem.standard_rate,
                    serial_no: newEntry.serial_no,
                    batch_no: newEntry.batch_no
                }]
            });
            setShowModal(false);
            setNewEntry({
                transaction_date: new Date().toISOString().split('T')[0],
                purpose: 'Material Receipt',
                item_code: '',
                qty: 1,
                serial_no: '',
                batch_no: '',
            });
            loadData();
        } catch (e) {
            console.error(e);
            alert('Failed to create stock entry');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Stock Entries</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                    New Stock Entry
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.map((e) => (
                            <tr key={e.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{e.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.transaction_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.purpose}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Stock Entry</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <select
                                className="w-full border p-2 rounded"
                                value={newEntry.purpose}
                                onChange={(e) => setNewEntry({ ...newEntry, purpose: e.target.value })}
                                required
                            >
                                <option value="Material Receipt">Material Receipt</option>
                                <option value="Material Issue">Material Issue</option>
                                <option value="Material Transfer">Material Transfer</option>
                            </select>

                            <input
                                type="date"
                                className="w-full border p-2 rounded"
                                value={newEntry.transaction_date}
                                onChange={(e) => setNewEntry({ ...newEntry, transaction_date: e.target.value })}
                                required
                            />

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Item Details</h3>
                                <select
                                    className="w-full border p-2 rounded mb-2"
                                    value={newEntry.item_code}
                                    onChange={(e) => setNewEntry({ ...newEntry, item_code: e.target.value })}
                                    required
                                >
                                    <option value="">Select Item</option>
                                    {items.map(i => <option key={i.id} value={i.item_code}>{i.item_name}</option>)}
                                </select>
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    className="w-full border p-2 rounded"
                                    value={newEntry.qty}
                                    onChange={(e) => setNewEntry({ ...newEntry, qty: Number(e.target.value) })}
                                    required
                                    min="1"
                                />
                                
                                {selectedItemDetails?.has_serial_no && (
                                    <textarea
                                        placeholder="Serial Numbers (One per line)"
                                        className="w-full border p-2 rounded mt-2"
                                        value={newEntry.serial_no}
                                        onChange={(e) => setNewEntry({ ...newEntry, serial_no: e.target.value })}
                                        rows={3}
                                    />
                                )}

                                {selectedItemDetails?.has_batch_no && (
                                    <input
                                        type="text"
                                        placeholder="Batch Number"
                                        className="w-full border p-2 rounded mt-2"
                                        value={newEntry.batch_no}
                                        onChange={(e) => setNewEntry({ ...newEntry, batch_no: e.target.value })}
                                    />
                                )}
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
