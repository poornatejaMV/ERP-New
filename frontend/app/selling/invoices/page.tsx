'use client';

import { useState, useEffect } from 'react';
import { fetchSalesInvoices, SalesInvoice, createSalesReturn, submitSalesReturn, getInvoicePdf } from '@/lib/api';

export default function SalesInvoicesPage() {
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await fetchSalesInvoices();
        setInvoices(data);
    };

    const handleDownloadPdf = async (id: number) => {
        try {
            const blob = await getInvoicePdf(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error(e);
            alert('Failed to download PDF');
        }
    };

    const handleCreateReturn = async (id: number) => {
        if (!confirm('Are you sure you want to create a return (Credit Note) for this invoice?')) return;
        
        setLoading(true);
        try {
            const res = await createSalesReturn(id);
            alert(`Return Invoice Created: #${res.invoice_id}. Please submit it to finalize.`);
            loadData();
        } catch (e: any) {
            console.error(e);
            alert('Failed to create return: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReturn = async (id: number) => {
        if (!confirm('Are you sure you want to submit this return? This will affect stock and accounting.')) return;
        
        setLoading(true);
        try {
            await submitSalesReturn(id);
            alert('Return Submitted Successfully');
            loadData();
        } catch (e: any) {
            console.error(e);
            alert('Failed to submit return: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Sales Invoices</h1>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((inv: any) => (
                            <tr key={inv.id} className={inv.is_return ? "bg-red-50" : ""}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    #{inv.id} {inv.is_return && <span className="text-xs text-red-600 ml-1">(Return)</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.posting_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Customer #{inv.customer_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                    ${inv.total_amount?.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                    ${(inv.total_taxes_and_charges || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                    ${inv.grand_total?.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                    ${inv.outstanding_amount?.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${inv.status === 'Draft' ? 'bg-gray-100 text-gray-800' : ''}
                                        ${inv.status === 'Submitted' ? 'bg-blue-100 text-blue-800' : ''}
                                        ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : ''}
                                        ${inv.status === 'Overdue' ? 'bg-red-100 text-red-800' : ''}
                                        ${inv.status === 'Return' ? 'bg-orange-100 text-orange-800' : ''}
                                    `}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => handleDownloadPdf(inv.id)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                        title="Download PDF"
                                    >
                                        PDF
                                    </button>
                                    {!inv.is_return && (inv.status === 'Submitted' || inv.status === 'Paid' || inv.status === 'Overdue') && (
                                        <button 
                                            onClick={() => handleCreateReturn(inv.id)}
                                            disabled={loading}
                                            className="text-red-600 hover:text-red-900"
                                            title="Create Credit Note"
                                        >
                                            Return
                                        </button>
                                    )}
                                    
                                    {inv.is_return && inv.status === 'Draft' && (
                                         <button 
                                            onClick={() => handleSubmitReturn(inv.id)}
                                            disabled={loading}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Submit Return
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
