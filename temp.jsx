import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BackButton from '../components/BackButton';

export default function EnvironmentSelection() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [startups, setStartups] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalConfig, setModalConfig] = useState(null); // { type: 'startup' | 'business', isOpen: boolean }

    useEffect(() => {
        if (user?.id) {
            fetchUserOwnedEntities();
        }
    }, [user?.id]);

    async function fetchUserOwnedEntities() {
        setLoading(true);
        try {
            // Fetch startups created by user
            const { data: startupData, error: startupError } = await supabase
                .from('startups')
                .select('id, name')
                .eq('created_by', user.id);

            if (startupError) throw startupError;

            // Fetch businesses created by user
            const { data: businessData, error: businessError } = await supabase
                .from('businesses')
                .select('id, name')
                .eq('created_by', user.id);

            if (businessError) throw businessError;

            setStartups(startupData || []);
            setBusinesses(businessData || []);
        } catch (error) {
            console.error("Error fetching user entities:", error);
            // Even on error, set arrays to empty to unblock user if needed
            setStartups([]);
            setBusinesses([]);
        } finally {
            setLoading(false);
        }
    }

    const handleChoice = (type) => {
        if (type === 'startup') {
            if (startups.length === 0) {
                setModalConfig({ type: 'startup', isOpen: true, mode: 'create_prompt' });
            } else {
                navigate('/investor/dashboard');
            }
        } else if (type === 'business') {
            if (businesses.length === 0) {
                setModalConfig({ type: 'business', isOpen: true, mode: 'create_prompt' });
            } else {
                navigate('/dashboard');
            }
        } else if (type === 'workspace') {
            if (startups.length === 0 && businesses.length === 0) {
                // No entities at all
                setModalConfig({ type: 'workspace', isOpen: true, mode: 'no_entities' });
            } else {
                setModalConfig({ type: 'workspace', isOpen: true, mode: 'select_entity' });
            }
        }
    };

    const handleModalConfirm = () => {
        if (modalConfig?.type === 'startup' || modalConfig?.type === 'business') {
            if (modalConfig.type === 'startup') navigate('/investor/dashboard');
            else navigate('/dashboard');
        }
        setModalConfig(null);
    };

    const handleWorkspaceSelect = (entityType, entityId) => {
        // Both startups and businesses now use the main Dashboard for workspace view
        const path = '/dashboard';
        navigate(`${path}?workspace_id=${entityId}&workspace_type=${entityType}`);
        setModalConfig(null);
    };

    const handleModalClose = () => {
        setModalConfig(null);
    };

    return (
        <div className="min-h-screen bg-[#0f1729] text-white flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#85BB65]/10 rounded-full blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-10 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <div className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate('/')}>
                        AI4<span className="text-[#85BB65]">Business</span>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-12 w-full">

                    <div className="space-y-4 animate-fade-in-up">
                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                            Environment Panel
                        </h2>
                        <p className="text-gray-400 text-xl">
                            Which ecosystem are you managing today?
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
                        {/* Startups Option */}
                        <div className="animate-fade-in-up delay-200 w-full">
                            <button
                                onClick={() => handleChoice('startup')}
                                className="group relative w-full p-10 bg-[#1A2238]/60 hover:bg-[#1A2238] border border-white/10 hover:border-blue-500/50 rounded-3xl transition-all duration-300 hover:-translate-y-2 flex flex-col items-center justify-center gap-6 text-center h-[300px] overflow-hidden shadow-xl hover:shadow-blue-500/10"
                            >
                                <div className="relative z-10 w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                    <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold text-white mb-2">My Startups</h3>
                                    <p className="text-gray-400 text-sm">Manage your formed startups</p>
                                </div>
                                <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full">
                                    {startups.length}
                                </div>
                            </button>
                        </div>

                        {/* Businesses Option */}
                        <div className="animate-fade-in-up delay-300 w-full">
                            <button
                                onClick={() => handleChoice('business')}
                                className="group relative w-full p-10 bg-[#1A2238]/60 hover:bg-[#1A2238] border border-white/10 hover:border-[#85BB65]/50 rounded-3xl transition-all duration-300 hover:-translate-y-2 flex flex-col items-center justify-center gap-6 text-center h-[300px] overflow-hidden shadow-xl hover:shadow-[#85BB65]/10"
                            >
                                <div className="relative z-10 w-20 h-20 rounded-2xl bg-[#85BB65]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                    <svg className="w-10 h-10 text-[#85BB65]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold text-white mb-2">My Businesses</h3>
                                    <p className="text-gray-400 text-sm">Manage business pipelines</p>
                                </div>
                                <div className="absolute top-4 right-4 bg-[#85BB65]/20 text-[#85BB65] text-xs font-bold px-3 py-1 rounded-full">
                                    {businesses.length}
                                </div>
                            </button>
                        </div>

                        {/* Workspace Option */}
                        <div className="animate-fade-in-up delay-400 w-full md:col-span-2">
                            <button
                                onClick={() => handleChoice('workspace')}
                                className="group relative w-full p-10 bg-[#1A2238]/60 hover:bg-[#1A2238] border border-white/10 hover:border-purple-500/50 rounded-3xl transition-all duration-300 hover:-translate-y-2 flex flex-row items-center justify-center gap-8 text-center h-[180px] overflow-hidden shadow-xl hover:shadow-purple-500/10"
                            >
                                <div className="relative z-10 w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner shrink-0">
                                    <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div className="relative z-10 text-left">
                                    <h3 className="text-2xl font-bold text-white mb-2">My Workspaces</h3>
                                    <p className="text-gray-400 text-sm max-w-md">Access specific tools and data for each of your startups or businesses.</p>
                                </div>
                            </button>
                        </div>

                        {/* Workspace Option */}
                        <div className="animate-fade-in-up delay-400 w-full md:col-span-2">
                            <button
                                onClick={() => handleChoice('workspace')}
                                className="group relative w-full p-10 bg-[#1A2238]/60 hover:bg-[#1A2238] border border-white/10 hover:border-purple-500/50 rounded-3xl transition-all duration-300 hover:-translate-y-2 flex flex-row items-center justify-center gap-8 text-center h-[180px] overflow-hidden shadow-xl hover:shadow-purple-500/10"
                            >
                                <div className="relative z-10 w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner shrink-0">
                                    <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div className="relative z-10 text-left">
                                    <h3 className="text-2xl font-bold text-white mb-2">My Workspaces</h3>
                                    <p className="text-gray-400 text-sm max-w-md">Access specific tools and data for each of your startups or businesses.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Custom Modal for No Entities */}
            {modalConfig?.isOpen && modalConfig.mode === 'create_prompt' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative">

                        {/* Notification Icon */}
                        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-bold text-center text-white mb-3">
                            No {modalConfig.type === 'startup' ? 'Startups' : 'Businesses'} Found
                        </h3>
                        <p className="text-gray-400 text-center mb-8">
                            You don't have any {modalConfig.type === 'startup' ? 'startups' : 'businesses'} yet. Are we going to create one?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleModalClose}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-colors font-medium"
                            >
                                No
                            </button>
                            <button
                                onClick={handleModalConfirm}
                                className="flex-1 px-4 py-3 bg-[#85BB65] hover:bg-[#74a856] text-[#0f1729] rounded-xl transition-colors font-bold shadow-lg shadow-[#85BB65]/20"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Workspace Select Modal */}
            {modalConfig?.isOpen && modalConfig.mode === 'select_entity' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">Select Workspace</h3>
                            <button onClick={handleModalClose} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Startups List */}
                            {startups.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Startups</h4>
                                    <div className="space-y-2">
                                        {startups.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => handleWorkspaceSelect('startup', s.id)}
                                                className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/50 rounded-xl transition-all flex items-center gap-3 group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                                    S
                                                </div>
                                                <span className="font-medium text-white">{s.name || `Startup ${s.id.slice(0, 4)}`}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Businesses List */}
                            {businesses.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Businesses</h4>
                                    <div className="space-y-2">
                                        {businesses.map(b => (
                                            <button
                                                key={b.id}
                                                onClick={() => handleWorkspaceSelect('business', b.id)}
                                                className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#85BB65]/50 rounded-xl transition-all flex items-center gap-3 group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-[#85BB65]/10 flex items-center justify-center text-[#85BB65] group-hover:scale-110 transition-transform">
                                                    B
                                                </div>
                                                <span className="font-medium text-white">{b.name || `Business ${b.id.slice(0, 4)}`}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* No Entities Modal */}
            {modalConfig?.isOpen && modalConfig.mode === 'no_entities' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative text-center">
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-center text-white mb-2">No Workspaces Found</h3>
                        <p className="text-gray-400 mb-6">You need to create a startup or business first.</p>
                        <button onClick={handleModalClose} className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
