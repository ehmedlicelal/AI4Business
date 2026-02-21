import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="64" fill="#1A2238"/>
  <circle cx="64" cy="48" r="22" fill="#85BB65" opacity="0.3"/>
  <path d="M64 78c-22 0-40 12-40 27v23h80v-23c0-15-18-27-40-27z" fill="#85BB65" opacity="0.3"/>
</svg>`);

export default function ProfileDropdown({ dashboardPath = '/investor/dashboard' }) {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setOpen(false);
        try {
            await signOut();
            navigate('/login', { replace: true });
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    if (!user) {
        return (
            <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 bg-[#85BB65] hover:bg-[#74a856] text-[#0f1729] font-bold rounded-lg transition-colors"
            >
                Sign In
            </button>
        );
    }

    const avatarUrl = profile?.avatar_url || DEFAULT_AVATAR;
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

    return (
        <>
            <div className="relative z-[60]" ref={dropdownRef}>
                {/* Avatar Button */}
                <button
                    onClick={() => setOpen(!open)}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                    <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-9 h-9 rounded-full object-cover border-2 border-[#85BB65]/40 shadow-lg shadow-[#85BB65]/10"
                        onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    />
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {open && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#1A2238] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                        {/* User Info Header */}
                        <div className="p-4 border-b border-white/10 flex items-center gap-3">
                            <img
                                src={avatarUrl}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover border-2 border-[#85BB65]/30"
                                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                            <button
                                onClick={() => { setOpen(false); navigate(dashboardPath); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
                            >
                                <svg className="w-4 h-4 text-[#85BB65]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Go to Dashboard
                            </button>

                            <button
                                onClick={() => { setOpen(false); setEditOpen(true); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
                            >
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Profile
                            </button>

                            <div className="mx-3 my-1 border-t border-white/5" />

                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Log Out
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Edit Modal */}
            {editOpen && <ProfileEditModal onClose={() => setEditOpen(false)} />}
        </>
    );
}

// ─── Profile Edit Modal ───────────────────────────────
import { supabase } from '../lib/supabase';

function ProfileEditModal({ onClose }) {
    const { user, profile, refreshProfile } = useAuth();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(profile?.avatar_url || null);
    const fileInputRef = useRef(null);

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be smaller than 2MB.');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/avatar.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Add cache-busting query param
            const freshUrl = `${publicUrl}?t=${Date.now()}`;
            setPreviewUrl(freshUrl);

            // Update profile with avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: freshUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await refreshProfile();
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id);

            if (error) throw error;
            await refreshProfile();
            onClose();
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const avatarDisplay = previewUrl || DEFAULT_AVATAR;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
                <h3 className="text-2xl font-bold text-white mb-6">Edit Profile</h3>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <img
                                src={avatarDisplay}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full object-cover border-3 border-[#85BB65]/40 shadow-xl"
                                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                {uploading ? (
                                    <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                        <p className="text-xs text-gray-500">Click the photo to change. Max 2MB.</p>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50"
                            placeholder="Your full name"
                        />
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-[#85BB65] text-[#0f1729] rounded-xl hover:bg-[#74a856] transition-colors font-bold disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
