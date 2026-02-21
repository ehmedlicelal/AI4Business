import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LoginPopup({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();

    if (!isOpen) return null;

    const handleLogin = () => {
        // Navigate to login, preserving the current location (or the intended destination)
        // If we are on /investor and want to go to /investor/dashboard, passing /investor/dashboard as 'from' is ideal.
        // However, since this popup is triggered on the InvestorHome page when clicking "Dashboard", 
        // we should probably pass '/investor/dashboard' explicitly if that's the goal.
        // For simplicity, let's assume the user wants to go to the Dashboard if they are logging in from here.
        navigate('/login', { state: { from: { pathname: '/investor/dashboard' } } });
    };

    return (
        <div
            className="absolute top-full right-0 mt-4 w-72 animate-fade-in-up origin-top-right z-[100]"
        >
            <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />

            <div className="relative z-50 bg-[#1A2238]/90 backdrop-blur-md border border-[#85BB65]/30 rounded-2xl p-4 shadow-2xl pointer-events-auto">
                <h3 className="text-base font-bold text-white mb-2 text-center">
                    Login Required
                </h3>
                <p className="text-gray-300 text-xs text-center mb-4 leading-relaxed">
                    Please log in to view the dashboard.
                </p>

                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLogin();
                        }}
                        className="w-full py-2 px-4 bg-[#85BB65] hover:bg-[#6fa050] text-[#0f1729] font-bold rounded-lg transition-colors cursor-pointer text-sm shadow-lg shadow-[#85BB65]/20 z-50 relative"
                    >
                        Log In
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors rounded-lg cursor-pointer text-sm z-50 relative"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* Arrow/Triangle pointer if needed, can add later */}
        </div>
    );
}
