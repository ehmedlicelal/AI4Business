import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    async function handleLogout() {
        try {
            await signOut();
        } catch (err) {
            console.error('Logout error:', err);
        }
        navigate('/login', { replace: true });
    }

    return (
        <aside className="w-64 min-h-screen bg-[#1A2238] border-r border-white/10 flex flex-col">
            {/* Logo */}
            <Link to="/dashboard" className="block p-6 border-b border-white/10 hover:bg-white/5 transition-colors">
                <h1 className="text-xl font-bold text-white tracking-tight">
                    AI4<span className="text-[#85BB65]">Business</span>
                </h1>
            </Link>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
                <Link
                    to="/dashboard"
                    replace
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${location.pathname === '/dashboard' || location.pathname === '/dashboard/'
                        ? 'bg-[#85BB65]/10 text-[#85BB65]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Overview
                </Link>

                <Link
                    to="/dashboard/finances"
                    replace
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${location.pathname.includes('/finances')
                        ? 'bg-[#85BB65]/10 text-[#85BB65]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Finances
                </Link>

                <Link
                    to="/dashboard/inventory"
                    replace
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${location.pathname.includes('/inventory')
                        ? 'bg-[#85BB65]/10 text-[#85BB65]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Inventory
                </Link>

                <Link
                    to="/dashboard/tasks"
                    replace
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${location.pathname.includes('/tasks')
                        ? 'bg-[#85BB65]/10 text-[#85BB65]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Tasks
                </Link>

                {profile?.role === 'Admin' && (
                    <Link
                        to="/dashboard/tech-park"
                        replace
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${location.pathname.includes('/tech-park')
                            ? 'bg-[#85BB65]/10 text-[#85BB65]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Tech Park
                    </Link>
                )}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#85BB65]/20 flex items-center justify-center">
                        <span className="text-[#85BB65] text-sm font-bold">
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{user?.email}</p>
                        <p className="text-xs text-gray-400">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${profile?.role === 'Admin'
                                ? 'bg-purple-500/10 text-purple-400'
                                : 'bg-[#85BB65]/10 text-[#85BB65]'
                                }`}>
                                {profile?.role || 'Loading...'}
                            </span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
