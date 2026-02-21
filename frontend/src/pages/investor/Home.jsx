import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import ProfileDropdown from '../../components/ProfileDropdown';

export default function InvestorHome() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [showDiscoverChoices, setShowDiscoverChoices] = React.useState(false);

    const handleDiscoverClick = () => {
        setShowDiscoverChoices(true);
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
                    <BackButton
                        onClick={() => {
                            if (showDiscoverChoices) {
                                setShowDiscoverChoices(false);
                            } else {
                                navigate(-1);
                            }
                        }}
                    />
                    <div className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate('/')}>
                        AI4<span className="text-[#85BB65]">Business</span>
                    </div>
                </div>
                <ProfileDropdown dashboardPath="/investor/dashboard" />
            </nav>

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 max-w-7xl mx-auto w-full space-y-16 pb-20 mt-10">

                {/* Hero Section */}
                <div className="text-center space-y-6 animate-fade-in-up">
                    <span className="px-4 py-1.5 rounded-full bg-[#85BB65]/10 border border-[#85BB65]/20 text-[#85BB65] text-sm font-medium">
                        Investor Portal
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                        Smarter Investment <br />
                        <span className="text-[#85BB65]">Decisions</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Access real-time market data, manage your portfolio with AI-driven insights, and maximize your returns.
                    </p>
                </div>

                {/* Discover Startups Button Area */}
                <div className="w-full flex justify-center animate-fade-in-up delay-200 py-10">
                    {!showDiscoverChoices ? (
                        <>
                            <button
                                onClick={handleDiscoverClick}
                                className="group relative w-64 h-64 bg-[#1A2238] border-2 border-[#85BB65]/30 hover:border-[#85BB65] rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-5px_rgba(133,187,101,0.3)] shadow-2xl overflow-hidden"
                            >
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#85BB65]/0 to-[#85BB65]/10 group-hover:from-[#85BB65]/10 group-hover:to-[#85BB65]/20 transition-all duration-500" />

                                {/* Icon */}
                                <div className="relative z-10 w-20 h-20 bg-[#85BB65]/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                                    <svg className="w-10 h-10 text-[#85BB65]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>

                                {/* Text */}
                                <div className="relative z-10 text-center">
                                    <h3 className="text-2xl font-bold text-white group-hover:text-[#85BB65] transition-colors">Discover<br />Startups</h3>
                                </div>

                                {/* Decoration */}
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#85BB65]/20 rounded-full blur-2xl group-hover:bg-[#85BB65]/30 transition-all" />
                            </button>

                            {/* Tech Park Registration Button */}
                            <button
                                onClick={() => navigate('/tech-park-register')}
                                className="group relative w-64 h-64 bg-[#1A2238] border-2 border-blue-500/30 hover:border-blue-500 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.3)] shadow-2xl overflow-hidden ml-8"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 group-hover:from-blue-500/10 group-hover:to-blue-500/20 transition-all duration-500" />

                                <div className="relative z-10 w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>

                                <div className="relative z-10 text-center">
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Tech Park<br />Registration</h3>
                                </div>

                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all" />
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center w-full max-w-4xl mx-auto animate-fade-in-up">
                            {/* Navigation & Header Area */}
                            <div className="w-full flex justify-center items-center mb-10 pl-4 md:pl-0">
                                <h2 className="text-2xl md:text-3xl font-bold text-white text-center w-full">
                                    How would you like to search?
                                </h2>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 mt-4">
                                {/* Discover Manually */}
                                <button
                                    onClick={() => navigate('/investor/discover')}
                                    className="group relative w-64 h-64 bg-[#1A2238] border border-white/10 hover:border-gray-500 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:-translate-y-2 shadow-xl overflow-hidden opacity-90 hover:opacity-100"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 group-hover:from-white/5 group-hover:to-white/10 transition-all duration-500" />
                                    <div className="relative z-10 w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <div className="relative z-10 text-center">
                                        <h3 className="text-xl font-bold text-gray-300 group-hover:text-white transition-colors">Discover<br />Manually</h3>
                                    </div>
                                </button>

                                {/* Try Binder - Flashy Option */}
                                <button
                                    onClick={() => navigate('/investor/binder')}
                                    className="group relative w-72 h-72 md:-mt-4 bg-gradient-to-br from-[#1A2238] to-[#0f1729] border-2 border-[#85BB65] rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:scale-105 hover:shadow-[0_0_50px_-5px_rgba(133,187,101,0.5)] shadow-[0_0_20px_-5px_rgba(133,187,101,0.2)] overflow-hidden z-10"
                                >
                                    {/* Animated Glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#85BB65]/10 via-transparent to-[#85BB65]/20 group-hover:from-[#85BB65]/20 group-hover:to-[#85BB65]/40 transition-all duration-500" />

                                    {/* Rotating gradient border effect */}
                                    <div className="absolute w-[200%] h-[200%] shadow-[inset_0_0_50px_rgba(133,187,101,0.5)] animate-[spin_10s_linear_infinite] opacity-50 pointer-events-none rounded-full" />

                                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#85BB65] to-transparent opacity-50" />

                                    <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-[#85BB65] to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-[#85BB65]/30">
                                        <svg className="w-12 h-12 text-[#0f1729] drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                    <div className="relative z-10 text-center">
                                        <h3 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Try<br /><span className="text-[#85BB65] drop-shadow-[0_0_8px_rgba(133,187,101,0.6)]">Binder</span></h3>
                                        <span className="inline-block mt-3 px-3 py-1 bg-[#85BB65]/20 text-[#85BB65] text-xs font-bold rounded-full border border-[#85BB65]/30 uppercase tracking-wider shadow-[0_0_10px_rgba(133,187,101,0.2)]">Recommended ✨</span>
                                    </div>

                                    {/* Corner decorations */}
                                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#85BB65]/30 rounded-full blur-3xl group-hover:bg-[#85BB65]/40 transition-all duration-700" />
                                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#85BB65]/30 rounded-full blur-3xl group-hover:bg-[#85BB65]/40 transition-all duration-700" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main >
        </div >
    );
}
