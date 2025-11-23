'use client';

import { useState, useEffect } from 'react';

interface StockItem {
    item_code: string;
    balance: number;
    valuation_rate: number;
    value: number;
}

interface StockBalanceData {
    items: StockItem[];
    total_value: number;
}

export default function StockBalancePage() {
    const [data, setData] = useState<StockBalanceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await fetch('http://localhost:8000/stock/reports/stock-balance');
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Failed to load stock balance:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!data) {
        return <div className="p-8">Failed to load report</div>;
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Stock Balance Report</h1>
                <p className="text-gray-600">Current inventory valuation</p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item Code
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valuation Rate
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Value
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.item_code}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                                    {item.balance.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                                    ${item.valuation_rate.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono font-semibold">
                                    ${item.value.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {data.items.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    No stock items found
                                </td>
                            </tr>
                        )}
                        <tr className="bg-blue-50 font-bold">
                            <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                TOTAL INVENTORY VALUE
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 text-right font-mono text-lg">
                                ${data.total_value.toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Items</h3>
                    <p className="text-3xl font-bold text-gray-800">{data.items.length}</p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Units</h3>
                    <p className="text-3xl font-bold text-gray-800">
                        {data.items.reduce((sum, item) => sum + item.balance, 0).toFixed(2)}
                    </p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Value</h3>
                    <p className="text-3xl font-bold text-blue-600">${data.total_value.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
}
