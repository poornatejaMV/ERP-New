'use client';

import { useState, useEffect } from 'react';
import { fetchAPReport, AgingReportEntry } from '@/lib/api';

export default function AccountsPayablePage() {
    const [report, setReport] = useState<AgingReportEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchAPReport();
            setReport(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Payable is negative in DB, but we show as positive liability in report usually.
    // My API returns raw signed amount.
    // If make_payment_ledger_entry set amount = -total_amount for Purchase Invoice, then it is negative.
    // So we should invert or just show abs.
    
    const totalOutstanding = report.reduce((sum, item) => sum + item.outstanding, 0);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Accounts Payable Aging</h1>
                <div className="text-xl font-semibold">Total: ${Math.abs(totalOutstanding).toFixed(2)}</div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Age (Days)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : report.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No outstanding payables.</td></tr>
                        ) : (
                            report.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.party}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.voucher_no}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.posting_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.age}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">${Math.abs(item.outstanding).toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

