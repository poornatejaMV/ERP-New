'use client';

import { useState, useEffect } from 'react';
import { fetchEmployees, createEmployee, Employee } from '@/lib/api';
import Link from 'next/link';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        employee_name: '',
        employee_number: '',
        department: '',
        designation: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchEmployees();
            setEmployees(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createEmployee(newEmployee);
            setShowModal(false);
            loadData();
            setNewEmployee({ employee_name: '', employee_number: '', department: '', designation: '' });
        } catch (e) {
            alert('Failed to create employee');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    New Employee
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No employees found.</td>
                            </tr>
                        ) : (
                            employees.map((emp) => (
                                <tr key={emp.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{emp.employee_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{emp.employee_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{emp.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{emp.designation}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {emp.is_active ? 'Active' : 'Inactive'}
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
                        <h2 className="text-xl font-bold mb-4">New Employee</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Employee Name"
                                className="w-full border p-2 rounded"
                                value={newEmployee.employee_name}
                                onChange={e => setNewEmployee({...newEmployee, employee_name: e.target.value})}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Employee Number"
                                className="w-full border p-2 rounded"
                                value={newEmployee.employee_number}
                                onChange={e => setNewEmployee({...newEmployee, employee_number: e.target.value})}
                            />
                            <input
                                type="text"
                                placeholder="Department"
                                className="w-full border p-2 rounded"
                                value={newEmployee.department}
                                onChange={e => setNewEmployee({...newEmployee, department: e.target.value})}
                            />
                            <input
                                type="text"
                                placeholder="Designation"
                                className="w-full border p-2 rounded"
                                value={newEmployee.designation}
                                onChange={e => setNewEmployee({...newEmployee, designation: e.target.value})}
                            />
                            <div className="flex justify-end space-x-2">
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

