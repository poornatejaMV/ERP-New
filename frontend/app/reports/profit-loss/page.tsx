'use client';

import { useState, useEffect } from 'react';
import { fetchProfitLoss, ProfitLoss } from '@/lib/api';

export default function ProfitLossPage() {
  const [data, setData] = useState<ProfitLoss | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchProfitLoss();
      setData(result);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load profit & loss');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Profit & Loss Statement</h1>
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Profit & Loss Statement</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Profit & Loss Statement</h1>
        <button
          onClick={loadData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-green-600">Income</h2>
          <div className="space-y-2">
            {data.income.map((item, idx) => (
              <div key={idx} className="flex justify-between border-b pb-2">
                <span className="text-gray-700">{item.account}</span>
                <span className="font-semibold text-green-600">${item.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t-2 font-bold">
              <span>Total Income</span>
              <span className="text-green-600">${data.total_income.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">Expenses</h2>
          <div className="space-y-2">
            {data.expenses.map((item, idx) => (
              <div key={idx} className="flex justify-between border-b pb-2">
                <span className="text-gray-700">{item.account}</span>
                <span className="font-semibold text-red-600">${item.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t-2 font-bold">
              <span>Total Expenses</span>
              <span className="text-red-600">${data.total_expense.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">Net Profit</span>
          <span className={`text-3xl font-bold ${data.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${data.net_profit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
