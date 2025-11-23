'use client';

import { useState, useEffect } from 'react';
import { fetchLeaveApplications, createLeaveApplication, fetchEmployees, fetchLeaveTypes, LeaveApplication, Employee, LeaveType } from '@/lib/api';

export default function LeaveApplicationsPage() {
    const [applications, setApplications] = useState<LeaveApplication[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newApp, setNewApp] = useState({
        employee_id: 0,
        leave_type_id: 0,
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0],
        reason: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [appsData, empData, ltData] = await Promise.all([
                fetchLeaveApplications(), 
                fetchEmployees(),
                fetchLeaveTypes()
            ]);
            
            const mappedApps = appsData.map(app => ({
                ...app,
                employee_name: empData.find(e => e.id === app.employee_id)?.employee_name || 'Unknown',
                leave_type_name: ltData.find(lt => lt.id === app.leave_type_id)?.leave_type_name || 'Unknown'
            }));
            
            setApplications(mappedApps);
            setEmployees(empData);
            setLeaveTypes(ltData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newApp.employee_id || !newApp.leave_type_id) {
             alert("Please select employee and leave type");
             return;
        }
        try {
            await createLeaveApplication({
                ...newApp,
                employee_id: Number(newApp.employee_id),
                leave_type_id: Number(newApp.leave_type_id)
            });
            setShowModal(false);
            loadData();
            setNewApp({
                employee_id: 0,
                leave_type_id: 0,
                from_date: new Date().toISOString().split('T')[0],
                to_date: new Date().toISOString().split('T')[0],
                reason: ''
            });
        } catch (e) {
            alert('Failed to create leave application');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Leave Applications</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Apply Leave
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Days</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {applications.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No leave applications found.</td>
                            </tr>
                        ) : (
                            applications.map((app) => (
                                <tr key={app.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{app.employee_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{app.leave_type_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{app.from_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{app.to_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{app.total_leave_days}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${app.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                                              app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {app.status}
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
                        <h2 className="text-xl font-bold mb-4">Apply Leave</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <select
                                className="w-full border p-2 rounded"
                                value={newApp.employee_id}
                                onChange={e => setNewApp({...newApp, employee_id: Number(e.target.value)})}
                                required
                            >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.employee_name}</option>
                                ))}
                            </select>
                            
                            <select
                                className="w-full border p-2 rounded"
                                value={newApp.leave_type_id}
                                onChange={e => setNewApp({...newApp, leave_type_id: Number(e.target.value)})}
                                required
                            >
                                <option value="">Select Leave Type</option>
                                {leaveTypes.map(lt => (
                                    <option key={lt.id} value={lt.id}>{lt.leave_type_name}</option>
                                ))}
                            </select>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">From Date</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded"
                                        value={newApp.from_date}
                                        onChange={e => setNewApp({...newApp, from_date: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">To Date</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded"
                                        value={newApp.to_date}
                                        onChange={e => setNewApp({...newApp, to_date: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <textarea
                                placeholder="Reason"
                                className="w-full border p-2 rounded"
                                value={newApp.reason}
                                onChange={e => setNewApp({...newApp, reason: e.target.value})}
                                rows={2}
                            />
                            
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Apply</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

