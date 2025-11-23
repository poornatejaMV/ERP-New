'use client';

import { useState, useEffect } from 'react';
import { fetchAttendance, createAttendance, fetchEmployees, Attendance, Employee } from '@/lib/api';

export default function AttendancePage() {
    const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newAttendance, setNewAttendance] = useState({
        employee_id: 0,
        attendance_date: new Date().toISOString().split('T')[0],
        status: 'Present',
        remark: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [attData, empData] = await Promise.all([fetchAttendance(), fetchEmployees()]);
            
            const mappedAtt = attData.map(att => ({
                ...att,
                employee_name: empData.find(e => e.id === att.employee_id)?.employee_name || 'Unknown'
            }));
            
            setAttendanceList(mappedAtt);
            setEmployees(empData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAttendance.employee_id) {
            alert("Please select an employee");
            return;
        }
        try {
            await createAttendance({
                ...newAttendance,
                employee_id: Number(newAttendance.employee_id)
            });
            setShowModal(false);
            loadData();
            setNewAttendance({
                employee_id: 0,
                attendance_date: new Date().toISOString().split('T')[0],
                status: 'Present',
                remark: ''
            });
        } catch (e) {
            alert('Failed to mark attendance. Maybe already marked?');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Attendance</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Mark Attendance
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceList.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No attendance records found.</td>
                            </tr>
                        ) : (
                            attendanceList.map((att) => (
                                <tr key={att.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{att.attendance_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{att.employee_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${att.status === 'Present' ? 'bg-green-100 text-green-800' : 
                                              att.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {att.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{att.remark}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <select
                                className="w-full border p-2 rounded"
                                value={newAttendance.employee_id}
                                onChange={e => setNewAttendance({...newAttendance, employee_id: Number(e.target.value)})}
                                required
                            >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.employee_name}</option>
                                ))}
                            </select>
                            
                            <input
                                type="date"
                                className="w-full border p-2 rounded"
                                value={newAttendance.attendance_date}
                                onChange={e => setNewAttendance({...newAttendance, attendance_date: e.target.value})}
                                required
                            />
                            
                            <select
                                className="w-full border p-2 rounded"
                                value={newAttendance.status}
                                onChange={e => setNewAttendance({...newAttendance, status: e.target.value})}
                                required
                            >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Half Day">Half Day</option>
                            </select>
                            
                            <input
                                type="text"
                                placeholder="Remark"
                                className="w-full border p-2 rounded"
                                value={newAttendance.remark}
                                onChange={e => setNewAttendance({...newAttendance, remark: e.target.value})}
                            />
                            
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

