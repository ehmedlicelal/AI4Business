import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import BackButton from '../../components/BackButton';

export default function AdminPanel() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (profile?.role !== 'Admin') {
            navigate('/dashboard');
            return;
        }
        fetchProfiles();
    }, [profile]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/api/profiles/all');
            setProfiles(data);
        } catch (err) {
            console.error('Failed to load profiles:', err);
            showToast('Failed to load profiles', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        setDeleting(true);
        try {
            await apiFetch(`/api/profiles/${id}`, { method: 'DELETE' });
            setProfiles(prev => prev.filter(p => p.id !== id));
            showToast(`${name} has been removed`, 'success');
        } catch (err) {
            console.error('Delete failed:', err);
            showToast('Failed to delete profile', 'error');
        } finally {
            setDeleting(false);
            setDeleteConfirm(null);
        }
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filteredProfiles = profiles.filter(p =>
        (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.role || '').toLowerCase().includes(search.toLowerCase())
    );

    const getRoleBadge = (role) => {
        const styles = {
            Admin: 'bg-red-500/10 text-red-400 border-red-500/20',
            Manager: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            Investor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
        return styles[role] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    return (
        <div className="min-h-screen bg-[#0f1729] text-white">
            {/* Header */}
            <nav className="px-8 py-6 border-b border-white/10 bg-[#1A2238]/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <BackButton />
                        <div>
                            <h1 className="text-2xl font-bold">Admin Panel</h1>
                            <p className="text-sm text-gray-400">Manage user profiles</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                            ADMIN
                        </div>
                        <span className="text-sm text-gray-400">{profiles.length} users</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-8 py-8">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, username, email, or role..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#85BB65]/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[#85BB65]/30 border-t-[#85BB65] rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">User</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Username</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Email</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Role</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Joined</th>
                                        <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredProfiles.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                                                        style={{ background: `linear-gradient(135deg, hsl(${((p.full_name || 'U').charCodeAt(0) * 37) % 360}, 60%, 40%), hsl(${((p.full_name || 'U').charCodeAt(0) * 37 + 60) % 360}, 70%, 30%))` }}
                                                    >
                                                        {(p.full_name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-white">{p.full_name || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">@{p.username || '—'}</td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">{p.email || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getRoleBadge(p.role)}`}>
                                                    {p.role || 'User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {p.id === profile?.id ? (
                                                    <span className="text-xs text-gray-600 italic">You</span>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(p)}
                                                        className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProfiles.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                No profiles found matching "{search}"
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
                        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-bold text-white text-center mb-2">Delete Profile?</h3>
                        <p className="text-gray-400 text-center text-sm mb-6">
                            Are you sure you want to permanently remove <span className="text-white font-semibold">{deleteConfirm.full_name || deleteConfirm.username}</span>?
                            This will delete their account and all associated data. This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                                className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.full_name || deleteConfirm.username)}
                                disabled={deleting}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Permanently'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-xl shadow-2xl border animate-fade-in-up flex items-center gap-3 ${toast.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {toast.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}
        </div>
    );
}
