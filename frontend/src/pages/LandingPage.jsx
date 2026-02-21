import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileDropdown from '../components/ProfileDropdown';

export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#0f1729] text-white flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#85BB65]/10 rounded-full blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="text-2xl font-bold tracking-tight">
                    Ace<span className="text-[#85BB65]">Up</span>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <ProfileDropdown />
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="px-4 py-2 bg-[#85BB65] hover:bg-[#74a856] text-[#0f1729] font-bold rounded-lg transition-colors text-sm"
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="space-y-4 animate-fade-in-up">
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-tight">
                            Elevate Your Business <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#85BB65] to-emerald-400">
                                with AI Intelligence
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
                            Streamline finances, optimize inventory, and manage tasks effortlessly.
                            The all-in-one AI-powered platform for modern enterprises.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-100">
                        <button
                            onClick={() => navigate('/destination')}
                            className="px-8 py-4 bg-[#85BB65] hover:bg-[#74a856] text-white text-lg font-bold rounded-2xl shadow-lg shadow-[#85BB65]/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                        >
                            Get Started
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                        <button
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-lg font-medium rounded-2xl border border-white/10 transition-all hover:scale-105 active:scale-95"
                        >
                            Learn More
                        </button>
                        <button
                            onClick={() => navigate('/tech-park-register')}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-[#85BB65] text-lg font-bold rounded-2xl border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Tech Park Registration
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer / Trust Badge */}
            <div className="relative z-10 py-12 text-center text-gray-500 text-sm">
                <p>Trusted by forward-thinking companies worldwide</p>
                {/* Add simple logos or dots here if desired */}
            </div>
        </div>
    );
}
