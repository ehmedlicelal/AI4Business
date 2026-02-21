import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileDropdown from '../components/ProfileDropdown';
import ChatPanel from '../components/ChatPanel';

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="64" fill="#1A2238"/>
  <circle cx="64" cy="48" r="22" fill="#85BB65" opacity="0.3"/>
  <path d="M64 78c-22 0-40 12-40 27v23h80v-23c0-15-18-27-40-27z" fill="#85BB65" opacity="0.3"/>
</svg>`);

export default function InvestorLayout() {
    const { signOut, user, profile } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const avatarUrl = profile?.avatar_url || DEFAULT_AVATAR;
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

    const navItems = [
        {
            path: '/investor/dashboard', label: 'Dashboard', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            path: '/investor/portfolio', label: 'Portfolio', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            path: '/investor/reports', label: 'Reports', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
    ];

    const chatNavItem = {
        label: 'Chat',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        )
    };

    return (
        <div className="flex h-screen bg-[#0f1729] text-gray-100 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#1A2238] border-r border-[#85BB65]/20 flex flex-col transition-all duration-300 relative z-20`}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-center border-b border-[#85BB65]/10">
                    <span className={`text-xl font-bold tracking-tight ${!isSidebarOpen && 'hidden'}`}>
                        Ace<span className="text-[#85BB65]">Up</span>
                    </span>
                    {!isSidebarOpen && <span className="text-[#85BB65] font-bold text-xl">AU</span>}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-[#85BB65]/10 text-[#85BB65]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }
                            `}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-200 ${!isSidebarOpen && 'opacity-0 w-0 overflow-hidden ml-0'}`}>
                                {item.label}
                            </span>
                            {isSidebarOpen && <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-4 h-4 text-[#85BB65]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>}
                        </NavLink>
                    ))}

                    {/* Chat Button */}
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className={`
                            w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
                            ${isChatOpen
                                ? 'bg-[#85BB65]/10 text-[#85BB65]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }
                        `}
                    >
                        <span className="flex-shrink-0">{chatNavItem.icon}</span>
                        <span className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-200 ${!isSidebarOpen && 'opacity-0 w-0 overflow-hidden ml-0'}`}>
                            {chatNavItem.label}
                        </span>
                        {isSidebarOpen && <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4 text-[#85BB65]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>}
                    </button>
                </nav>

                {/* User / Logout */}
                <div className="p-4 border-t border-[#85BB65]/10">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
                        <img
                            src={avatarUrl}
                            alt="Profile"
                            className="w-9 h-9 rounded-full object-cover border-2 border-[#85BB65]/30 flex-shrink-0"
                            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                        />
                        <div className={`flex-1 overflow-hidden ${!isSidebarOpen && 'hidden'}`}>
                            <p className="text-sm font-medium text-white truncate">{displayName}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`text-gray-400 hover:text-red-400 transition-colors ${!isSidebarOpen && 'hidden'}`}
                            title="Sign Out"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-9 bg-[#85BB65] text-white p-1 rounded-full shadow-lg hover:bg-[#74a856] transition-colors z-50"
                >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-[#0f1729] relative p-8">
                <Outlet />
            </main>

            {/* Chat Panel */}
            <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
}
