'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import Link from 'next/link';

export interface DeliveryNote {
    id: number;
    name: string;
    sales_order_id: number;
    customer_id: number;
    posting_date: string;
    total_amount: number;
    status: string;
}

export default function DeliveryNotesPage() {
    const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await apiRequest<DeliveryNote[]>('/selling/delivery-notes/');
            setDeliveryNotes(data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Delivery Notes</h1>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {deliveryNotes.map((dn) => (
                            <tr key={dn.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {dn.name || `#${dn.id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dn.posting_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${dn.total_amount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {dn.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {deliveryNotes.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    No Delivery Notes found. Create one from a Submitted Sales Order.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

