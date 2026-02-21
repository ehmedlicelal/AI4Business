import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BackButton from '../components/BackButton';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let emailToUse = identifier;

            // If identifier doesn't contain @, treat it as a username
            if (!identifier.includes('@')) {
                const { data: profile, error: lookupError } = await supabase
                    .from('profiles')
                    .select('id')
                    .ilike('username', identifier)
                    .maybeSingle();

                if (lookupError || !profile) {
                    setError('No account found with that username');
                    setLoading(false);
                    return;
                }

                // Look up the email from auth.users via the profile id
                // Since we can't query auth.users directly from client, we'll use a workaround:
                // Try to get email from user_metadata or use the profile to find email
                const { data: userData } = await supabase.auth.admin?.getUserById?.(profile.id) || {};

                // Fallback: look up email stored in user_metadata via profiles
                // We need to store email in profiles or use a different approach
                // Simplest approach: try signing in with email from Supabase auth
                // Since Supabase doesn't expose user emails from client side,
                // we can use an RPC function or store email in profiles

                // For now, let's check if the user stores their email in a way we can access:
                const { data: authUsers } = await supabase.rpc('get_email_by_username', { username_input: identifier });

                if (authUsers) {
                    emailToUse = authUsers;
                } else {
                    setError('No account found with that username');
                    setLoading(false);
                    return;
                }
            }

            const data = await signIn(emailToUse, password);
            const userRole = data.user?.user_metadata?.role || 'Investor';

            let defaultPath = '/dashboard';
            if (userRole === 'Investor') defaultPath = '/investor';
            else if (userRole === 'Admin') defaultPath = '/dashboard/admin';
            else if (userRole === 'Startup_Manager') defaultPath = '/dashboard/manager';
            else if (userRole === 'Business_Manager') defaultPath = '/dashboard/business';

            const from = location.state?.from?.pathname || defaultPath;
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Failed to sign in');
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
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#85BB65]/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#1A2238]/50 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        AI4<span className="text-[#85BB65]">Business</span>
                    </h1>
                    <p className="text-gray-400 mt-2">Sign in to your account</p>
                </div>

                {/* Card */}
                <div className="bg-[#1A2238]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Email or Username
                            </label>
                            <input
                                id="identifier"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50 focus:border-[#85BB65]/50 transition-all"
                                placeholder="you@company.com or username"
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-[#85BB65] hover:bg-[#6fa050] text-[#0f1729] font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#85BB65]/20 cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-[#0f1729] border-t-transparent rounded-full"></span>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/signup" state={{ from: location.state?.from }} className="text-[#85BB65] hover:text-[#a0d680] font-medium transition-colors">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
