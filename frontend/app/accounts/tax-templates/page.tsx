'use client';

import { useState, useEffect } from 'react';
import { fetchSalesTaxTemplates, fetchPurchaseTaxTemplates, createSalesTaxTemplate, createPurchaseTaxTemplate, fetchAccounts, fetchCompanies, TaxTemplate, Account, Company, TaxTemplateDetail } from '@/lib/api';

export default function TaxTemplatesPage() {
    const [salesTemplates, setSalesTemplates] = useState<TaxTemplate[]>([]);
    const [purchaseTemplates, setPurchaseTemplates] = useState<TaxTemplate[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'Sales' | 'Purchase'>('Sales');
    
    const [newTemplate, setNewTemplate] = useState({
        title: '',
        company_id: 0,
        is_default: false,
        taxes: [{ account_id: 0, rate: 0, description: '' }]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [st, pt, acc, comp] = await Promise.all([
                fetchSalesTaxTemplates(),
                fetchPurchaseTaxTemplates(),
                fetchAccounts(),
                fetchCompanies()
            ]);
            setSalesTemplates(st);
            setPurchaseTemplates(pt);
            setAccounts(acc);
            setCompanies(comp);
        } catch (e) {
            console.error(e);
        }
    };

    const addTaxRow = () => {
        setNewTemplate({
            ...newTemplate,
            taxes: [...newTemplate.taxes, { account_id: 0, rate: 0, description: '' }]
        });
    };

    const updateTaxRow = (index: number, field: string, value: any) => {
        const updatedTaxes = [...newTemplate.taxes];
        updatedTaxes[index] = { ...updatedTaxes[index], [field]: value };
        setNewTemplate({ ...newTemplate, taxes: updatedTaxes });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate company_id
        if (!newTemplate.company_id || newTemplate.company_id === 0) {
            alert('Please select a company');
            return;
        }
        
        // Validate taxes
        const validTaxes = newTemplate.taxes.filter(t => t.account_id && t.account_id !== 0 && t.rate > 0);
        if (validTaxes.length === 0) {
            alert('Please add at least one tax with a valid account and rate');
            return;
        }
        
        try {
            const payload = {
                ...newTemplate,
                company_id: Number(newTemplate.company_id),
                taxes: validTaxes.map(t => ({ 
                    account_id: Number(t.account_id), 
                    rate: Number(t.rate),
                    description: t.description || undefined
                }))
            };
            
            if (modalType === 'Sales') {
                await createSalesTaxTemplate(payload);
            } else {
                await createPurchaseTaxTemplate(payload);
            }
            
            setShowModal(false);
            loadData();
            setNewTemplate({ title: '', company_id: 0, is_default: false, taxes: [{ account_id: 0, rate: 0, description: '' }] });
        } catch (e: any) {
            console.error('Error creating template:', e);
            alert('Failed to create template: ' + (e.message || 'Unknown error'));
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Tax Templates</h1>
                <div className="space-x-2">
                    <button onClick={() => { setModalType('Sales'); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        New Sales Template
                    </button>
                    <button onClick={() => { setModalType('Purchase'); setShowModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        New Purchase Template
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sales Templates */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4 text-blue-800">Sales Taxes</h2>
                    <ul className="space-y-4">
                        {salesTemplates.map(t => (
                            <li key={t.id} className="border p-4 rounded hover:bg-gray-50">
                                <div className="flex justify-between font-semibold">
                                    <span>{t.title}</span>
                                    {t.is_default && <span className="text-xs bg-gray-200 px-2 py-1 rounded">Default</span>}
                                </div>
                                <div className="mt-2 space-y-1">
                                    {t.taxes.map((tax, i) => (
                                        <div key={i} className="text-sm text-gray-600 flex justify-between">
                                            <span>{accounts.find(a => a.id === tax.account_id)?.account_name || 'Unknown Acct'}</span>
                                            <span>{tax.rate}%</span>
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                        {salesTemplates.length === 0 && <li className="text-gray-500 italic">No templates found.</li>}
                    </ul>
                </div>

                {/* Purchase Templates */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4 text-green-800">Purchase Taxes</h2>
                    <ul className="space-y-4">
                        {purchaseTemplates.map(t => (
                            <li key={t.id} className="border p-4 rounded hover:bg-gray-50">
                                <div className="flex justify-between font-semibold">
                                    <span>{t.title}</span>
                                    {t.is_default && <span className="text-xs bg-gray-200 px-2 py-1 rounded">Default</span>}
                                </div>
                                <div className="mt-2 space-y-1">
                                    {t.taxes.map((tax, i) => (
                                        <div key={i} className="text-sm text-gray-600 flex justify-between">
                                            <span>{accounts.find(a => a.id === tax.account_id)?.account_name || 'Unknown Acct'}</span>
                                            <span>{tax.rate}%</span>
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                        {purchaseTemplates.length === 0 && <li className="text-gray-500 italic">No templates found.</li>}
                    </ul>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
                    <div className="bg-white p-8 rounded-lg w-full max-w-2xl m-4">
                        <h2 className="text-xl font-bold mb-4">New {modalType} Tax Template</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Template Title (e.g. VAT 5%)"
                                    className="border p-2 rounded w-full"
                                    value={newTemplate.title}
                                    onChange={e => setNewTemplate({...newTemplate, title: e.target.value})}
                                    required
                                />
                                <select
                                    className="border p-2 rounded w-full"
                                    value={newTemplate.company_id}
                                    onChange={e => setNewTemplate({...newTemplate, company_id: Number(e.target.value)})}
                                    required
                                >
                                    <option value="0">Select Company</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                                </select>
                            </div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={newTemplate.is_default}
                                    onChange={e => setNewTemplate({...newTemplate, is_default: e.target.checked})}
                                />
                                <span>Set as Default</span>
                            </label>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Taxes</h3>
                                <table className="min-w-full border mb-2">
                                    <thead>
                                        <tr className="bg-gray-50 text-sm">
                                            <th className="p-2 text-left">Account Head</th>
                                            <th className="p-2 text-right w-24">Rate (%)</th>
                                            <th className="p-2 text-left">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newTemplate.taxes.map((tax, index) => (
                                            <tr key={index}>
                                                <td className="p-2">
                                                    <select
                                                        className="w-full border p-1 rounded"
                                                        value={tax.account_id}
                                                        onChange={e => updateTaxRow(index, 'account_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="0">Select Account</option>
                                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="w-full border p-1 rounded text-right"
                                                        value={tax.rate}
                                                        onChange={e => updateTaxRow(index, 'rate', e.target.value)}
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        className="w-full border p-1 rounded"
                                                        value={tax.description}
                                                        onChange={e => updateTaxRow(index, 'description', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button type="button" onClick={addTaxRow} className="text-blue-600 text-sm hover:underline">+ Add Tax Row</button>
                            </div>

                            <div className="flex justify-end space-x-2 border-t pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Template</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

