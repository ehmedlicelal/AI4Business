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

    // Forms State
    const [newEntityName, setNewEntityName] = useState('');
    const [newEntityImageUrl, setNewEntityImageUrl] = useState('');
    const [newEntityDescription, setNewEntityDescription] = useState('');
    const [formError, setFormError] = useState('');
    const [aceResult, setAceResult] = useState(null);
    const [newEntityStage, setNewEntityStage] = useState([]);
    const [newEntitySize, setNewEntitySize] = useState([]);
    const [newEntityIndustry, setNewEntityIndustry] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiQuestions, setAiQuestions] = useState([]);
    const [aiAnswers, setAiAnswers] = useState({});
    const [creationLoading, setCreationLoading] = useState(false);

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
                setModalConfig({ type: 'startup', isOpen: true, mode: 'select_entity' });
            }
        } else if (type === 'business') {
            if (businesses.length === 0) {
                setModalConfig({ type: 'business', isOpen: true, mode: 'create_prompt' });
            } else {
                setModalConfig({ type: 'business', isOpen: true, mode: 'select_entity' });
            }
        }
    };

    const handleModalConfirm = () => {
        if (modalConfig?.type === 'startup') navigate('/investor/discover'); // Changed to discover as investor/dashboard usually means portfolio, or maybe just close modal, wait, let's just close modal for now since they don't have one and must create one. Wait, the original code navigated to /investor/dashboard or /dashboard. We can just keep it. Actually, if they have 0, maybe route them to the dashboard anyway, or close. Let's keep original routing.
        else if (modalConfig?.type === 'business') navigate('/dashboard');

        setModalConfig(null);
    };

    const handleWorkspaceSelect = (entityType, entityId) => {
        const path = entityType === 'startup' ? '/investor/dashboard' : '/dashboard';
        navigate(path, { state: { workspaceId: entityId, workspaceType: entityType } });
        setModalConfig(null);
    };

    const handleModalClose = () => {
        setModalConfig(null);
        resetForm();
    };

    const resetForm = () => {
        setNewEntityName('');
        setNewEntityImageUrl('');
        setNewEntityDescription('');
        setNewEntityStage([]);
        setNewEntitySize([]);
        setNewEntityIndustry([]);
        setAiQuestions([]);
        setAiAnswers({});
        setIsAiLoading(false);
        setCreationLoading(false);
        setFormError('');
        setAceResult(null);
    };

    const handleCreateEntity = async (type, isNewbie = false, aceData = null) => {
        setFormError('');
        setCreationLoading(true);
        try {
            if (type === 'startup') {
                if (!newEntityName || newEntityIndustry.length === 0) throw new Error("Name and at least one Industry are required");
                const payload = {
                    name: newEntityName,
                    created_by: user.id
                };

                // Add the new enhanced fields if they exist
                if (newEntityImageUrl) payload.image_url = newEntityImageUrl;
                if (newEntityDescription) payload.description = newEntityDescription;
                if (newEntityStage.length > 0) payload.stage = newEntityStage;
                if (newEntitySize.length > 0) payload.size = newEntitySize;
                if (newEntityIndustry.length > 0) payload.industry = newEntityIndustry;

                // Add the ACE score and eval
                if (aceData) {
                    payload.ace_score = aceData.score;
                    payload.ace_evaluation = aceData.evaluation;
                }

                const { data, error } = await supabase.from('startups').insert([payload]).select().single();
                if (error) throw error;

                // Make them owner
                await supabase.from('startup_members').insert([
                    { startup_id: data.id, user_id: user.id, role: 'Owner' }
                ]);

                resetForm();
                handleWorkspaceSelect('startup', data.id);
            } else {
                if (!newEntityName) throw new Error("Business Name is required");
                const { data, error } = await supabase.from('businesses').insert([
                    { name: newEntityName, created_by: user.id, status: 'Approved' } // Auto approve for demo
                ]).select().single();
                if (error) throw error;

                resetForm();
                handleWorkspaceSelect('business', data.id);
            }
        } catch (error) {
            console.error(error);
            setFormError(error.message || "An error occurred");
        } finally {
            setCreationLoading(false);
        }
    };

    const triggerPuterAi = async () => {
        setIsAiLoading(true);
        try {
            if (!window.puter) {
                throw new Error("Puter AI is not loaded.");
            }
            const prompt = `You are a startup advisor. The user wants to register a new startup. Generate 5 short, critical questions you would ask a newbie startup founder to help them crystallize their idea before registration regarding their market fit, monetization, and differentiation. Return ONLY a valid JSON array of strings, e.g. ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"].`;

            const aiPromise = window.puter.ai.chat(prompt); // Default faster model
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), 10000));

            const response = await Promise.race([aiPromise, timeoutPromise]);

            let textResponse = response;
            if (typeof response === 'object' && response !== null) {
                textResponse = response.text || response.message?.content || JSON.stringify(response);
            }

            let questionsObject;
            try {
                // Try to extract JSON from response if puter returns weird formatting
                const jsonMatch = textResponse.match(/\[.*\]/s);
                questionsObject = JSON.parse(jsonMatch ? jsonMatch[0] : textResponse);
                if (!Array.isArray(questionsObject)) throw new Error("Not array");
            } catch (e) {
                // Fallback questions if AI fails formatting
                questionsObject = [
                    "What specific problem does your startup solve?",
                    "Who is your target customer and how big is the market?",
                    "How will your company make money?",
                    "Who are your main competitors and how are you different?",
                    "What is your timeline for launching a minimum viable product (MVP)?"
                ];
            }
            setAiQuestions(questionsObject);
            setModalConfig({ ...modalConfig, mode: 'create_startup_newbie' });
        } catch (error) {
            console.error("AI Generation Error", error);
            // If AI is entirely down or timed out, gracefully fallback instead of blocking the user
            setAiQuestions([
                "What specific problem does your startup solve?",
                "Who is your target customer and how big is the market?",
                "How will your company make money?",
                "Who are your main competitors and how are you different?",
                "What is your timeline for launching a minimum viable product (MVP)?"
            ]);
            setModalConfig({ ...modalConfig, mode: 'create_startup_newbie' });
        } finally {
            setIsAiLoading(false);
        }
    };

    const evaluateAndCreateStartup = async () => {
        setFormError('');
        if (!newEntityName || newEntityIndustry.length === 0) {
            setFormError("Please provide both a Startup Name and at least one Industry.");
            return;
        }

        setCreationLoading(true);

        // ULTIMATE SAFEGUARD: Force UI unlock after 20 seconds.
        const emergencyUnlock = setTimeout(() => {
            setCreationLoading(false);
        }, 20000);

        try {
            if (!window.puter) throw new Error("Puter AI is not loaded.");

            // Formatting Q&A for the AI
            let qaText = "";
            aiQuestions.forEach((q, idx) => {
                qaText += `Q: ${q}\nA: ${aiAnswers[idx] || 'No answer provided'}\n\n`;
            });

            const prompt = `You are an expert VC evaluating a startup named "${newEntityName}" in the industries "${newEntityIndustry.join(', ')}".
Review the following Q&A from the founder:
${qaText}
Provide a JSON response evaluating their potential for commercial excellence. Return exactly this JSON structure: 
{ 
    "ace_score": <an integer between 0 and 100 representing commercial viability>,
    "evaluation": "<a brief 2-3 sentence summary of your feedback>"
}`;

            let evalData = { ace_score: 50, evaluation: "Evaluation skipped due to a timeout or parsing issue, but your startup was created successfully!" };

            try {
                // Add a 10-second timeout safeguard just in case it hangs
                const aiPromise = window.puter.ai.chat(prompt); // Use default fast model to prevent hanging
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), 10000));

                const response = await Promise.race([aiPromise, timeoutPromise]);

                let textResponse = response;
                if (typeof response === 'object' && response !== null) {
                    textResponse = response.text || response.message?.content || JSON.stringify(response);
                }

                const jsonMatch = textResponse.match(/\{.*\}/s);
                const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textResponse);
                if (typeof parsed.ace_score === 'number') {
                    evalData = parsed;
                }
            } catch (e) {
                console.warn("AI Evaluation failed, proceeding with default score.", e);
            }

            // Show result modal instead of creating directly
            setAceResult(evalData);
            setCreationLoading(false);
            setModalConfig({ ...modalConfig, mode: 'startup_ace_result' });
        } catch (error) {
            console.error("Evaluation error:", error);
            setFormError(error.message || "An error occurred during evaluation");
            setCreationLoading(false);
        } finally {
            clearTimeout(emergencyUnlock);
        }
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
                        Ace<span className="text-[#85BB65]">Up</span>
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
                    </div>
                </div>
            </main>

            {/* Create Startup Type Prompt: Newbie vs Experienced */}
            {modalConfig?.isOpen && modalConfig.mode === 'create_prompt_type' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative text-center">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">Create New Startup</h3>
                            <button onClick={handleModalClose} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-gray-400 mb-8">Before we begin, how would you describe your experience level with creating startups?</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={triggerPuterAi}
                                disabled={isAiLoading}
                                className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl transition-all flex flex-col items-center gap-3 group text-center disabled:opacity-50"
                            >
                                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                    {isAiLoading ? (
                                        <svg className="animate-spin w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">I'm a Newbie</h4>
                                    <p className="text-xs text-gray-400">Get guided AI assistance</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setModalConfig({ ...modalConfig, mode: 'create_startup_experienced' })}
                                disabled={isAiLoading}
                                className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl transition-all flex flex-col items-center gap-3 group text-center disabled:opacity-50"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">I'm Experienced</h4>
                                    <p className="text-xs text-gray-400">Skip to direct registration</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
                                onClick={() => setModalConfig({ ...modalConfig, mode: modalConfig.type === 'startup' ? 'create_prompt_type' : 'create_business' })}
                                className="flex-1 px-4 py-3 bg-[#85BB65] hover:bg-[#74a856] text-[#0f1729] rounded-xl transition-colors font-bold shadow-lg shadow-[#85BB65]/20"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Startup Experienced Modal */}
            {modalConfig?.isOpen && modalConfig.mode === 'create_startup_experienced' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">Startup Details</h3>
                            <button onClick={handleModalClose} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {formError && <div className="text-red-400 text-sm mb-4 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{formError}</div>}

                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Startup Name</label>
                                    <input
                                        type="text"
                                        value={newEntityName}
                                        onChange={(e) => setNewEntityName(e.target.value)}
                                        placeholder="e.g. Acme Corp"
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Logo URL (Optional)</label>
                                    <input
                                        type="text"
                                        value={newEntityImageUrl}
                                        onChange={(e) => setNewEntityImageUrl(e.target.value)}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                    <textarea
                                        value={newEntityDescription}
                                        onChange={(e) => setNewEntityDescription(e.target.value)}
                                        placeholder="Briefly describe what your startup does..."
                                        rows="3"
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <hr className="border-white/10 my-4" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Stage Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Startup Stage</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                        {['Idea', 'Product or prototype', 'Go to market', 'Growth and expansion'].map(stg => (
                                            <label key={stg} className="flex items-center space-x-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-4 w-4 bg-white/5 border-white/20 rounded text-blue-500 focus:ring-blue-500"
                                                    checked={newEntityStage.includes(stg)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setNewEntityStage([...newEntityStage, stg]);
                                                        else setNewEntityStage(newEntityStage.filter(s => s !== stg));
                                                    }}
                                                />
                                                <span className="text-gray-300 group-hover:text-white transition-colors text-sm">{stg}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {/* Industries Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Industries</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                        {['Advertising', 'Agriculture', 'Blockchain', 'Consumer Goods', 'Education', 'Energy & Greentech', 'Fashion & Living', 'Fintech', 'Food & Beverage', 'Gaming', 'Healthcare & Life Science'].map(ind => (
                                            <label key={ind} className="flex items-center space-x-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-4 w-4 bg-white/5 border-white/20 rounded text-blue-500 focus:ring-blue-500"
                                                    checked={newEntityIndustry.includes(ind)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setNewEntityIndustry([...newEntityIndustry, ind]);
                                                        else setNewEntityIndustry(newEntityIndustry.filter(i => i !== ind));
                                                    }}
                                                />
                                                <span className="text-gray-300 group-hover:text-white transition-colors text-sm">{ind}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleCreateEntity('startup', false)}
                            disabled={creationLoading}
                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            {creationLoading ? 'Creating...' : 'Create Startup'}
                        </button>
                    </div>
                </div>
            )}

            {/* Create Startup Newbie Modal */}
            {modalConfig?.isOpen && modalConfig.mode === 'create_startup_newbie' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-white">AI Setup Guide</h3>
                                <div className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full border border-purple-500/30">
                                    Puter AI
                                </div>
                            </div>
                            <button onClick={handleModalClose} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {formError && <div className="text-red-400 text-sm mb-4 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{formError}</div>}

                        <p className="text-gray-400 mb-8">Our AI Advisor has generated a few critical questions to help you refine your startup's vision before creation.</p>

                        <div className="space-y-6 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-purple-200 mb-1">Startup Name</label>
                                    <input
                                        type="text"
                                        value={newEntityName}
                                        onChange={(e) => setNewEntityName(e.target.value)}
                                        placeholder="Name your idea"
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-purple-200 mb-1">Logo URL (Optional)</label>
                                    <input
                                        type="text"
                                        value={newEntityImageUrl}
                                        onChange={(e) => setNewEntityImageUrl(e.target.value)}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-purple-200 mb-1">Description</label>
                                    <textarea
                                        value={newEntityDescription}
                                        onChange={(e) => setNewEntityDescription(e.target.value)}
                                        placeholder="Briefly describe what your startup does..."
                                        rows="3"
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            {/* New categories for Newbie */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Stage Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-purple-200 mb-2">Startup Stage</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                        {['Idea', 'Product or prototype', 'Go to market', 'Growth and expansion'].map(stg => (
                                            <label key={stg} className="flex items-center space-x-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-4 w-4 bg-white/5 border-white/20 rounded text-purple-500 focus:ring-purple-500"
                                                    checked={newEntityStage.includes(stg)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setNewEntityStage([...newEntityStage, stg]);
                                                        else setNewEntityStage(newEntityStage.filter(s => s !== stg));
                                                    }}
                                                />
                                                <span className="text-gray-300 group-hover:text-white transition-colors text-sm">{stg}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {/* Industries Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-purple-200 mb-2">Industries</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                        {['Advertising', 'Agriculture', 'Blockchain', 'Consumer Goods', 'Education', 'Energy & Greentech', 'Fashion & Living', 'Fintech', 'Food & Beverage', 'Gaming', 'Healthcare & Life Science'].map(ind => (
                                            <label key={ind} className="flex items-center space-x-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-4 w-4 bg-white/5 border-white/20 rounded text-purple-500 focus:ring-purple-500"
                                                    checked={newEntityIndustry.includes(ind)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setNewEntityIndustry([...newEntityIndustry, ind]);
                                                        else setNewEntityIndustry(newEntityIndustry.filter(i => i !== ind));
                                                    }}
                                                />
                                                <span className="text-gray-300 group-hover:text-white transition-colors text-sm">{ind}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="border border-white/10 rounded-xl p-4 bg-purple-500/5">
                                <h4 className="text-purple-300 font-bold mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    AI Evaluator Questionnaire
                                </h4>
                                <div className="space-y-4">

                                    {aiQuestions.map((q, idx) => (
                                        <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <label className="block text-sm font-medium text-purple-300 mb-2">
                                                <span className="text-purple-500 mr-2">Q{idx + 1}.</span> {q}
                                            </label>
                                            <textarea
                                                value={aiAnswers[idx] || ''}
                                                onChange={(e) => setAiAnswers({ ...aiAnswers, [idx]: e.target.value })}
                                                placeholder="Your answer..."
                                                rows={2}
                                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={evaluateAndCreateStartup}
                            disabled={creationLoading}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-all font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {creationLoading ? (
                                <>
                                    <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Evaluating Answers & Launching...
                                </>
                            ) : (
                                <>
                                    AI Evaluate & Launch Startup
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
            {/* ACE Score Result Modal */}
            {modalConfig?.isOpen && modalConfig.mode === 'startup_ace_result' && aceResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                                {aceResult.ace_score || 50}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Your ACE Score</h3>
                        <p className="text-gray-400 mb-6 text-sm">
                            {aceResult.evaluation || "Evaluation completed."}
                        </p>

                        <div className="bg-black/30 rounded-xl p-4 mb-8 border border-white/5 text-left">
                            <h4 className="text-sm font-semibold text-purple-300 mb-2">What happens next?</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Your startup is ready to be launched. Once created, it will be added to your Investor Dashboard where you can manage its details, metrics, and team. Do you want to proceed and create "{newEntityName}"?
                            </p>
                        </div>

                        {formError && <div className="text-red-400 text-sm mb-4 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{formError}</div>}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setModalConfig({ ...modalConfig, mode: 'create_startup_newbie' })}
                                disabled={creationLoading}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-colors font-medium disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => handleCreateEntity('startup', true, { score: aceResult.ace_score, evaluation: aceResult.evaluation })}
                                disabled={creationLoading}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-all font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {creationLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>Create Startup <span className="text-lg">✨</span></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Business Modal */}
            {modalConfig?.isOpen && modalConfig.mode === 'create_business' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">Business Details</h3>
                            <button onClick={handleModalClose} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    value={newEntityName}
                                    onChange={(e) => setNewEntityName(e.target.value)}
                                    placeholder="e.g. Bob's Burgers"
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#85BB65]/50"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => handleCreateEntity('business', false)}
                            disabled={creationLoading}
                            className="w-full py-3 bg-[#85BB65] hover:bg-[#74a856] text-[#0f1729] rounded-xl transition-colors font-bold shadow-lg shadow-[#85BB65]/20 disabled:opacity-50"
                        >
                            {creationLoading ? 'Creating...' : 'Create Business'}
                        </button>
                    </div>
                </div>
            )}

            {/* Workspace Select Modal */}
            {modalConfig?.isOpen && modalConfig.mode === 'select_entity' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1A2238] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">Select {modalConfig.type === 'startup' ? 'Startup' : 'Business'}</h3>
                            <button onClick={handleModalClose} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Startups List */}
                            {modalConfig.type === 'startup' && (
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
                                    <button
                                        onClick={() => setModalConfig({ ...modalConfig, mode: 'create_prompt_type' })}
                                        className="w-full text-center px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-bold transition-all mt-4"
                                    >
                                        + Create New Startup
                                    </button>
                                </div>
                            )}

                            {/* Businesses List */}
                            {modalConfig.type === 'business' && (
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
                                    <button
                                        onClick={() => setModalConfig({ ...modalConfig, mode: 'create_business' })}
                                        className="w-full text-center px-4 py-3 bg-[#85BB65]/10 hover:bg-[#85BB65]/20 text-[#85BB65] border border-[#85BB65]/30 rounded-xl font-bold transition-all mt-4"
                                    >
                                        + Create New Business
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
