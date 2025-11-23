'use client';

import { useState, useEffect } from 'react';
import { fetchDashboardStats, DashboardStats } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Link from 'next/link';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-center text-gray-500">Failed to load dashboard data.</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Overview of your business performance</p>
        </div>
        {user && (
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            👤 {user.email}
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Total Sales</h3>
          <p className="text-2xl font-bold text-gray-800">${stats.sales.total.toLocaleString()}</p>
          <div className="text-xs text-gray-500 mt-1">{stats.sales.count} Invoices</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Total Purchases</h3>
          <p className="text-2xl font-bold text-gray-800">${stats.purchases.total.toLocaleString()}</p>
          <div className="text-xs text-gray-500 mt-1">{stats.purchases.count} Orders</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Stock Value</h3>
          <p className="text-2xl font-bold text-gray-800">${stats.inventory.value.toLocaleString()}</p>
          <div className="text-xs text-gray-500 mt-1">{stats.inventory.items} Stock Items</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Net Profit</h3>
          <p className={`text-2xl font-bold ${stats.profit.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${stats.profit.net_profit.toLocaleString()}
          </p>
          <div className="text-xs text-gray-500 mt-1">{stats.profit.margin.toFixed(1)}% Margin</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Sales Trend (Last 6 Months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts.sales_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Stock Value by Warehouse</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.charts.stock_by_warehouse}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.charts.stock_by_warehouse.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Recent Sales Orders</h3>
            <Link href="/selling/orders" className="text-sm text-blue-600 hover:text-blue-800">View All</Link>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recent_sales_orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">#{order.id}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">${order.total_amount.toLocaleString()}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Recent Purchase Orders</h3>
            <Link href="/buying/orders" className="text-sm text-blue-600 hover:text-blue-800">View All</Link>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recent_purchase_orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">#{order.id}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">${order.total_amount.toLocaleString()}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/selling/invoices" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center justify-center flex-col text-center group">
          <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📄</span>
          <span className="text-sm font-medium text-gray-700">Sales Invoices</span>
        </Link>
        <Link href="/stock/entries" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center justify-center flex-col text-center group">
          <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📦</span>
          <span className="text-sm font-medium text-gray-700">Stock Entries</span>
        </Link>
        <Link href="/manufacturing/work-orders" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center justify-center flex-col text-center group">
          <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔨</span>
          <span className="text-sm font-medium text-gray-700">Work Orders</span>
        </Link>
        <Link href="/accounts/journal-entries" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center justify-center flex-col text-center group">
          <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📒</span>
          <span className="text-sm font-medium text-gray-700">Journal Entries</span>
        </Link>
      </div>
    </div>
  );
}
