import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export default function FinanceWidget({ workspaceId, workspaceType }) {
    const [finances, setFinances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ amount: '', type: 'Revenue', category: '' });
    const [submitting, setSubmitting] = useState(false);

    async function fetchFinances() {
        try {
            let url = '/api/finances';
            if (workspaceId && workspaceType) {
                const param = workspaceType === 'startup' ? 'startup_id' : 'business_id';
                url += `?${param}=${workspaceId}`;
            }
            const data = await apiFetch(url);
            setFinances(data);
        } catch (err) {
            console.error('Failed to fetch finances:', err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchFinances(); }, [workspaceId, workspaceType]);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const body = { ...form, status: 'Success' };
            if (workspaceId && workspaceType) {
                if (workspaceType === 'startup') body.startup_id = workspaceId;
                else body.business_id = workspaceId;
            }

            await apiFetch('/api/finances', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            setForm({ amount: '', type: 'Revenue', category: '' });
            setShowForm(false);
            fetchFinances();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    const totalRevenue = finances.filter(f => f.type === 'Revenue').reduce((s, f) => s + Number(f.amount), 0);
    const totalExpense = finances.filter(f => f.type === 'Expense').reduce((s, f) => s + Number(f.amount), 0);
    const netProfit = totalRevenue - totalExpense;

    const typeColors = {
        Revenue: 'text-blue-400',
        Expense: 'text-red-400',
        Profit: 'text-[#85BB65]',
    };

    const statusBadge = {
        Success: 'bg-[#85BB65]/10 text-[#85BB65]',
        Pending: 'bg-yellow-500/10 text-yellow-400',
        Failed: 'bg-red-500/10 text-red-400',
    };

    return (
        <div className="bg-[#1A2238]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Finances</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-3 py-1.5 bg-[#85BB65] hover:bg-[#6fa050] text-[#0f1729] text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                    {showForm ? 'Cancel' : '+ Add'}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Revenue</p>
                    <p className="text-lg font-bold text-blue-400">${totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Expenses</p>
                    <p className="text-lg font-bold text-red-400">${totalExpense.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Net Profit</p>
                    <p className="text-lg font-bold text-[#85BB65]">${netProfit.toLocaleString()}</p>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={form.amount}
                            onChange={e => setForm({ ...form, amount: e.target.value })}
                            required
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#85BB65]/50"
                        />
                        <select
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value })}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#85BB65]/50"
                        >
                            <option value="Revenue">Revenue</option>
                            <option value="Expense">Expense</option>
                            <option value="Profit">Profit</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Category"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#85BB65]/50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2 bg-[#85BB65] hover:bg-[#6fa050] text-[#0f1729] text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {submitting ? 'Saving...' : 'Save Record'}
                    </button>
                </form>
            )}

            {/* Table */}
            {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : finances.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No finance records yet.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/10">
                                <th className="text-left py-2 font-medium">Type</th>
                                <th className="text-left py-2 font-medium">Category</th>
                                <th className="text-right py-2 font-medium">Amount</th>
                                <th className="text-right py-2 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {finances.slice(0, 10).map(f => (
                                <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className={`py-2.5 font-medium ${typeColors[f.type]}`}>{f.type}</td>
                                    <td className="py-2.5 text-gray-300">{f.category || '—'}</td>
                                    <td className={`py-2.5 text-right font-mono ${f.type === 'Profit' ? 'text-[#85BB65]' : 'text-gray-200'}`}>
                                        ${Number(f.amount).toLocaleString()}
                                    </td>
                                    <td className="py-2.5 text-right">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[f.status]}`}>
                                            {f.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
