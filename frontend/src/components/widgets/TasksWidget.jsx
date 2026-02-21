import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export default function TasksWidget({ workspaceId, workspaceType }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', priority: 'Medium' });
    const [submitting, setSubmitting] = useState(false);

    async function fetchTasks() {
        try {
            let url = '/api/tasks';
            if (workspaceId && workspaceType) {
                const param = workspaceType === 'startup' ? 'startup_id' : 'business_id';
                url += `?${param}=${workspaceId}`;
            }
            const data = await apiFetch(url);
            setTasks(data);
        } catch (err) {
            console.error('Failed to fetch tasks:', err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchTasks(); }, [workspaceId, workspaceType]);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const body = { ...form };
            if (workspaceId && workspaceType) {
                if (workspaceType === 'startup') body.startup_id = workspaceId;
                else body.business_id = workspaceId;
            }

            await apiFetch('/api/tasks', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            setForm({ title: '', priority: 'Medium' });
            setShowForm(false);
            fetchTasks();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function updateStatus(id, newStatus) {
        try {
            await apiFetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            fetchTasks();
        } catch (err) {
            alert(err.message);
        }
    }

    const priorityColors = {
        High: 'bg-red-500/10 text-red-400 border-red-500/20',
        Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };

    const statusColors = {
        'Todo': 'text-gray-400',
        'In Progress': 'text-yellow-400',
        'Completed': 'text-[#85BB65]',
    };

    const todoCount = tasks.filter(t => t.status === 'Todo').length;
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    return (
        <div className="bg-[#1A2238]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Tasks</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-3 py-1.5 bg-[#85BB65] hover:bg-[#6fa050] text-[#0f1729] text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                    {showForm ? 'Cancel' : '+ Add Task'}
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Todo</p>
                    <p className="text-lg font-bold text-gray-300">{todoCount}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">In Progress</p>
                    <p className="text-lg font-bold text-yellow-400">{inProgressCount}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Completed</p>
                    <p className="text-lg font-bold text-[#85BB65]">{completedCount}</p>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Task title"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            required
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#85BB65]/50"
                        />
                        <select
                            value={form.priority}
                            onChange={e => setForm({ ...form, priority: e.target.value })}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#85BB65]/50"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2 bg-[#85BB65] hover:bg-[#6fa050] text-[#0f1729] text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {submitting ? 'Saving...' : 'Create Task'}
                    </button>
                </form>
            )}

            {/* Task List */}
            {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : tasks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No tasks yet.</div>
            ) : (
                <div className="space-y-2">
                    {tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                    {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-xs border ${priorityColors[task.priority]}`}>
                                        {task.priority}
                                    </span>
                                    <span className={`text-xs ${statusColors[task.status]}`}>{task.status}</span>
                                </div>
                            </div>
                            <select
                                value={task.status}
                                onChange={e => updateStatus(task.id, e.target.value)}
                                className="ml-3 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none cursor-pointer"
                            >
                                <option value="Todo">Todo</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
