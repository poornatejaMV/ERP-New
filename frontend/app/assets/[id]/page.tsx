'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    fetchAsset,
    fetchDepreciationSchedules,
    postDepreciation,
    disposeAsset,
    Asset,
    AssetDepreciationSchedule
} from '@/lib/api';

export default function AssetDetailPage() {
    const params = useParams();
    const router = useRouter();
    const assetId = Number(params.id);
    
    const [asset, setAsset] = useState<Asset | null>(null);
    const [schedules, setSchedules] = useState<AssetDepreciationSchedule[]>([]);
    const [showDisposeModal, setShowDisposeModal] = useState(false);
    const [disposalData, setDisposalData] = useState({
        disposal_date: new Date().toISOString().split('T')[0],
        disposal_type: 'Sold',
        disposal_amount: 0,
        notes: ''
    });

    useEffect(() => {
        if (assetId) {
            loadData();
        }
    }, [assetId]);

    const loadData = async () => {
        try {
            const [assetData, schedulesData] = await Promise.all([
                fetchAsset(assetId),
                fetchDepreciationSchedules(assetId)
            ]);
            setAsset(assetData);
            setSchedules(schedulesData);
        } catch (e) {
            console.error('Error loading asset:', e);
        }
    };

    const handlePostDepreciation = async (scheduleId: number) => {
        if (!confirm('Post this depreciation entry? This will create a journal entry.')) return;
        try {
            await postDepreciation(assetId, scheduleId);
            alert('Depreciation posted successfully');
            loadData();
        } catch (e: any) {
            alert('Failed to post depreciation: ' + (e.message || 'Unknown error'));
        }
    };

    const handleDispose = async () => {
        if (!confirm(`Dispose this asset as ${disposalData.disposal_type}?`)) return;
        try {
            await disposeAsset(assetId, disposalData);
            alert('Asset disposed successfully');
            router.push('/assets');
        } catch (e: any) {
            alert('Failed to dispose asset: ' + (e.message || 'Unknown error'));
        }
    };

    if (!asset) {
        return <div className="p-8">Loading...</div>;
    }

    const unreconciledSchedules = schedules.filter(s => s.status === 'Draft');
    const postedSchedules = schedules.filter(s => s.status === 'Posted');

    return (
        <div className="p-8">
            <div className="mb-6">
                <button
                    onClick={() => router.push('/assets')}
                    className="text-blue-600 hover:text-blue-900 mb-4"
                >
                    ← Back to Assets
                </button>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{asset.asset_name}</h1>
                        <p className="text-gray-500">Asset #{asset.asset_number || asset.id}</p>
                    </div>
                    {asset.status === 'Submitted' && (
                        <button
                            onClick={() => setShowDisposeModal(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                            Dispose Asset
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Asset Details</h2>
                    <dl className="space-y-2">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    asset.status === 'Submitted' ? 'bg-green-100 text-green-800' :
                                    asset.status === 'Fully Depreciated' ? 'bg-gray-100 text-gray-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {asset.status}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
                            <dd className="text-gray-900">{asset.purchase_date}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Purchase Amount</dt>
                            <dd className="text-gray-900">${asset.purchase_amount.toFixed(2)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Additional Cost</dt>
                            <dd className="text-gray-900">${asset.additional_cost.toFixed(2)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Total Asset Cost</dt>
                            <dd className="text-gray-900 font-semibold">${asset.total_asset_cost.toFixed(2)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Location</dt>
                            <dd className="text-gray-900">{asset.location || '-'}</dd>
                        </div>
                    </dl>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Depreciation Details</h2>
                    <dl className="space-y-2">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Method</dt>
                            <dd className="text-gray-900">{asset.depreciation_method}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                            <dd className="text-gray-900">{asset.frequency_of_depreciation} months</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Total Depreciations</dt>
                            <dd className="text-gray-900">{asset.total_number_of_depreciations}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Booked Depreciations</dt>
                            <dd className="text-gray-900">{asset.total_number_of_booked_depreciations}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Accumulated Depreciation</dt>
                            <dd className="text-gray-900">${asset.accumulated_depreciation.toFixed(2)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Current Value</dt>
                            <dd className="text-gray-900 font-semibold">${asset.value_after_depreciation.toFixed(2)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Next Depreciation Date</dt>
                            <dd className="text-gray-900">{asset.next_depreciation_date || '-'}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Depreciation Schedules */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold">Depreciation Schedule</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {unreconciledSchedules.length} unreconciled, {postedSchedules.length} posted
                    </p>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Depreciation Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accumulated</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value After</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {schedules.map((schedule) => (
                            <tr key={schedule.id} className={schedule.status === 'Posted' ? 'bg-green-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.schedule_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    ${schedule.depreciation_amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    ${schedule.accumulated_depreciation.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    ${schedule.value_after_depreciation.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {schedule.status === 'Posted' ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Posted
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            Draft
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {schedule.status === 'Draft' && (
                                        <button
                                            onClick={() => handlePostDepreciation(schedule.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Post
                                        </button>
                                    )}
                                    {schedule.status === 'Posted' && schedule.journal_entry_id && (
                                        <span className="text-gray-500">JE #{schedule.journal_entry_id}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {schedules.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No depreciation schedules found. Calculate depreciation first.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Dispose Modal */}
            {showDisposeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-full max-w-md m-4">
                        <h2 className="text-xl font-bold mb-4">Dispose Asset</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Disposal Type *</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={disposalData.disposal_type}
                                    onChange={(e) => setDisposalData({...disposalData, disposal_type: e.target.value})}
                                >
                                    <option value="Sold">Sold</option>
                                    <option value="Scrapped">Scrapped</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Disposal Date *</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded"
                                    value={disposalData.disposal_date}
                                    onChange={(e) => setDisposalData({...disposalData, disposal_date: e.target.value})}
                                    required
                                />
                            </div>
                            {disposalData.disposal_type === 'Sold' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border p-2 rounded"
                                        value={disposalData.disposal_amount}
                                        onChange={(e) => setDisposalData({...disposalData, disposal_amount: Number(e.target.value)})}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    value={disposalData.notes}
                                    onChange={(e) => setDisposalData({...disposalData, notes: e.target.value})}
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <button
                                    onClick={() => setShowDisposeModal(false)}
                                    className="px-4 py-2 text-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDispose}
                                    className="px-4 py-2 bg-red-600 text-white rounded"
                                >
                                    Dispose Asset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}





