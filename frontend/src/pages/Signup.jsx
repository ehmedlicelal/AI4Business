import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BackButton from '../components/BackButton';

export default function Signup() {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('Investor');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    function validateUsername(u) {
        if (u.length < 3 || u.length > 20) return 'Username must be 3-20 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Username can only contain letters, numbers, and underscores';
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        const usernameError = validateUsername(username);
        if (usernameError) {
            setError(usernameError);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Check if username is already taken
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .ilike('username', username)
                .maybeSingle();

            if (existing) {
                setError('Username is already taken');
                setLoading(false);
                return;
            }

            const data = await signUp(email, password, {
                data: {
                    full_name: fullName,
                    username: username,
                    role: role
                }
            });

            // Update profile with username after signup
            if (data?.user?.id) {
                await supabase
                    .from('profiles')
                    .update({ username: username, full_name: fullName })
                    .eq('id', data.user.id);
            }

            setSuccess('Account created! Check your email for verification, or sign in if email confirmation is disabled.');
            setTimeout(() => navigate('/login', { state: { from: location.state?.from } }), 2000);
        } catch (err) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f1729] px-4 relative">
            <div className="absolute top-4 left-4 z-20">
                <BackButton />
            </div>

            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#85BB65]/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#1A2238]/50 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Ace<span className="text-[#85BB65]">Up</span>
                    </h1>
                    <p className="text-gray-400 mt-2">Create your account</p>
                </div>

                {/* Card */}
                <div className="bg-[#1A2238]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-[#85BB65]/10 border border-[#85BB65]/30 rounded-lg text-[#85BB65] text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50 focus:border-[#85BB65]/50 transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    required
                                    minLength={3}
                                    maxLength={20}
                                    className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50 focus:border-[#85BB65]/50 transition-all"
                                    placeholder="johndoe"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Letters, numbers, underscores. 3-20 characters.</p>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50 focus:border-[#85BB65]/50 transition-all"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50 focus:border-[#85BB65]/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50 focus:border-[#85BB65]/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Select Role
                            </label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50 focus:border-[#85BB65]/50 transition-all appearance-none"
                            >
                                <option value="Investor" className="bg-[#1A2238] text-white">Investor (Default)</option>
                                <option value="Startup_Manager" className="bg-[#1A2238] text-white">Startup Manager</option>
                                <option value="Business_Manager" className="bg-[#1A2238] text-white">Business Manager</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-[#85BB65] hover:bg-[#6fa050] text-[#0f1729] font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#85BB65]/20 cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-[#0f1729] border-t-transparent rounded-full"></span>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#85BB65] hover:text-[#a0d680] font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
