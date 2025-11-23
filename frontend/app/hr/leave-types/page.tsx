'use client';

import { useState, useEffect } from 'react';
import { fetchLeaveTypes, createLeaveType, LeaveType } from '@/lib/api';

export default function LeaveTypesPage() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newType, setNewType] = useState({
        leave_type_name: '',
        max_days_allowed: 0,
        is_carry_forward: false,
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchLeaveTypes();
            setLeaveTypes(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLeaveType(newType);
            setShowModal(false);
            loadData();
            setNewType({ leave_type_name: '', max_days_allowed: 0, is_carry_forward: false, is_active: true });
        } catch (e) {
            alert('Failed to create leave type');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Leave Types</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    New Leave Type
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Days</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carry Forward</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {leaveTypes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No leave types found.</td>
                            </tr>
                        ) : (
                            leaveTypes.map((lt) => (
                                <tr key={lt.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{lt.leave_type_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{lt.max_days_allowed}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{lt.is_carry_forward ? 'Yes' : 'No'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lt.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {lt.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Leave Type</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Leave Type Name (e.g. Sick Leave)"
                                className="w-full border p-2 rounded"
                                value={newType.leave_type_name}
                                onChange={e => setNewType({...newType, leave_type_name: e.target.value})}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Max Days Allowed"
                                className="w-full border p-2 rounded"
                                value={newType.max_days_allowed}
                                onChange={e => setNewType({...newType, max_days_allowed: parseInt(e.target.value)})}
                                required
                            />
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={newType.is_carry_forward}
                                    onChange={e => setNewType({...newType, is_carry_forward: e.target.checked})}
                                    className="form-checkbox"
                                />
                                <span>Is Carry Forward</span>
                            </label>
                            
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

