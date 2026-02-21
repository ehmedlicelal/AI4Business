import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { apiFetch } from '../../lib/api';
import BackButton from '../../components/BackButton';
import ProfileDropdown from '../../components/ProfileDropdown';

export default function DiscoverStartups() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [startups, setStartups] = useState([]);
    const [loadingStartups, setLoadingStartups] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [investModalOpen, setInvestModalOpen] = useState(false);
    const [selectedStartup, setSelectedStartup] = useState(null);
    const [investAmount, setInvestAmount] = useState('');
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [savedSet, setSavedSet] = useState(new Set());
    const [savingId, setSavingId] = useState(null);
    const [swipeStats, setSwipeStats] = useState({});
    const [isMemberOf, setIsMemberOf] = useState(false);
    const ITEMS_PER_PAGE = 12;

    const CATEGORIES = ['All', 'Advertising', 'Agriculture', 'Blockchain', 'Consumer Goods', 'Education', 'Energy & Greentech', 'Fashion & Living', 'Fintech', 'Food & Beverage', 'Gaming', 'Healthcare & Life Science'];

    useEffect(() => {
        fetchStartups();
    }, [page, categoryFilter]);

    // Fetch user's saved startups on mount
    useEffect(() => {
        if (user?.id) {
            fetchSavedStartups();
        }
    }, [user?.id]);

    async function fetchSavedStartups() {
        const { data, error } = await supabase
            .from('saved_startups')
            .select('startup_id')
            .eq('investor_id', user.id);

        if (!error && data) {
            setSavedSet(new Set(data.map(s => s.startup_id)));
        }
    }

    async function toggleSave(startupId) {
        if (!user) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        setSavingId(startupId);
        const isSaved = savedSet.has(startupId);

        try {
            if (isSaved) {
                const { error } = await supabase
                    .from('saved_startups')
                    .delete()
                    .eq('investor_id', user.id)
                    .eq('startup_id', startupId);
                if (error) throw error;
                setSavedSet(prev => {
                    const next = new Set(prev);
                    next.delete(startupId);
                    return next;
                });
            } else {
                const { error } = await supabase
                    .from('saved_startups')
                    .insert([{ investor_id: user.id, startup_id: startupId }]);
                if (error) throw error;
                setSavedSet(prev => new Set(prev).add(startupId));
            }
        } catch (err) {
            console.error('Failed to toggle save:', err.message);
        } finally {
            setSavingId(null);
        }
    }

    async function fetchStartups() {
        setLoadingStartups(true);
        let query = supabase
            .from('startups')
            .select('id, name, image_url, description, stage, size, industry, created_at, ace_score, ace_evaluation')
            .order('created_at', { ascending: false })
            .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

        if (categoryFilter !== 'All') {
            query = query.contains('industry', [categoryFilter]);
        }

        const { data, error } = await query;

        if (!error && data) {
            if (page === 0) {
                setStartups(data);
            } else {
                setStartups(prev => [...prev, ...data]);
            }
            if (data.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            // Fetch bulk swipe stats
            if (data.length > 0) {
                try {
                    const ids = data.map(s => s.id);
                    const stats = await apiFetch('/api/startups/swipe-stats-bulk', {
                        method: 'POST',
                        body: JSON.stringify({ startupIds: ids })
                    });
                    setSwipeStats(prev => ({ ...prev, ...stats }));
                } catch (e) {
                    // Stats not critical
                }
            }
        }
        setLoadingStartups(false);
    }

    // Reset page when filter changes
    const handleCategoryChange = (newCategory) => {
        setCategoryFilter(newCategory);
        setPage(0);
        setStartups([]);
        setHasMore(true);
    };

    const handleInvestClick = (startup) => {
        if (!user) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        setSelectedStartup(startup);
        setInvestModalOpen(true);
    };

    const openDetailsModal = async (startup) => {
        setSelectedStartup(startup);
        setDetailsModalOpen(true);
        // Check membership for ACE evaluation visibility
        if (user && startup.id) {
            try {
                const res = await apiFetch(`/api/startups/check-membership/${startup.id}`);
                setIsMemberOf(res.isMember === true);
            } catch {
                setIsMemberOf(false);
            }
        } else {
            setIsMemberOf(false);
        }
    };

    const submitInvestment = async (e) => {
        e.preventDefault();
        if (!investAmount || isNaN(investAmount) || Number(investAmount) <= 0) return;

        try {
            const { error } = await supabase.from('investments').insert([
                {
                    investor_id: user.id,
                    startup_id: selectedStartup.id,
                    amount: Number(investAmount)
                }
            ]);
            if (error) throw error;
            alert('Investment successful!');
            setInvestModalOpen(false);
            setInvestAmount('');
        } catch (err) {
            alert('Failed to invest: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1729] text-white flex flex-col relative overflow-x-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#85BB65]/5 rounded-full blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <div className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate('/')}>
                        Ace<span className="text-[#85BB65]">Up</span>
                    </div>
                </div>
                <ProfileDropdown dashboardPath="/investor/dashboard" />
            </nav>

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 max-w-7xl mx-auto w-full space-y-8 pb-20 mt-4">

                {/* Header */}
                <div className="w-full text-center space-y-4 animate-fade-in-up">
                    <div className="mb-4 flex justify-center">
                        <BackButton />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Discover & Invest
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Explore promising startups and build your portfolio.
                    </p>
                </div>

                {/* Startups Browser */}
                <div className="w-full space-y-8 animate-fade-in-up delay-200">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6">
                        <h2 className="text-2xl font-bold">Startups List</h2>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/investor/binder')}
                                className="px-5 py-2.5 bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/30 hover:scale-105 transition-all duration-200 active:scale-95 text-sm flex items-center gap-2"
                            >
                                🔥 Try Binder
                            </button>
                            <span className="text-gray-400 text-sm">Filter:</span>
                            <select
                                value={categoryFilter}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="px-4 py-2 bg-[#1A2238] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {startups.length === 0 && !loadingStartups ? (
                        <div className="text-center py-20 text-gray-500">
                            No startups found in this category.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                                {startups.map(startup => {
                                    const isSaved = savedSet.has(startup.id);
                                    const isSaving = savingId === startup.id;
                                    return (
                                        <div key={startup.id} className="bg-[#1A2238]/60 border border-white/10 rounded-2xl p-6 hover:border-[#85BB65]/30 transition-all flex flex-col justify-between h-full group hover:-translate-y-1 hover:shadow-xl hover:shadow-[#85BB65]/10 relative">
                                            {/* Like/Heart Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleSave(startup.id); }}
                                                disabled={isSaving}
                                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-all duration-200 z-10 group/heart"
                                                title={isSaved ? 'Remove from saved' : 'Save startup'}
                                            >
                                                {isSaved ? (
                                                    <svg className="w-6 h-6 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)] transition-transform duration-200 hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-6 h-6 text-gray-400 hover:text-red-400 transition-all duration-200 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                )}
                                            </button>

                                            <div onClick={() => openDetailsModal(startup)} className="cursor-pointer">
                                                <div className="flex items-center gap-4 mb-4 pr-10">
                                                    {startup.image_url ? (
                                                        <img src={startup.image_url} alt={`${startup.name} logo`} className="w-16 h-16 rounded-xl object-cover bg-white/5 border border-white/10 shrink-0" />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 shrink-0 flex items-center justify-center text-gray-400 font-bold text-xl">
                                                            {startup.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-xl font-bold group-hover:text-[#85BB65] transition-colors truncate">{startup.name}</h3>
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {(startup.industry || []).slice(0, 2).map((ind, idx) => (
                                                                <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#85BB65]/10 text-[#85BB65] border border-[#85BB65]/20 truncate max-w-[100px]">
                                                                    {ind}
                                                                </span>
                                                            ))}
                                                            {(startup.industry || []).length > 2 && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-gray-400 border border-white/10">
                                                                    +{(startup.industry.length - 2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-gray-400 text-sm mb-4 line-clamp-3 min-h-[60px]">
                                                    {startup.description || "No description provided."}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {new Date(startup.created_at).toLocaleDateString()}
                                                    </div>
                                                    {(startup.stage && startup.stage.length > 0) && (
                                                        <div className="flex items-center gap-1 truncate">
                                                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                                            <span className="truncate">{startup.stage[0]}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Swipe Stats Row */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs">
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        <span className="text-gray-300 font-medium">{swipeStats[startup.id]?.totalSwipes || 0} views</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs">
                                                        <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                        </svg>
                                                        <span className="text-rose-300 font-medium">{swipeStats[startup.id]?.favorites || 0} favorites</span>
                                                    </div>
                                                    {startup.ace_score != null && (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#85BB65]/10 border border-[#85BB65]/20 text-xs ml-auto">
                                                            <span className="text-[#85BB65] font-bold">ACE {startup.ace_score}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openDetailsModal(startup); }}
                                                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10 shadow-sm text-sm"
                                                >
                                                    Learn More
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleInvestClick(startup); }}
                                                    className="w-full py-2.5 rounded-xl bg-[#85BB65]/10 hover:bg-[#85BB65] text-[#85BB65] hover:text-[#0f1729] font-medium transition-colors border border-[#85BB65]/30 shadow-sm text-sm"
                                                >
                                                    Invest Now
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {hasMore && (
                                <div className="flex justify-center pt-8">
                                    <button
                                        onClick={() => setPage(prev => prev + 1)}
                                        disabled={loadingStartups}
                                        className="px-6 py-2 bg-[#1A2238] border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                                    >
                                        {loadingStartups ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Investment Modal */}
            {investModalOpen && selectedStartup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
                        <h3 className="text-2xl font-bold mb-2">Invest in {selectedStartup.name}</h3>
                        <p className="text-gray-400 text-sm mb-6">Enter the amount you wish to invest in this startup.</p>

                        <form onSubmit={submitInvestment} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Investment Amount ($)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={investAmount}
                                    onChange={(e) => setInvestAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50"
                                    placeholder="10000"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setInvestModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-[#85BB65] text-[#0f1729] rounded-xl hover:bg-[#74a856] transition-colors font-bold"
                                >
                                    Confirm Investment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Learn More Details Modal */}
            {detailsModalOpen && selectedStartup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-5">
                                {selectedStartup.image_url ? (
                                    <img src={selectedStartup.image_url} alt="Logo" className="w-20 h-20 rounded-2xl object-cover bg-black/20 border border-white/10 shrink-0" />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-black/20 border border-white/10 shrink-0 flex items-center justify-center text-gray-400 font-bold text-3xl">
                                        {selectedStartup.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-3xl font-bold text-white">{selectedStartup.name}</h2>
                                    <p className="text-sm text-gray-400 mt-1">Founded {new Date(selectedStartup.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDetailsModalOpen(false)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">About</h4>
                                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-xl border border-white/5">
                                    {selectedStartup.description || "No detailed description provided by the founders."}
                                </p>
                            </div>

                            {(selectedStartup.industry || []).length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Industries</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStartup.industry.map(ind => (
                                            <span key={ind} className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium">
                                                {ind}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                {(selectedStartup.stage || []).length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Stage</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedStartup.stage.map(stg => (
                                                <span key={stg} className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-sm font-medium">
                                                    {stg}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(selectedStartup.size || []).length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Company Size</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedStartup.size.map(sz => (
                                                <span key={sz} className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-sm font-medium">
                                                    {sz}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedStartup.ace_score !== null && selectedStartup.ace_score !== undefined && (
                                <div className="mt-8 border border-[#85BB65]/30 rounded-2xl bg-gradient-to-br from-[#85BB65]/10 to-transparent p-6 relative overflow-hidden">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#85BB65]/20 blur-[50px] rounded-full"></div>
                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className="flex flex-col items-center justify-center bg-[#1A2238] border border-[#85BB65]/50 w-24 h-24 rounded-2xl shadow-[0_0_15px_rgba(133,187,101,0.2)] shrink-0">
                                            <span className="text-3xl font-black text-[#85BB65]">
                                                {selectedStartup.ace_score}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                ACE Score
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-[#85BB65] mb-2 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                                                AI Evaluation
                                            </h4>
                                            {isMemberOf ? (
                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                    {selectedStartup.ace_evaluation || "This startup was evaluated favorably for commercial viability."}
                                                </p>
                                            ) : (
                                                <p className="text-gray-400 text-sm italic">
                                                    🔒 Detailed evaluation is only visible to startup team members.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex gap-4">
                            <button
                                onClick={() => {
                                    setDetailsModalOpen(false);
                                    handleInvestClick(selectedStartup);
                                }}
                                className="flex-1 py-4 bg-[#85BB65] hover:bg-[#74a856] text-[#0f1729] rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(133,187,101,0.3)] transition-all hover:shadow-[0_0_30px_rgba(133,187,101,0.5)] flex items-center justify-center gap-2 group"
                            >
                                Invest Now
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
