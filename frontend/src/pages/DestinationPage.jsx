import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

export default function DestinationPage() {
    const navigate = useNavigate();

    const handleChoice = (destination) => {
        if (destination === 'investor') {
            navigate('/investor');
        } else {
            navigate('/environment-selection');
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1729] text-white flex flex-col relative overflow-hidden">
            {/* Background Gradients (Same as LandingPage) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#85BB65]/10 rounded-full blur-[120px]" />
            </div>

            {/* Navbar (Minimal) */}
            <nav className="relative z-10 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <div className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate('/')}>
                        Ace<span className="text-[#85BB65]">Up</span>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-12 animate-fade-in-up">

                    <div className="space-y-4">
                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#85BB65] to-emerald-400">
                            Where's our destination?
                        </h2>
                        <p className="text-gray-400 text-xl sm:text-2xl">
                            Select your workspace to continue
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
                        {/* Investor Panel Option */}
                        <div className="animate-fade-in-up delay-200 w-full">
                            <button
                                onClick={() => handleChoice('investor')}
                                className="group relative w-full p-12 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#85BB65] rounded-[2rem] transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-[#85BB65]/20 flex flex-col items-center justify-center gap-6 text-center h-[400px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#85BB65]/0 to-[#85BB65]/0 group-hover:from-[#85BB65]/5 group-hover:to-blue-500/5 transition-all duration-500" />

                                <div className="relative z-10 w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg group-hover:shadow-blue-500/30">
                                    <svg className="w-12 h-12 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-[#85BB65] transition-colors">Investor Panel</h3>
                                    <p className="text-gray-400 text-lg group-hover:text-gray-300 transition-colors">Analyze growth, track metrics, and manage portfolios.</p>
                                </div>
                            </button>
                        </div>

                        {/* Environment Panel Option */}
                        <div className="animate-fade-in-up delay-300 w-full">
                            <button
                                onClick={() => handleChoice('environment')}
                                className="group relative w-full p-12 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500 rounded-[2rem] transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-emerald-500/20 flex flex-col items-center justify-center gap-6 text-center h-[400px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500" />

                                <div className="relative z-10 w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-lg group-hover:shadow-emerald-500/30">
                                    {/* Office Building Icon */}
                                    <svg className="w-12 h-12 text-emerald-400 group-hover:text-emerald-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">Environment Panel</h3>
                                    <p className="text-gray-400 text-lg group-hover:text-gray-300 transition-colors">Analyze market trends, competitive landscape, and manage your business ecosystem.</p>
                                </div>
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
