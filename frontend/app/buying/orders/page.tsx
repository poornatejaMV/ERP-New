'use client';

import { useState, useEffect } from 'react';
import { fetchPurchaseOrders, createPurchaseOrder, fetchSuppliers, fetchItems, getItemPrice, PurchaseOrder, Supplier, Item, submitPurchaseOrder, makeReceipt, makePurchaseInvoice, fetchPurchaseTaxTemplates, TaxTemplate } from '@/lib/api';
import Link from 'next/link';

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [taxTemplates, setTaxTemplates] = useState<TaxTemplate[]>([]);
    const [showModal, setShowModal] = useState(false);

    const [newOrder, setNewOrder] = useState({
        supplier_id: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        tax_template_id: 0,
        item_code: '',
        qty: 1,
        rate: 0,
        amount: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [ordersData, suppliersData, itemsData, taxesData] = await Promise.all([
            fetchPurchaseOrders(),
            fetchSuppliers(),
            fetchItems(),
            fetchPurchaseTaxTemplates()
        ]);
        setOrders(ordersData);
        setSuppliers(suppliersData);
        setItems(itemsData);
        setTaxTemplates(taxesData);
    };

    const handleItemChange = async (itemCode: string) => {
        const selectedItem = items.find(i => i.item_code === itemCode);
        if (!selectedItem) return;

        let rate = selectedItem.standard_rate;
        try {
            const priceData = await getItemPrice(itemCode, 'buying');
            rate = priceData.price;
        } catch (e) {
            console.log("Using standard rate fallback");
        }
        
        setNewOrder(prev => ({
            ...prev,
            item_code: itemCode,
            rate: rate,
            amount: rate * prev.qty
        }));
    };
    
    const handleQtyChange = (qty: number) => {
        setNewOrder(prev => ({
            ...prev,
            qty: qty,
            amount: prev.rate * qty
        }));
    };

    // Calculate totals for display
    const calculateTotals = () => {
        const netTotal = newOrder.amount;
        let taxAmount = 0;
        if (newOrder.tax_template_id) {
            const template = taxTemplates.find(t => t.id === newOrder.tax_template_id);
            if (template) {
                template.taxes.forEach(tax => {
                    taxAmount += (netTotal * tax.rate) / 100;
                });
            }
        }
        return { netTotal, taxAmount, grandTotal: netTotal + taxAmount };
    };

    const totals = calculateTotals();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPurchaseOrder({
                supplier_id: Number(newOrder.supplier_id),
                transaction_date: newOrder.transaction_date,
                tax_template_id: Number(newOrder.tax_template_id) || undefined,
                total_amount: newOrder.amount, // Net Total
                items: [{
                    item_code: newOrder.item_code,
                    qty: Number(newOrder.qty),
                    rate: newOrder.rate,
                    amount: newOrder.amount
                }]
            });
            setShowModal(false);
            loadData();
            // Reset form
            setNewOrder({
                supplier_id: 0,
                transaction_date: new Date().toISOString().split('T')[0],
                tax_template_id: 0,
                item_code: '',
                qty: 1,
                rate: 0,
                amount: 0
            });
        } catch (e) {
            console.error(e);
            alert('Failed to create order');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
                <div className="space-x-4">
                    <Link href="/buying/suppliers" className="text-blue-600 hover:underline">View Suppliers</Link>
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        New Purchase Order
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((o) => (
                            <tr key={o.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{o.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.transaction_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${o.total_amount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${(o.total_taxes_and_charges || 0).toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">${(o.grand_total || o.total_amount).toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${o.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            o.status === 'Submitted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {o.status}
                                    </span>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {o.receipt_status} | {o.billing_status}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                                    {o.status === 'Draft' && (
                                        <button onClick={async () => { await submitPurchaseOrder(o.id); loadData(); }} className="text-blue-600 hover:text-blue-900">Submit</button>
                                    )}
                                    {o.status === 'Submitted' && o.receipt_status !== 'Fully Received' && (
                                        <button onClick={async () => { await makeReceipt(o.id); loadData(); }} className="text-green-600 hover:text-green-900">Make Receipt</button>
                                    )}
                                    {o.status === 'Submitted' && o.billing_status !== 'Fully Billed' && (
                                        <button onClick={async () => { await makePurchaseInvoice(o.id); loadData(); }} className="text-purple-600 hover:text-purple-900">Make Invoice</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
                    <div className="bg-white p-8 rounded-lg w-full max-w-md m-4">
                        <h2 className="text-xl font-bold mb-4">New Purchase Order</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                            <select
                                className="w-full border p-2 rounded mt-1"
                                value={newOrder.supplier_id}
                                onChange={(e) => setNewOrder({ ...newOrder, supplier_id: Number(e.target.value) })}
                                required
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
                            </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded mt-1"
                                    value={newOrder.transaction_date}
                                    onChange={(e) => setNewOrder({ ...newOrder, transaction_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tax Template</label>
                                <select
                                    className="w-full border p-2 rounded mt-1"
                                    value={newOrder.tax_template_id}
                                    onChange={(e) => setNewOrder({ ...newOrder, tax_template_id: Number(e.target.value) })}
                                >
                                    <option value="0">No Tax</option>
                                    {taxTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                </select>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Item Details</h3>
                                <div className="space-y-2">
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newOrder.item_code}
                                        onChange={(e) => handleItemChange(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Item</option>
                                        {items.map(i => <option key={i.id} value={i.item_code}>{i.item_name} (${i.standard_rate})</option>)}
                                    </select>
                                    <div className="flex space-x-2">
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            className="w-1/3 border p-2 rounded"
                                            value={newOrder.qty}
                                            onChange={(e) => handleQtyChange(Number(e.target.value))}
                                            required
                                            min="1"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Rate"
                                            className="w-1/3 border p-2 rounded bg-gray-100"
                                            value={newOrder.rate}
                                            readOnly
                                        />
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            className="w-1/3 border p-2 rounded bg-gray-100"
                                            value={newOrder.amount}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Net Total:</span>
                                    <span>${totals.netTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax:</span>
                                    <span>${totals.taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                    <span>Grand Total:</span>
                                    <span>${totals.grandTotal.toFixed(2)}</span>
                                </div>
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
