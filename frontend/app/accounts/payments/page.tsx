'use client';

import { useState, useEffect } from 'react';
import { 
    fetchPaymentEntries, 
    createPaymentEntry, 
    fetchCustomers, 
    fetchSuppliers, 
    fetchSalesInvoices, 
    fetchPurchaseInvoices,
    PaymentEntry, 
    Customer, 
    Supplier, 
    SalesInvoice, 
    PurchaseInvoice 
} from '@/lib/api';

export default function PaymentEntriesPage() {
    const [payments, setPayments] = useState<PaymentEntry[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [invoices, setInvoices] = useState<(SalesInvoice | PurchaseInvoice)[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [newPayment, setNewPayment] = useState({
        posting_date: new Date().toISOString().split('T')[0],
        payment_type: 'Receive', // Receive or Pay
        party_type: 'Customer', // Customer or Supplier
        party_name: '', // Customer Name or Supplier Name
        mode_of_payment: 'Cash',
        paid_amount: 0,
        reference_no: '',
        reference_date: new Date().toISOString().split('T')[0],
        references: [] as { reference_doctype: string, reference_name: string, allocated_amount: number }[]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [paymentsData, customersData, suppliersData] = await Promise.all([
            fetchPaymentEntries(),
            fetchCustomers(),
            fetchSuppliers()
        ]);
        setPayments(paymentsData);
        setCustomers(customersData);
        setSuppliers(suppliersData);
    };

    // Fetch outstanding invoices when party is selected
    useEffect(() => {
        if (newPayment.party_name) {
            fetchOutstandingInvoices();
        }
    }, [newPayment.party_name, newPayment.party_type]);

    const fetchOutstandingInvoices = async () => {
        if (newPayment.party_type === 'Customer') {
            // For now fetch all and filter. Ideally backend should support filtering
            const allInvoices = await fetchSalesInvoices();
            const partyInvoices = allInvoices.filter(inv => 
                // Assuming API returns customer_id, we need to match. 
                // For this demo, we might need to enhance backend filtering.
                // A simplified approach: show all unpaid invoices for now or filter by ID if we had it mapping
                inv.status !== 'Paid'
            );
            setInvoices(partyInvoices);
        } else {
            const allInvoices = await fetchPurchaseInvoices();
            const partyInvoices = allInvoices.filter(inv => inv.status !== 'Paid');
            setInvoices(partyInvoices);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Auto-allocate logic (simplified: allocate to first selected invoice)
            // In a real app, we'd have a grid to select invoices and amount
            const paymentData = {
                ...newPayment,
                party_id: Number(newPayment.party_name),
                references: newPayment.references.map(ref => ({
                    ...ref,
                    reference_name: Number(ref.reference_name)
                }))
            };

            await createPaymentEntry(paymentData);
            setShowModal(false);
            loadData();
            // Reset form
            setNewPayment({
                posting_date: new Date().toISOString().split('T')[0],
                payment_type: 'Receive',
                party_type: 'Customer',
                party_name: '',
                mode_of_payment: 'Cash',
                paid_amount: 0,
                reference_no: '',
                reference_date: new Date().toISOString().split('T')[0],
                references: []
            });
        } catch (e) {
            console.error(e);
            alert('Failed to create payment entry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Payment Entries</h1>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    New Payment
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((p) => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{p.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.posting_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.party_type} - {p.party}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        p.payment_type === 'Receive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {p.payment_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                    ${p.paid_amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.mode_of_payment}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">New Payment Entry</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Posting Date</label>
                                    <input
                                        type="date"
                                        className="mt-1 w-full border p-2 rounded"
                                        value={newPayment.posting_date}
                                        onChange={(e) => setNewPayment({ ...newPayment, posting_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                                    <select
                                        className="mt-1 w-full border p-2 rounded"
                                        value={newPayment.payment_type}
                                        onChange={(e) => setNewPayment({ 
                                            ...newPayment, 
                                            payment_type: e.target.value,
                                            party_type: e.target.value === 'Receive' ? 'Customer' : 'Supplier',
                                            party_name: ''
                                        })}
                                        required
                                    >
                                        <option value="Receive">Receive</option>
                                        <option value="Pay">Pay</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Party Type</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border p-2 rounded bg-gray-100"
                                        value={newPayment.party_type}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Party</label>
                                    <select
                                        className="mt-1 w-full border p-2 rounded"
                                        value={newPayment.party_name}
                                        onChange={(e) => setNewPayment({ ...newPayment, party_name: e.target.value })}
                                        required
                                    >
                                        <option value="">Select {newPayment.party_type}</option>
                                        {newPayment.party_type === 'Customer' 
                                            ? customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)
                                            : suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mode of Payment</label>
                                    <select
                                        className="mt-1 w-full border p-2 rounded"
                                        value={newPayment.mode_of_payment}
                                        onChange={(e) => setNewPayment({ ...newPayment, mode_of_payment: e.target.value })}
                                        required
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank">Bank</option>
                                        <option value="Check">Check</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Paid Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="mt-1 w-full border p-2 rounded"
                                        value={newPayment.paid_amount}
                                        onChange={(e) => setNewPayment({ ...newPayment, paid_amount: Number(e.target.value) })}
                                        required
                                        min="0.01"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Allocation (Optional)</h3>
                                <div className="bg-gray-50 p-2 rounded text-sm text-gray-600 mb-2">
                                    Select outstanding invoices to allocate this payment against.
                                </div>
                                {invoices.length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto border rounded">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs">ID</th>
                                                    <th className="px-4 py-2 text-right text-xs">Outstanding</th>
                                                    <th className="px-4 py-2 text-left text-xs">Select</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoices.map(inv => (
                                                    <tr key={inv.id}>
                                                        <td className="px-4 py-2 text-xs">#{inv.id}</td>
                                                        <td className="px-4 py-2 text-xs text-right">${(inv.outstanding_amount || inv.total_amount).toFixed(2)}</td>
                                                        <td className="px-4 py-2 text-xs">
                                                            <button 
                                                                type="button"
                                                                className="text-blue-600 hover:underline"
                                                                onClick={() => {
                                                                    // Simple allocation logic: add to references
                                                                    const currentRefs = [...newPayment.references];
                                                                    // Check if already added
                                                                    if (!currentRefs.find(r => r.reference_name === String(inv.id))) {
                                                                        currentRefs.push({
                                                                            reference_doctype: newPayment.party_type === 'Customer' ? 'Sales Invoice' : 'Purchase Invoice',
                                                                            reference_name: String(inv.id),
                                                                            allocated_amount: inv.outstanding_amount || inv.total_amount
                                                                        });
                                                                        setNewPayment({ ...newPayment, references: currentRefs });
                                                                    }
                                                                }}
                                                            >
                                                                Add
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-sm">No outstanding invoices found for this party.</p>
                                )}
                                
                                {newPayment.references.length > 0 && (
                                    <div className="mt-2">
                                        <h4 className="text-sm font-medium">Allocated:</h4>
                                        <ul className="list-disc list-inside text-sm">
                                            {newPayment.references.map((ref, idx) => (
                                                <li key={idx}>
                                                    {ref.reference_doctype} #{ref.reference_name}: ${ref.allocated_amount}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
