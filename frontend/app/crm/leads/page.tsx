'use client';

import { useState, useEffect } from 'react';
import { fetchLeads, createLead, Lead } from '@/lib/api';

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newLead, setNewLead] = useState({ lead_name: '', email: '', phone: '' });

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        const data = await fetchLeads();
        setLeads(data);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLead(newLead);
            setShowModal(false);
            setNewLead({ lead_name: '', email: '', phone: '' });
            loadLeads();
        } catch (e) {
            console.error(e);
            alert('Failed to create lead');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Leads</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                    New Lead
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {leads.map((l) => (
                            <tr key={l.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{l.lead_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        {l.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Lead</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                placeholder="Name"
                                className="w-full border p-2 rounded"
                                value={newLead.lead_name}
                                onChange={(e) => setNewLead({ ...newLead, lead_name: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Email"
                                className="w-full border p-2 rounded"
                                value={newLead.email}
                                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                            />
                            <input
                                placeholder="Phone"
                                className="w-full border p-2 rounded"
                                value={newLead.phone}
                                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
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
