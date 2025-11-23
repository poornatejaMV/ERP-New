'use client';

import { useState, useEffect } from 'react';
import { fetchTimesheets, createTimesheet, fetchEmployees, Timesheet, Employee, TimesheetDetail } from '@/lib/api';

export default function TimesheetsPage() {
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newSheet, setNewSheet] = useState({
        employee_id: 0,
        start_date: '',
        end_date: '',
        details: [] as TimesheetDetail[]
    });
    
    // Temporary state for adding detail line
    const [newDetail, setNewDetail] = useState<TimesheetDetail>({
        activity_type: '',
        hours: 0,
        from_time: '',
        to_time: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [tsData, empData] = await Promise.all([fetchTimesheets(), fetchEmployees()]);
            
            const mappedTs = tsData.map(ts => ({
                ...ts,
                employee_name: empData.find(e => e.id === ts.employee_id)?.employee_name
            }));
            
            setTimesheets(mappedTs);
            setEmployees(empData);
        } catch (e) {
            console.error(e);
        }
    };

    const addDetail = () => {
        if (newDetail.hours <= 0) {
            alert("Hours must be greater than 0");
            return;
        }
        setNewSheet({
            ...newSheet,
            details: [...newSheet.details, newDetail]
        });
        setNewDetail({ activity_type: '', hours: 0, from_time: '', to_time: '' });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSheet.employee_id) {
            alert("Select Employee");
            return;
        }
        try {
            await createTimesheet({
                ...newSheet,
                employee_id: Number(newSheet.employee_id)
            });
            setShowModal(false);
            loadData();
            setNewSheet({ employee_id: 0, start_date: '', end_date: '', details: [] });
        } catch (e) {
            alert('Failed to create timesheet');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Timesheets</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    New Timesheet
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {timesheets.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No timesheets found.</td>
                            </tr>
                        ) : (
                            timesheets.map((ts: any) => (
                                <tr key={ts.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{ts.employee_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{ts.start_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{ts.end_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{ts.total_hours}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${ts.status === 'Submitted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {ts.status}
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
                    <div className="bg-white p-8 rounded-lg w-full max-w-2xl">
                        <h2 className="text-xl font-bold mb-4">New Timesheet</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <select
                                    className="border p-2 rounded"
                                    value={newSheet.employee_id}
                                    onChange={e => setNewSheet({...newSheet, employee_id: Number(e.target.value)})}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.employee_name}</option>
                                    ))}
                                </select>
                                <input
                                    type="date"
                                    className="border p-2 rounded"
                                    value={newSheet.start_date}
                                    onChange={e => setNewSheet({...newSheet, start_date: e.target.value})}
                                    required
                                />
                                <input
                                    type="date"
                                    className="border p-2 rounded"
                                    value={newSheet.end_date}
                                    onChange={e => setNewSheet({...newSheet, end_date: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Time Entries</h3>
                                <div className="grid grid-cols-4 gap-2 mb-2">
                                    <input 
                                        placeholder="Activity Type" 
                                        className="border p-2 rounded"
                                        value={newDetail.activity_type}
                                        onChange={e => setNewDetail({...newDetail, activity_type: e.target.value})}
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Hours" 
                                        className="border p-2 rounded"
                                        value={newDetail.hours || ''}
                                        onChange={e => setNewDetail({...newDetail, hours: Number(e.target.value)})}
                                    />
                                    <button type="button" onClick={addDetail} className="bg-green-600 text-white px-4 rounded">Add</button>
                                </div>
                                
                                <table className="min-w-full border">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 text-left">Activity</th>
                                            <th className="p-2 text-right">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newSheet.details.map((d, i) => (
                                            <tr key={i}>
                                                <td className="p-2">{d.activity_type}</td>
                                                <td className="p-2 text-right">{d.hours}</td>
                                            </tr>
                                        ))}
                                        {newSheet.details.length === 0 && <tr><td colSpan={2} className="p-2 text-center text-gray-500">No entries</td></tr>}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Timesheet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

