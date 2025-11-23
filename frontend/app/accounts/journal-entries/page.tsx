'use client';

import { useState, useEffect } from 'react';
import { fetchJournalEntries, createJournalEntry, submitJournalEntry, cancelJournalEntry, fetchAccounts, JournalEntry, Account, JournalEntryCreate } from '@/lib/api';
import Link from 'next/link';

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newEntry, setNewEntry] = useState<JournalEntryCreate>({
    posting_date: new Date().toISOString().split('T')[0],
    title: '',
    accounts: [
      { account_id: 0, debit: 0, credit: 0 },
      { account_id: 0, debit: 0, credit: 0 },
    ],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesData, accountsData] = await Promise.all([
        fetchJournalEntries(),
        fetchAccounts(),
      ]);
      setEntries(entriesData);
      setAccounts(accountsData);
    } catch (e: any) {
      alert('Failed to load data: ' + e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate debit = credit
    const totalDebit = newEntry.accounts.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = newEntry.accounts.reduce((sum, acc) => sum + acc.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert('Total debit must equal total credit');
      return;
    }

    try {
      setLoading(true);
      await createJournalEntry(newEntry);
      setShowModal(false);
      setNewEntry({
        posting_date: new Date().toISOString().split('T')[0],
        title: '',
        accounts: [
          { account_id: 0, debit: 0, credit: 0 },
          { account_id: 0, debit: 0, credit: 0 },
        ],
      });
      loadData();
    } catch (e: any) {
      alert('Failed to create journal entry: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (id: number) => {
    if (!confirm('Submit this journal entry? This will create GL entries.')) return;
    try {
      await submitJournalEntry(id);
      loadData();
    } catch (e: any) {
      alert('Failed to submit: ' + e.message);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this journal entry? This will create reverse GL entries.')) return;
    try {
      await cancelJournalEntry(id);
      loadData();
    } catch (e: any) {
      alert('Failed to cancel: ' + e.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Journal Entries</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Journal Entry
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {entry.name || `#${entry.id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.posting_date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {entry.total_debit.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {entry.total_credit.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    entry.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                    entry.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entry.status || 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                  {entry.docstatus === 0 && (
                    <button
                      onClick={() => handleSubmit(entry.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Submit
                    </button>
                  )}
                  {entry.docstatus === 1 && (
                    <button
                      onClick={() => handleCancel(entry.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">New Journal Entry</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={newEntry.posting_date}
                onChange={(e) => setNewEntry({ ...newEntry, posting_date: e.target.value })}
                required
              />
              <input
                placeholder="Title"
                className="w-full border p-2 rounded"
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                required
              />
              
              <div className="space-y-2">
                <h3 className="font-semibold">Accounts</h3>
                {newEntry.accounts.map((acc, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 border p-2 rounded">
                    <select
                      className="border p-2 rounded"
                      value={acc.account_id}
                      onChange={(e) => {
                        const newAccounts = [...newEntry.accounts];
                        newAccounts[idx].account_id = Number(e.target.value);
                        setNewEntry({ ...newEntry, accounts: newAccounts });
                      }}
                      required
                    >
                      <option value="0">Select Account</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.account_name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Debit"
                      className="border p-2 rounded"
                      value={acc.debit || ''}
                      onChange={(e) => {
                        const newAccounts = [...newEntry.accounts];
                        newAccounts[idx].debit = Number(e.target.value);
                        newAccounts[idx].credit = 0;
                        setNewEntry({ ...newEntry, accounts: newAccounts });
                      }}
                      step="0.01"
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="Credit"
                      className="border p-2 rounded"
                      value={acc.credit || ''}
                      onChange={(e) => {
                        const newAccounts = [...newEntry.accounts];
                        newAccounts[idx].credit = Number(e.target.value);
                        newAccounts[idx].debit = 0;
                        setNewEntry({ ...newEntry, accounts: newAccounts });
                      }}
                      step="0.01"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newAccounts = newEntry.accounts.filter((_, i) => i !== idx);
                        setNewEntry({ ...newEntry, accounts: newAccounts });
                      }}
                      className="text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setNewEntry({
                      ...newEntry,
                      accounts: [...newEntry.accounts, { account_id: 0, debit: 0, credit: 0 }],
                    });
                  }}
                  className="text-blue-600 text-sm"
                >
                  + Add Account
                </button>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

