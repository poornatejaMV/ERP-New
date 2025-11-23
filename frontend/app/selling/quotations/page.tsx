'use client';

import { useState, useEffect } from 'react';
import { fetchQuotations, createQuotation, submitQuotation, makeSalesOrder, fetchCustomers, Quotation, Customer, Item, fetchItems } from '@/lib/api';

export default function QuotationsPage() {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [newQuotation, setNewQuotation] = useState({
        customer_id: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        valid_till: '',
        items: [{ item_code: '', qty: 1, rate: 0, amount: 0 }]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [qtData, custData, itemsData] = await Promise.all([
                fetchQuotations(),
                fetchCustomers(),
                fetchItems()
            ]);
            setQuotations(qtData);
            setCustomers(custData);
            setItems(itemsData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const updatedItems = [...newQuotation.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        
        if (field === 'item_code') {
            const selectedItem = items.find(i => i.item_code === value);
            if (selectedItem) {
                updatedItems[index].rate = selectedItem.standard_rate;
            }
        }
        
        updatedItems[index].amount = updatedItems[index].qty * updatedItems[index].rate;
        setNewQuotation({ ...newQuotation, items: updatedItems });
    };

    const addItem = () => {
        setNewQuotation({
            ...newQuotation,
            items: [...newQuotation.items, { item_code: '', qty: 1, rate: 0, amount: 0 }]
        });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createQuotation({
                ...newQuotation,
                customer_id: Number(newQuotation.customer_id),
                valid_till: newQuotation.valid_till || undefined
            });
            setShowModal(false);
            loadData();
            // Reset form
            setNewQuotation({
                customer_id: 0,
                transaction_date: new Date().toISOString().split('T')[0],
                valid_till: '',
                items: [{ item_code: '', qty: 1, rate: 0, amount: 0 }]
            });
        } catch (e) {
            alert('Failed to create quotation');
        }
    };

    const handleSubmit = async (id: number) => {
        try {
            await submitQuotation(id);
            loadData();
        } catch (e) {
            alert('Failed to submit quotation');
        }
    };

    const handleMakeOrder = async (id: number) => {
        try {
            const res: any = await makeSalesOrder(id);
            alert(`Sales Order created: ${res.sales_order_id}`);
            loadData();
        } catch (e) {
            alert('Failed to create sales order');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Quotations</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    New Quotation
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {quotations.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No quotations found.</td>
                            </tr>
                        ) : (
                            quotations.map((q) => (
                                <tr key={q.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{q.name || q.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q.transaction_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {customers.find(c => c.id === q.customer_id)?.customer_name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${q.total_amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${q.status === 'Submitted' ? 'bg-blue-100 text-blue-800' : 
                                              q.status === 'Ordered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {q.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {q.status === 'Draft' && (
                                            <button onClick={() => handleSubmit(q.id)} className="text-green-600 hover:text-green-900">Submit</button>
                                        )}
                                        {q.status === 'Submitted' && (
                                            <button onClick={() => handleMakeOrder(q.id)} className="text-blue-600 hover:text-blue-900">Make Order</button>
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
                        <h2 className="text-xl font-bold mb-4">New Quotation</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <select
                                    className="border p-2 rounded"
                                    value={newQuotation.customer_id}
                                    onChange={e => setNewQuotation({...newQuotation, customer_id: Number(e.target.value)})}
                                    required
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
                                </select>
                                <input
                                    type="date"
                                    className="border p-2 rounded"
                                    value={newQuotation.transaction_date}
                                    onChange={e => setNewQuotation({...newQuotation, transaction_date: e.target.value})}
                                    required
                                />
                                <input
                                    type="date"
                                    placeholder="Valid Till"
                                    className="border p-2 rounded"
                                    value={newQuotation.valid_till}
                                    onChange={e => setNewQuotation({...newQuotation, valid_till: e.target.value})}
                                />
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Items</h3>
                                <table className="min-w-full border mb-2">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 text-left">Item</th>
                                            <th className="p-2 text-right w-24">Qty</th>
                                            <th className="p-2 text-right w-32">Rate</th>
                                            <th className="p-2 text-right w-32">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newQuotation.items.map((item, index) => (
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
                                                        type="number"
                                                        className="w-full border p-1 rounded text-right"
                                                        value={item.rate}
                                                        onChange={e => handleItemChange(index, 'rate', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="p-2 text-right">
                                                    {item.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button type="button" onClick={addItem} className="text-blue-600 text-sm hover:underline">+ Add Row</button>
                            </div>

                            <div className="flex justify-end space-x-2 border-t pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Quotation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

