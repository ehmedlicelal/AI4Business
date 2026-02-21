import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function InventoryWidget({ workspaceId, workspaceType }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ sku: '', name: '', quantity: '', low_stock_threshold: '10' });
    const [submitting, setSubmitting] = useState(false);
    const { profile } = useAuth();

    const isAdmin = profile?.role === 'Admin';

    async function fetchInventory() {
        try {
            let url = '/api/inventory';
            if (workspaceId && workspaceType) {
                const param = workspaceType === 'startup' ? 'startup_id' : 'business_id';
                url += `?${param}=${workspaceId}`;
            }
            const data = await apiFetch(url);
            setItems(data);
        } catch (err) {
            console.error('Failed to fetch inventory:', err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchInventory(); }, [workspaceId, workspaceType]);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const body = { ...form };
            if (workspaceId && workspaceType) {
                if (workspaceType === 'startup') body.startup_id = workspaceId;
                else body.business_id = workspaceId;
            }

            await apiFetch('/api/inventory', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            setForm({ sku: '', name: '', quantity: '', low_stock_threshold: '10' });
            setShowForm(false);
            fetchInventory();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const lowStockItems = items.filter(i => i.quantity <= i.low_stock_threshold);

    return (
        <div className="bg-[#1A2238]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Inventory</h2>
                {isAdmin && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-3 py-1.5 bg-[#85BB65] hover:bg-[#6fa050] text-[#0f1729] text-sm font-medium rounded-lg transition-colors cursor-pointer"
                    >
                        {showForm ? 'Cancel' : '+ Add Item'}
                    </button>
                )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Total Items</p>
                    <p className="text-lg font-bold text-white">{totalItems}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Low Stock</p>
                    <p className={`text-lg font-bold ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-[#85BB65]'}`}>
                        {lowStockItems.length}
                    </p>
                </div>
            </div>

            {/* Add Form (Admin only) */}
            {showForm && isAdmin && (
                <form onSubmit={handleSubmit} className="mb-6 space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="SKU"
                            value={form.sku}
                            onChange={e => setForm({ ...form, sku: e.target.value })}
                            required
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#85BB65]/50"
                        />
                        <input
                            type="text"
                            placeholder="Product Name"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#85BB65]/50"
                        />
                        <input
                            type="number"
                            placeholder="Quantity"
                            value={form.quantity}
                            onChange={e => setForm({ ...form, quantity: e.target.value })}
                            required
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#85BB65]/50"
                        />
                        <input
                            type="number"
                            placeholder="Low Stock Threshold"
                            value={form.low_stock_threshold}
                            onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#85BB65]/50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2 bg-[#85BB65] hover:bg-[#6fa050] text-[#0f1729] text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {submitting ? 'Saving...' : 'Add Item'}
                    </button>
                </form>
            )}

            {/* Table */}
            {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : items.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No inventory items yet.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/10">
                                <th className="text-left py-2 font-medium">SKU</th>
                                <th className="text-left py-2 font-medium">Name</th>
                                <th className="text-right py-2 font-medium">Qty</th>
                                <th className="text-right py-2 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const isLow = item.quantity <= item.low_stock_threshold;
                                return (
                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-2.5 text-gray-400 font-mono text-xs">{item.sku}</td>
                                        <td className="py-2.5 text-gray-200">{item.name}</td>
                                        <td className={`py-2.5 text-right font-mono ${isLow ? 'text-amber-400' : 'text-gray-200'}`}>
                                            {item.quantity}
                                        </td>
                                        <td className="py-2.5 text-right">
                                            {isLow ? (
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    ⚠ Low Stock
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-[#85BB65]/10 text-[#85BB65]">
                                                    In Stock
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
