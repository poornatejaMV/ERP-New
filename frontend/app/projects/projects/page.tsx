'use client';

import { useState, useEffect } from 'react';
import { fetchProjects, createProject, Project } from '@/lib/api';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({
        project_name: '',
        status: 'Open',
        expected_start_date: '',
        expected_end_date: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchProjects();
            setProjects(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createProject(newProject);
            setShowModal(false);
            loadData();
            setNewProject({ project_name: '', status: 'Open', expected_start_date: '', expected_end_date: '' });
        } catch (e) {
            alert('Failed to create project');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    New Project
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projects.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No projects found.</td>
                            </tr>
                        ) : (
                            projects.map((proj) => (
                                <tr key={proj.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{proj.project_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${proj.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                              proj.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {proj.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{proj.expected_start_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{proj.expected_end_date}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Project</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Project Name"
                                className="w-full border p-2 rounded"
                                value={newProject.project_name}
                                onChange={e => setNewProject({...newProject, project_name: e.target.value})}
                                required
                            />
                            <select
                                className="w-full border p-2 rounded"
                                value={newProject.status}
                                onChange={e => setNewProject({...newProject, status: e.target.value})}
                            >
                                <option value="Open">Open</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            <div>
                                <label className="text-xs text-gray-500">Expected Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded"
                                    value={newProject.expected_start_date}
                                    onChange={e => setNewProject({...newProject, expected_start_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Expected End Date</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded"
                                    value={newProject.expected_end_date}
                                    onChange={e => setNewProject({...newProject, expected_end_date: e.target.value})}
                                />
                            </div>
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

