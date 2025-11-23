'use client';

import { useState, useEffect } from 'react';
import { fetchStockLedger, fetchItems, StockLedgerEntry, Item } from '@/lib/api';

export default function StockLedgerPage() {
    const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItem, setSelectedItem] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [ledgerData, itemsData] = await Promise.all([
            fetchStockLedger(),
            fetchItems()
        ]);
        setLedger(ledgerData);
        setItems(itemsData);
    };

    const handleFilter = async () => {
        const data = await fetchStockLedger(selectedItem || undefined);
        setLedger(data);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Stock Ledger</h1>
                <div className="flex space-x-4">
                    <select
                        className="border p-2 rounded"
                        value={selectedItem}
                        onChange={(e) => setSelectedItem(e.target.value)}
                    >
                        <option value="">All Items</option>
                        {items.map(i => <option key={i.id} value={i.item_code}>{i.item_name}</option>)}
                    </select>
                    <button onClick={handleFilter} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Filter
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">In Qty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Out Qty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {ledger.map((entry) => (
                            <tr key={entry.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.posting_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.item_code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {entry.voucher_type} #{entry.voucher_no}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    {entry.actual_qty > 0 ? entry.actual_qty.toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    {entry.actual_qty < 0 ? Math.abs(entry.actual_qty).toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                    {entry.qty_after_transaction.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    ${entry.valuation_rate.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    ${entry.stock_value.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {ledger.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                    No stock movements found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
