'use client';

import { useState, useEffect } from 'react';
import { fetchTasks, createTask, fetchProjects, Task, Project } from '@/lib/api';

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({
        subject: '',
        project_id: 0,
        status: 'Open',
        priority: 'Medium',
        exp_start_date: '',
        exp_end_date: '',
        description: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [tasksData, projectsData] = await Promise.all([fetchTasks(), fetchProjects()]);
            
            // Map project names
            const mappedTasks = tasksData.map(t => ({
                ...t,
                project_name: projectsData.find(p => p.id === t.project_id)?.project_name
            }));
            
            setTasks(mappedTasks);
            setProjects(projectsData);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTask({
                ...newTask,
                project_id: newTask.project_id || undefined
            });
            setShowModal(false);
            loadData();
            setNewTask({ subject: '', project_id: 0, status: 'Open', priority: 'Medium', exp_start_date: '', exp_end_date: '', description: '' });
        } catch (e) {
            alert('Failed to create task');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Tasks</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    New Task
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tasks.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No tasks found.</td>
                            </tr>
                        ) : (
                            tasks.map((task: any) => (
                                <tr key={task.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{task.subject}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{task.project_name || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${task.priority === 'High' ? 'bg-red-100 text-red-800' : 
                                              task.priority === 'Low' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{task.exp_end_date}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Task</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Subject"
                                className="w-full border p-2 rounded"
                                value={newTask.subject}
                                onChange={e => setNewTask({...newTask, subject: e.target.value})}
                                required
                            />
                            <select
                                className="w-full border p-2 rounded"
                                value={newTask.project_id}
                                onChange={e => setNewTask({...newTask, project_id: Number(e.target.value)})}
                            >
                                <option value="0">Select Project (Optional)</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="w-full border p-2 rounded"
                                    value={newTask.status}
                                    onChange={e => setNewTask({...newTask, status: e.target.value})}
                                >
                                    <option value="Open">Open</option>
                                    <option value="Working">Working</option>
                                    <option value="Pending Review">Pending Review</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={newTask.priority}
                                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Expected End Date</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded"
                                    value={newTask.exp_end_date}
                                    onChange={e => setNewTask({...newTask, exp_end_date: e.target.value})}
                                />
                            </div>
                            <textarea
                                placeholder="Description"
                                className="w-full border p-2 rounded"
                                value={newTask.description}
                                onChange={e => setNewTask({...newTask, description: e.target.value})}
                                rows={3}
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

