import React, { useState, useRef, useEffect } from 'react';

const SYSTEM_PROMPT = `You are a registration assistant for the AceUp Technology Park Resident Registration form. You ONLY answer questions about this specific 5-step registration process. If a user asks anything unrelated (general knowledge, coding, weather, etc.), politely say: "I can only help with the Tech Park registration process. What would you like to know about your application?"

THE REGISTRATION PROCESS:
The form begins with a Step 0 where the applicant chooses their type: Individual (Physical Person) or Legal Entity (Company/Organization). Then they proceed through 5 steps:

STEP 1 — Rules and Instructions:
- Eligibility: Applicant must be engaged in innovation or high-tech projects. Project must demonstrate potential for commercialization. Must comply with national and local tech park regulations.
- Submission: All info must be accurate and verifiable. False information leads to immediate rejection. Documents must be PDF, DOCX, JPG, or PNG format.
- Tip: You can "Save as Draft" at any time and return later.

STEP 2 — Applicant Information:
For BOTH types: Full Name (or Full Legal Entity Name) *, Contact Phone *, Email Address *, Website (optional), Current Activity Type *, and Required Licenses section (name, issue date, validity period).
For INDIVIDUALS only: ID Series *, ID Number *, Issue Date, Issuing Authority, Tax Registration Certificate Details.
For LEGAL ENTITIES only: Registration Number *, plus an Authorized Representative section with: Full Name, Phone, Address, Email, ID Document Details.
Fields marked * are required.

STEP 3 — Technology Park Area & Project Details:
Area requirements: Total Area (m²), Building Area (m²), Office Area (m²), Laboratory Area (m²), Warehouse Area (m²), Warehouse Volume (m³), Auxiliary Area (m²), Other Areas (m²).
Innovation/High-Tech Project Details: Project Name *, Project Start Date, Project Duration (e.g. "24 months"), R&D / Prototype / Innovation Details *, New Jobs Created (type and number), Patent / IP Information, Short Project Description.

STEP 4 — Acceptance and Application Statement:
- A checkbox confirming all information is correct and granting the review committee access to evaluate the data (required).
- Applicant Name *, Technology Park Name *, Submission Date *, Digital Signature (type full name).

STEP 5 — Additional Documents:
For LEGAL ENTITIES: State registry extract, Charter/statutes, Authorized representative ID copy.
For INDIVIDUALS: ID document copy, Tax registration certificate.
For BOTH: Business plan / Innovation project plan, License documents (if applicable).
Supported formats: PDF, DOCX, JPG, PNG.

GENERAL TIPS:
- You can navigate Back and Next between steps.
- "Save as Draft" saves progress and you can return later.
- The final step submits the application for review.
- Technology areas covered include ICT, High Technology, and Telecommunications.

Keep answers concise (2-4 sentences max). Be friendly and helpful.`;

export default function RegistrationChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! 👋 I\'m your Tech Park registration assistant. Ask me anything about the application process!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage = { role: 'user', content: trimmed };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            if (!window.puter) throw new Error('Puter AI is not loaded.');

            const chatHistory = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages.filter(m => m.role !== 'system'),
                userMessage
            ];

            const aiPromise = window.puter.ai.chat(chatHistory, { model: 'gpt-4o' });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI_TIMEOUT')), 15000)
            );

            const response = await Promise.race([aiPromise, timeoutPromise]);

            let text = response;
            if (typeof response === 'object' && response !== null) {
                text = response.text || response.message?.content || JSON.stringify(response);
            }

            setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        } catch (err) {
            console.error('Chatbot error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I had trouble connecting. Please try again in a moment.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating AI Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-8 right-8 z-[80] w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen
                    ? 'bg-slate-700 hover:bg-slate-600 rotate-0'
                    : 'bg-[#85BB65] hover:bg-[#74a856] shadow-[#85BB65]/30'
                    }`}
                title="AI Registration Assistant"
            >
                {isOpen ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-28 right-8 z-[80] w-[380px] max-h-[520px] bg-[#1A2238] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3 bg-[#85BB65]/10">
                        <div className="w-9 h-9 rounded-xl bg-[#85BB65]/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#85BB65]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-white">Registration Assistant</h3>
                            <p className="text-[10px] text-[#85BB65] font-medium">Powered by GPT-4o</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ maxHeight: '340px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-[#85BB65] text-[#0f1729] rounded-br-md font-medium'
                                    : 'bg-white/5 text-gray-200 border border-white/5 rounded-bl-md'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-[#85BB65] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-[#85BB65] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-[#85BB65] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about the registration..."
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#85BB65]/50 transition-colors"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !input.trim()}
                                className="p-2.5 bg-[#85BB65] hover:bg-[#74a856] rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-[#85BB65]"
                            >
                                <svg className="w-4 h-4 text-[#0f1729]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
