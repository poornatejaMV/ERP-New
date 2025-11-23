'use client';

import { useState, useEffect } from 'react';
import { fetchAccounts, createAccount, Account } from '@/lib/api';

export default function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newAccount, setNewAccount] = useState({ account_name: '', root_type: 'Asset', is_group: false });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        const data = await fetchAccounts();
        setAccounts(data);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAccount(newAccount);
            setShowModal(false);
            setNewAccount({ account_name: '', root_type: 'Asset', is_group: false });
            loadAccounts();
        } catch (e) {
            console.error(e);
            alert('Failed to create account');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Chart of Accounts</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                    New Account
                </button>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                {/* Simple list view for now, ideally a tree view */}
                <ul className="space-y-2">
                    {accounts.map((acc) => (
                        <li key={acc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border-b">
                            <span className={acc.is_group ? "font-bold text-gray-800" : "text-gray-600 ml-4"}>
                                {acc.account_name}
                            </span>
                            <span className="text-xs text-gray-400 uppercase">{acc.root_type}</span>
                        </li>
                    ))}
                    {accounts.length === 0 && <p className="text-gray-500">No accounts found.</p>}
                </ul>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Account</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                placeholder="Account Name"
                                className="w-full border p-2 rounded"
                                value={newAccount.account_name}
                                onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                                required
                            />
                            <select
                                className="w-full border p-2 rounded"
                                value={newAccount.root_type}
                                onChange={(e) => setNewAccount({ ...newAccount, root_type: e.target.value })}
                            >
                                <option value="Asset">Asset</option>
                                <option value="Liability">Liability</option>
                                <option value="Equity">Equity</option>
                                <option value="Income">Income</option>
                                <option value="Expense">Expense</option>
                            </select>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_group"
                                    className="mr-2"
                                    checked={newAccount.is_group}
                                    onChange={(e) => setNewAccount({ ...newAccount, is_group: e.target.checked })}
                                />
                                <label htmlFor="is_group">Is Group</label>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
