import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import BackButton from '../../components/BackButton';
import ProfileDropdown from '../../components/ProfileDropdown';

const CATEGORIES = ['All', 'Advertising', 'Agriculture', 'Blockchain', 'Consumer Goods', 'Education', 'Energy & Greentech', 'Fashion & Living', 'Fintech', 'Food & Beverage', 'Gaming', 'Healthcare & Life Science'];

export default function Binder() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [phase, setPhase] = useState('filter');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [deck, setDeck] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [detailStartup, setDetailStartup] = useState(null);
    const [swipeStats, setSwipeStats] = useState({});
    const [removed, setRemoved] = useState(new Set());

    const containerRef = useRef(null);
    const dragState = useRef({ active: false, startX: 0, startY: 0, el: null, cardId: null });

    const activeCards = deck.filter(s => !removed.has(s.id));

    const fetchDeckRef = useRef(null);
    fetchDeckRef.current = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/api/startups/binder-deck?category=${selectedCategory}`);
            const cards = data.data || [];
            setDeck(cards);
            setRemoved(new Set());

            if (cards.length > 0) {
                const ids = cards.map(c => c.id);
                const stats = await apiFetch('/api/startups/swipe-stats-bulk', {
                    method: 'POST',
                    body: JSON.stringify({ startupIds: ids })
                });
                setSwipeStats(stats);
            }
        } catch (err) {
            console.error('Failed to fetch binder deck:', err);
        } finally {
            setLoading(false);
        }
    };

    const startSwiping = () => {
        setPhase('swiping');
        fetchDeckRef.current();
    };

    const saveAsFavorite = useCallback(async (startupId) => {
        try {
            await apiFetch(`/api/startups/${startupId}/swipe`, {
                method: 'POST',
                body: JSON.stringify({ direction: 'right' })
            });
        } catch (err) {
            console.error('Failed to save favorite:', err);
        }
    }, []);

    const removeCard = useCallback((cardId, direction) => {
        if (direction === 'right') {
            saveAsFavorite(cardId);
        }
        setRemoved(prev => {
            const next = new Set(prev);
            next.add(cardId);
            return next;
        });
    }, [saveAsFavorite]);

    // Check if all cards are gone and reload
    const checkAndReload = useCallback((newRemovedSize) => {
        if (newRemovedSize >= deck.length && deck.length > 0) {
            setTimeout(() => fetchDeckRef.current(), 1200);
        }
    }, [deck.length]);

    const programmaticSwipe = useCallback((direction) => {
        if (activeCards.length === 0) return;
        const topCard = activeCards[0];
        const el = containerRef.current?.querySelector(`[data-card-id="${topCard.id}"]`);
        if (!el) return;

        const moveOut = window.innerWidth * 1.5;
        const toX = direction === 'right' ? moveOut : -moveOut;
        el.style.transition = 'transform 0.5s ease';
        el.style.transform = `translate(${toX}px, -100px) rotate(${direction === 'right' ? -30 : 30}deg)`;

        setTimeout(() => {
            removeCard(topCard.id, direction);
            checkAndReload(removed.size + 1);
        }, 400);
    }, [activeCards, removeCard, checkAndReload, removed.size]);

    const handlePointerDown = useCallback((e, cardId) => {
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        dragState.current = { active: true, startX: e.clientX, startY: e.clientY, el, cardId };
        el.style.transition = 'none';
    }, []);

    const handlePointerMove = useCallback((e) => {
        const ds = dragState.current;
        if (!ds.active || !ds.el) return;

        const deltaX = e.clientX - ds.startX;
        const deltaY = e.clientY - ds.startY;
        const rotate = deltaX * 0.05;

        ds.el.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;
    }, []);

    const handlePointerUp = useCallback((e) => {
        const ds = dragState.current;
        if (!ds.active || !ds.el) return;

        const deltaX = e.clientX - ds.startX;
        const moveOutWidth = window.innerWidth;
        const keep = Math.abs(deltaX) < 100;

        if (keep) {
            ds.el.style.transition = 'transform 0.3s ease';
            ds.el.style.transform = '';
        } else {
            const toX = deltaX > 0 ? moveOutWidth * 1.5 : -moveOutWidth * 1.5;
            const rotate = deltaX * 0.05;
            ds.el.style.transition = 'transform 0.5s ease';
            ds.el.style.transform = `translate(${toX}px, ${e.clientY - ds.startY}px) rotate(${rotate}deg)`;

            const cardId = ds.cardId;
            const direction = deltaX > 0 ? 'right' : 'left';
            setTimeout(() => {
                removeCard(cardId, direction);
                checkAndReload(removed.size + 1);
            }, 400);
        }

        dragState.current = { active: false, startX: 0, startY: 0, el: null, cardId: null };
    }, [removeCard, checkAndReload, removed.size]);

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-[#85BB65]';
        if (score >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    // ── FILTER PHASE ──────────────────────────────
    if (phase === 'filter') {
        return (
            <div className="min-h-screen bg-[#0f1729] text-white flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#85BB65]/10 rounded-full blur-[120px]" />
                </div>

                <nav className="relative z-10 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <BackButton />
                        <div className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate('/')}>
                            Ace<span className="text-[#85BB65]">Up</span>
                        </div>
                    </div>
                    <ProfileDropdown dashboardPath="/investor/dashboard" />
                </nav>

                <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
                    <div className="text-center space-y-6 animate-fade-in-up">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-2xl shadow-pink-500/30">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-5xl font-extrabold tracking-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-orange-300">Binder</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-md mx-auto">
                            Swipe through startups like never before. Find your next big investment with a single gesture.
                        </p>

                        <div className="space-y-4 mt-8">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Choose a Category (Optional)</h3>
                            <div className="flex flex-wrap justify-center gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${selectedCategory === cat
                                            ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white border-transparent shadow-lg shadow-rose-500/20'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={startSwiping}
                            className="mt-8 px-10 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 text-white font-bold text-lg rounded-2xl shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-300 active:scale-95"
                        >
                            Start Swiping 🔥
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // ── SWIPING PHASE ─────────────────────────────
    return (
        <div className="min-h-screen bg-[#0f1729] text-white flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-400/5 rounded-full blur-[120px]" />
            </div>

            <nav className="relative z-50 px-8 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <div className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate('/')}>
                        Ace<span className="text-[#85BB65]">Up</span>
                    </div>
                </div>
                <ProfileDropdown dashboardPath="/investor/dashboard" />
            </nav>

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-2">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                    </div>
                ) : deck.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <p className="text-gray-400 text-lg">No startups found in this category. Try a different filter!</p>
                        <button onClick={() => setPhase('filter')} className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold rounded-xl">
                            Change Category
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Card Stack */}
                        <div ref={containerRef} className="relative w-full max-w-[420px] h-[520px] mx-auto">
                            {[...activeCards].reverse().map((startup, reverseIdx) => {
                                const i = activeCards.length - 1 - reverseIdx; // actual position (0 = top)
                                const stackIdx = i; // for stacking visuals: 0 = front
                                return (
                                    <div
                                        key={startup.id}
                                        data-card-id={startup.id}
                                        className="absolute w-full h-full select-none touch-none"
                                        style={{
                                            zIndex: activeCards.length - stackIdx,
                                            transform: stackIdx === 0 ? 'none' : `scale(${(20 - stackIdx) / 20}) translateY(-${30 * stackIdx}px)`,
                                            opacity: Math.max(0, (10 - stackIdx) / 10),
                                            pointerEvents: stackIdx === 0 ? 'auto' : 'none',
                                            cursor: stackIdx === 0 ? 'grab' : 'default',
                                        }}
                                        onPointerDown={stackIdx === 0 ? (e) => handlePointerDown(e, startup.id) : undefined}
                                        onPointerMove={stackIdx === 0 ? handlePointerMove : undefined}
                                        onPointerUp={stackIdx === 0 ? handlePointerUp : undefined}
                                    >
                                        <div className="w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#1A2238] to-[#0f1729] shadow-2xl">
                                            {/* Image / Header */}
                                            <div className="relative h-[200px] bg-gradient-to-br from-slate-700/50 to-slate-800/50 overflow-hidden flex items-center justify-center">
                                                {startup.image_url ? (
                                                    <img
                                                        src={startup.image_url}
                                                        alt={startup.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                                    />
                                                ) : null}
                                                <div
                                                    className={`${startup.image_url ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}
                                                    style={{ background: `linear-gradient(135deg, hsl(${(startup.name.charCodeAt(0) * 37) % 360}, 60%, 35%), hsl(${(startup.name.charCodeAt(0) * 37 + 60) % 360}, 70%, 25%))` }}
                                                >
                                                    <span className="text-7xl font-black text-white/30">{startup.name.charAt(0)}</span>
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2238] via-transparent to-transparent" />

                                                {startup.ace_score != null && (
                                                    <div className="absolute top-4 right-4 w-14 h-14 rounded-2xl bg-[#0f1729]/80 backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center">
                                                        <span className={`text-lg font-black ${getScoreColor(startup.ace_score)}`}>{startup.ace_score}</span>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase">ACE</span>
                                                    </div>
                                                )}

                                                <div className="absolute top-4 left-4 flex gap-2">
                                                    <div className="px-2.5 py-1 rounded-lg bg-[#0f1729]/80 backdrop-blur-sm border border-white/10 flex items-center gap-1.5 text-xs">
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        <span className="text-gray-300 font-medium">{swipeStats[startup.id]?.totalSwipes || 0}</span>
                                                    </div>
                                                    <div className="px-2.5 py-1 rounded-lg bg-[#0f1729]/80 backdrop-blur-sm border border-rose-500/20 flex items-center gap-1.5 text-xs">
                                                        <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                        </svg>
                                                        <span className="text-rose-300 font-medium">{swipeStats[startup.id]?.favorites || 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white">{startup.name}</h2>
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {(startup.industry || []).slice(0, 3).map((ind, idx) => (
                                                            <span key={idx} className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#85BB65]/10 text-[#85BB65] border border-[#85BB65]/20">
                                                                {ind}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                                                    {startup.description || "No description provided."}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    {(startup.stage || []).length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                                            <span>{startup.stage[0]}</span>
                                                        </div>
                                                    )}
                                                    {(startup.size || []).length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                            <span>{startup.size[0]}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                                <span className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">Swipe to decide</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-6 mt-6 relative z-20">
                            <button
                                onClick={() => programmaticSwipe('left')}
                                disabled={activeCards.length === 0}
                                className="w-16 h-16 rounded-full border-2 border-red-400/30 bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 group"
                            >
                                <svg className="w-7 h-7 text-red-400 group-hover:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <button
                                onClick={() => {
                                    if (activeCards.length > 0) {
                                        setDetailStartup(activeCards[0]);
                                        setShowDetails(true);
                                    }
                                }}
                                disabled={activeCards.length === 0}
                                className="w-12 h-12 rounded-full border-2 border-blue-400/30 bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 group"
                            >
                                <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => programmaticSwipe('right')}
                                disabled={activeCards.length === 0}
                                className="w-16 h-16 rounded-full border-2 border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 group"
                            >
                                <svg className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex justify-between w-full max-w-[420px] mx-auto mt-3 px-4">
                            <span className="text-xs text-red-400/60 font-medium">← Skip</span>
                            <span className="text-xs text-blue-400/60 font-medium">↑ Details</span>
                            <span className="text-xs text-emerald-400/60 font-medium">Save →</span>
                        </div>

                        <div className="mt-4 text-center">
                            <span className="text-xs text-gray-500">{activeCards.length} startup{activeCards.length !== 1 ? 's' : ''} remaining</span>
                        </div>
                    </>
                )}
            </main>

            {/* Detail Modal */}
            {showDetails && detailStartup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-5">
                                {detailStartup.image_url ? (
                                    <img src={detailStartup.image_url} alt="Logo" className="w-20 h-20 rounded-2xl object-cover bg-black/20 border border-white/10 shrink-0" />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-black/20 border border-white/10 shrink-0 flex items-center justify-center text-gray-400 font-bold text-3xl">
                                        {detailStartup.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-3xl font-bold text-white">{detailStartup.name}</h2>
                                    <p className="text-sm text-gray-400 mt-1">Founded {new Date(detailStartup.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">About</h4>
                                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-xl border border-white/5">
                                    {detailStartup.description || "No detailed description provided by the founders."}
                                </p>
                            </div>

                            {(detailStartup.industry || []).length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Industries</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {detailStartup.industry.map(ind => (
                                            <span key={ind} className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium">{ind}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                {(detailStartup.stage || []).length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Stage</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {detailStartup.stage.map(stg => (
                                                <span key={stg} className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-sm font-medium">{stg}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(detailStartup.size || []).length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Company Size</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {detailStartup.size.map(sz => (
                                                <span key={sz} className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-sm font-medium">{sz}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {detailStartup.ace_score != null && (
                                <div className="border border-[#85BB65]/30 rounded-2xl bg-gradient-to-br from-[#85BB65]/10 to-transparent p-6">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-center justify-center bg-[#1A2238] border border-[#85BB65]/50 w-24 h-24 rounded-2xl shadow-[0_0_15px_rgba(133,187,101,0.2)] shrink-0">
                                            <span className={`text-3xl font-black ${getScoreColor(detailStartup.ace_score)}`}>{detailStartup.ace_score}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ACE Score</span>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-[#85BB65] mb-1">AI Evaluation</h4>
                                            <p className="text-gray-400 text-sm">Detailed evaluation is only available to startup team members.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <div className="flex-1 bg-white/5 rounded-xl p-4 text-center border border-white/5">
                                    <span className="text-2xl font-bold text-white">{swipeStats[detailStartup.id]?.totalSwipes || 0}</span>
                                    <p className="text-xs text-gray-400 mt-1">Total Swipes</p>
                                </div>
                                <div className="flex-1 bg-rose-500/5 rounded-xl p-4 text-center border border-rose-500/10">
                                    <span className="text-2xl font-bold text-rose-400">{swipeStats[detailStartup.id]?.favorites || 0}</span>
                                    <p className="text-xs text-gray-400 mt-1">Favorites</p>
                                </div>
                            </div>

                            <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Interested?</h4>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDetails(false);
                                            setTimeout(() => programmaticSwipe('right'), 200);
                                        }}
                                        className="flex-1 py-3 bg-[#85BB65] hover:bg-[#74a856] text-[#0f1729] rounded-xl font-bold transition-colors"
                                    >
                                        💚 Save & Contact
                                    </button>
                                    <button
                                        onClick={() => setShowDetails(false)}
                                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                                    >
                                        Back to Swiping
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
