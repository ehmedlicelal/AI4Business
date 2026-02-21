import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import BackButton from '../../components/BackButton';
import TechParkRequestsWidget from '../../components/widgets/TechParkRequestsWidget';

export default function InvestorDashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [myStartups, setMyStartups] = useState([]);
    const [myInvestments, setMyInvestments] = useState([]);
    const [savedStartups, setSavedStartups] = useState([]);
    const [totalEarned, setTotalEarned] = useState(0);
    const [loading, setLoading] = useState(true);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [startupName, setStartupName] = useState('');
    const [startupImageUrl, setStartupImageUrl] = useState('');
    const [startupDescription, setStartupDescription] = useState('');
    const [startupStage, setStartupStage] = useState([]);
    const [startupSize, setStartupSize] = useState([]);
    const [startupIndustry, setStartupIndustry] = useState([]);
    const [teamMembers, setTeamMembers] = useState('');

    const STAGES = ['Idea', 'Product or prototype', 'Go to market', 'Growth and expansion'];
    const SIZES = ['1-10', '11-50', '51-100', '101-200', '200+'];
    const INDUSTRIES = ['Advertising', 'Agriculture', 'Blockchain', 'Consumer Goods', 'Education', 'Energy & Greentech', 'Fashion & Living', 'Fintech', 'Food & Beverage', 'Gaming', 'Healthcare & Life Science'];

    const toggleSelection = (setter, currentSelection, item) => {
        if (currentSelection.includes(item)) {
            setter(currentSelection.filter(i => i !== item));
        } else {
            setter([...currentSelection, item]);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData();
        }
    }, [user?.id]);

    async function fetchDashboardData() {
        setLoading(true);

        const [startupsRes, investmentsRes, savedRes, earningsRes] = await Promise.all([
            supabase.from('startups').select('*').eq('created_by', user.id).order('created_at', { ascending: false }),
            supabase.from('investments').select('*, startups(name, industry)').eq('investor_id', user.id).order('created_at', { ascending: false }),
            supabase.from('saved_startups').select('*, startups(id, name, industry, created_at)').eq('investor_id', user.id).order('created_at', { ascending: false }),
            supabase.from('finances').select('amount').eq('user_id', user.id).eq('type', 'Revenue'),
        ]);

        setMyStartups(startupsRes.data || []);
        setMyInvestments(investmentsRes.data || []);
        setSavedStartups(savedRes.data || []);

        const earned = (earningsRes.data || []).reduce((sum, f) => sum + Number(f.amount), 0);
        setTotalEarned(earned);

        setLoading(false);
    }

    async function handleRemoveSaved(startupId) {
        const { error } = await supabase
            .from('saved_startups')
            .delete()
            .eq('investor_id', user.id)
            .eq('startup_id', startupId);

        if (!error) {
            setSavedStartups(prev => prev.filter(s => s.startup_id !== startupId));
        }
    }

    async function handleCreateStartup(e) {
        e.preventDefault();
        if (!startupName) {
            alert('Please enter a startup name.');
            return;
        }

        try {
            const { data: startupData, error: startupError } = await supabase
                .from('startups')
                .insert([{
                    name: startupName,
                    image_url: startupImageUrl,
                    description: startupDescription,
                    stage: startupStage,
                    size: startupSize,
                    industry: startupIndustry,
                    created_by: user.id
                }])
                .select()
                .single();

            if (startupError) throw startupError;

            const { error: memberError } = await supabase
                .from('startup_members')
                .insert([{ startup_id: startupData.id, user_id: user.id, role: 'Owner' }]);

            if (memberError) throw memberError;

            alert('Startup Created Successfully! Your startup is ready.');
            setCreateModalOpen(false);
            setStartupName('');
            setStartupImageUrl('');
            setStartupDescription('');
            setStartupStage([]);
            setStartupSize([]);
            setStartupIndustry([]);
            setTeamMembers('');
            fetchDashboardData();
        } catch (err) {
            alert('Failed to create startup: ' + err.message);
        }
    }

    const totalInvested = myInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'saved', label: 'Favorites', icon: '❤️', count: savedStartups.length },
    ];

    if (profile?.role === 'Admin') {
        tabs.push({ id: 'techpark', label: 'Tech Park Requests', icon: '🏢' });
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-20 p-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="mb-4">
                        <BackButton />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Investor Dashboard</h1>
                    <p className="text-gray-400 mt-2">Track your investments, earnings, and favorite startups.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/investor/discover')}
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/10"
                    >
                        🔍 Discover Startups
                    </button>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="px-6 py-2.5 bg-[#85BB65] hover:bg-[#74a856] text-[#0f1729] font-bold rounded-xl transition-colors shadow-lg shadow-[#85BB65]/20"
                    >
                        + Form a Startup
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/30 hover:border-blue-400/50 transition-colors">
                    <p className="text-gray-400 text-sm font-medium">Total Invested</p>
                    <h3 className="text-3xl font-bold text-white mt-2">${totalInvested.toLocaleString()}</h3>
                    <div className="mt-2 flex items-center gap-1 text-blue-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        Across {myInvestments.length} deals
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
                    <p className="text-gray-400 text-sm font-medium">Total Earned</p>
                    <h3 className="text-3xl font-bold text-white mt-2">${totalEarned.toLocaleString()}</h3>
                    <div className="mt-2 flex items-center gap-1 text-emerald-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
                        Revenue returns
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/30 hover:border-purple-400/50 transition-colors">
                    <p className="text-gray-400 text-sm font-medium">My Startups</p>
                    <h3 className="text-3xl font-bold text-white mt-2">{myStartups.length}</h3>
                    <div className="mt-2 flex items-center gap-1 text-purple-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                        Founded by you
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/5 border border-rose-500/30 hover:border-rose-400/50 transition-colors">
                    <p className="text-gray-400 text-sm font-medium">Favorite Startups</p>
                    <h3 className="text-3xl font-bold text-white mt-2">{savedStartups.length}</h3>
                    <div className="mt-2 flex items-center gap-1 text-rose-400 text-xs">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                        Your favorites
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10">
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 text-sm font-medium rounded-t-xl transition-all duration-200 flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-[#1A2238]/70 text-white border border-white/10 border-b-transparent -mb-px'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                                    ? 'bg-[#85BB65]/20 text-[#85BB65]'
                                    : 'bg-white/10 text-gray-400'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
                    {/* My Startups */}
                    <div className="bg-[#1A2238]/50 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span>🛡️</span> My Startups
                        </h3>
                        {myStartups.length === 0 ? (
                            <p className="text-gray-400 text-center py-10 border border-dashed border-gray-700/50 rounded-xl">
                                You haven't formed a startup yet. Click "Form a Startup" to begin.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {myStartups.map(startup => (
                                    <div key={startup.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/[0.07] transition-colors">
                                        <div>
                                            <h4 className="text-white font-bold">{startup.name}</h4>
                                            <span className="text-xs text-[#85BB65]">{startup.category}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-300">Owner</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My Investments */}
                    <div className="bg-[#1A2238]/50 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span>💼</span> My Investments
                        </h3>
                        {myInvestments.length === 0 ? (
                            <p className="text-gray-400 text-center py-10 border border-dashed border-gray-700/50 rounded-xl">
                                You haven't made any investments yet.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {myInvestments.map(inv => (
                                    <div key={inv.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/[0.07] transition-colors">
                                        <div>
                                            <h4 className="text-white font-bold">{inv.startups?.name || 'Unknown Startup'}</h4>
                                            <span className="text-xs text-blue-400">{inv.startups?.category || 'General'}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-white">${Number(inv.amount).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(inv.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'saved' && (
                <div className="animate-fade-in-up">
                    {savedStartups.length === 0 ? (
                        <div className="bg-[#1A2238]/50 border border-white/10 rounded-3xl p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
                                <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Favorite Startups Yet</h3>
                            <p className="text-gray-400 mb-6">Like startups on the Discover page and they'll appear in your favorites.</p>
                            <button
                                onClick={() => navigate('/investor/discover')}
                                className="px-6 py-2.5 bg-[#85BB65] hover:bg-[#74a856] text-[#0f1729] font-bold rounded-xl transition-colors"
                            >
                                🔍 Discover Startups
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedStartups.map(saved => (
                                <div key={saved.startup_id} className="bg-[#1A2238]/60 border border-white/10 rounded-2xl p-6 hover:border-rose-500/30 transition-all group hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/5 relative flex flex-col justify-between">
                                    {/* Unlike button */}
                                    <button
                                        onClick={() => handleRemoveSaved(saved.startup_id)}
                                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-all duration-200"
                                        title="Remove from saved"
                                    >
                                        <svg className="w-5 h-5 text-red-500 hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                    </button>

                                    <div>
                                        <div className="flex justify-between items-start mb-3 pr-10">
                                            <h3 className="text-lg font-bold text-white group-hover:text-[#85BB65] transition-colors">
                                                {saved.startups?.name || 'Unknown'}
                                            </h3>
                                            <span className="px-2.5 py-1 rounded-md bg-[#85BB65]/10 text-[#85BB65] text-xs font-semibold">
                                                {saved.startups?.category || 'General'}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-xs mb-4">
                                            Saved on {new Date(saved.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => navigate('/investor/discover')}
                                        className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-[#85BB65] text-white hover:text-[#0f1729] font-medium transition-colors border border-white/10"
                                    >
                                        View & Invest
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'techpark' && profile?.role === 'Admin' && (
                <div className="animate-fade-in-up">
                    <TechParkRequestsWidget />
                </div>
            )}

            {/* Create Startup Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up custom-scrollbar">
                        <h3 className="text-2xl font-bold mb-2">Form a Startup</h3>
                        <p className="text-gray-400 text-sm mb-6">Create your startup instantly and start recruiting members.</p>

                        <form onSubmit={handleCreateStartup} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Startup Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={startupName}
                                    onChange={(e) => setStartupName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50"
                                    placeholder="Apex Innovations"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Logo/Image URL</label>
                                <input
                                    type="url"
                                    value={startupImageUrl}
                                    onChange={(e) => setStartupImageUrl(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50"
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={startupDescription}
                                    onChange={(e) => setStartupDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50"
                                    placeholder="Briefly describe what your startup does..."
                                    rows="3"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Stage</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-white/5 border border-white/10 rounded-xl custom-scrollbar">
                                        {STAGES.map(stage => (
                                            <label key={stage} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" checked={startupStage.includes(stage)} onChange={() => toggleSelection(setStartupStage, startupStage, stage)} className="w-4 h-4 rounded text-[#85BB65] focus:ring-[#85BB65] bg-black/20 border-white/20 accent-[#85BB65]" />
                                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{stage}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-white/5 border border-white/10 rounded-xl custom-scrollbar">
                                        {SIZES.map(size => (
                                            <label key={size} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" checked={startupSize.includes(size)} onChange={() => toggleSelection(setStartupSize, startupSize, size)} className="w-4 h-4 rounded text-[#85BB65] focus:ring-[#85BB65] bg-black/20 border-white/20 accent-[#85BB65]" />
                                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{size}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-white/5 border border-white/10 rounded-xl custom-scrollbar">
                                    {INDUSTRIES.map(industry => (
                                        <label key={industry} className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={startupIndustry.includes(industry)} onChange={() => toggleSelection(setStartupIndustry, startupIndustry, industry)} className="w-4 h-4 rounded text-[#85BB65] focus:ring-[#85BB65] bg-black/20 border-white/20 accent-[#85BB65]" />
                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{industry}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Initial Team Members (Emails)</label>
                                <textarea
                                    value={teamMembers}
                                    onChange={(e) => setTeamMembers(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]/50"
                                    placeholder="manager@example.com (comma separated)"
                                    rows="2"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-[#85BB65] text-[#0f1729] rounded-xl hover:bg-[#74a856] transition-colors font-bold"
                                >
                                    Create Startup
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
