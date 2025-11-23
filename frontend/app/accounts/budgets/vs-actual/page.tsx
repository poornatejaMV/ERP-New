'use client';

import { useState, useEffect } from 'react';
import { 
    fetchAllBudgetsVsActual,
    fetchCompanies,
    BudgetVsActual,
    Company
} from '@/lib/api';

export default function BudgetVsActualPage() {
    const [report, setReport] = useState<BudgetVsActual[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        company_id: 0,
        as_on_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [reportData, companiesData] = await Promise.all([
                fetchAllBudgetsVsActual(filters.company_id || undefined, filters.as_on_date),
                fetchCompanies()
            ]);
            setReport(reportData);
            setCompanies(companiesData);
        } catch (e) {
            console.error('Error loading report:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = () => {
        loadData();
    };

    const getVarianceColor = (variance: number, variancePercentage: number) => {
        if (variancePercentage > 10) return 'text-green-600 font-semibold';
        if (variancePercentage < -10) return 'text-red-600 font-semibold';
        return 'text-gray-600';
    };

    const totalBudget = report.reduce((sum, item) => sum + item.budget_amount, 0);
    const totalActual = report.reduce((sum, item) => sum + item.actual_expense, 0);
    const totalVariance = totalBudget - totalActual;
    const totalVariancePercentage = totalBudget > 0 ? (totalVariance / totalBudget * 100) : 0;

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Budget vs Actual Report</h1>
                
                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow mb-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                            <select
                                className="w-full border p-2 rounded"
                                value={filters.company_id}
                                onChange={(e) => {
                                    setFilters({...filters, company_id: Number(e.target.value)});
                                    setTimeout(handleFilterChange, 100);
                                }}
                            >
                                <option value="0">All Companies</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.company_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">As On Date</label>
                            <input
                                type="date"
                                className="w-full border p-2 rounded"
                                value={filters.as_on_date}
                                onChange={(e) => {
                                    setFilters({...filters, as_on_date: e.target.value});
                                    setTimeout(handleFilterChange, 100);
                                }}
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={loadData}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500">Total Budget</div>
                        <div className="text-2xl font-bold text-gray-800">${totalBudget.toFixed(2)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500">Total Actual</div>
                        <div className="text-2xl font-bold text-gray-800">${totalActual.toFixed(2)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500">Variance</div>
                        <div className={`text-2xl font-bold ${getVarianceColor(totalVariance, totalVariancePercentage)}`}>
                            ${totalVariance.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500">Variance %</div>
                        <div className={`text-2xl font-bold ${getVarianceColor(totalVariance, totalVariancePercentage)}`}>
                            {totalVariancePercentage.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance %</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : report.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                    No budget data found. Create and submit budgets first.
                                </td>
                            </tr>
                        ) : (
                            report.map((item) => (
                                <tr key={item.budget_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.budget_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.account_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.period_start} to {item.period_end}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        ${item.budget_amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        ${item.actual_expense.toFixed(2)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getVarianceColor(item.variance, item.variance_percentage)}`}>
                                        ${item.variance.toFixed(2)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getVarianceColor(item.variance, item.variance_percentage)}`}>
                                        {item.variance_percentage.toFixed(1)}%
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {report.length > 0 && (
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900">Total</td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                                    ${totalBudget.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                                    ${totalActual.toFixed(2)}
                                </td>
                                <td className={`px-6 py-4 text-sm font-semibold text-right ${getVarianceColor(totalVariance, totalVariancePercentage)}`}>
                                    ${totalVariance.toFixed(2)}
                                </td>
                                <td className={`px-6 py-4 text-sm font-semibold text-right ${getVarianceColor(totalVariance, totalVariancePercentage)}`}>
                                    {totalVariancePercentage.toFixed(1)}%
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}





