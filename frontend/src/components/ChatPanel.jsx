import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="64" fill="#1A2238"/>
  <circle cx="64" cy="48" r="22" fill="#85BB65" opacity="0.3"/>
  <path d="M64 78c-22 0-40 12-40 27v23h80v-23c0-15-18-27-40-27z" fill="#85BB65" opacity="0.3"/>
</svg>`);

export default function ChatPanel({ isOpen, onClose }) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [sending, setSending] = useState(false);
    const [view, setView] = useState('list'); // 'list' | 'chat' | 'search'
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch conversations on mount
    useEffect(() => {
        if (user?.id && isOpen) {
            fetchConversations();
        }
    }, [user?.id, isOpen]);

    // Subscribe to new messages in active conversation
    useEffect(() => {
        if (!activeConversation) return;

        const channel = supabase
            .channel(`messages:${activeConversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${activeConversation.id}`
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeConversation?.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    function scrollToBottom() {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    async function fetchConversations() {
        // Get all conversation IDs the user participates in
        const { data: participations, error: pErr } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', user.id);

        if (pErr || !participations?.length) {
            setConversations([]);
            return;
        }

        const convIds = participations.map(p => p.conversation_id);

        // Get the other participants in these conversations
        const { data: allParticipants } = await supabase
            .from('conversation_participants')
            .select('conversation_id, user_id')
            .in('conversation_id', convIds)
            .neq('user_id', user.id);

        if (!allParticipants?.length) {
            setConversations([]);
            return;
        }

        const otherUserIds = [...new Set(allParticipants.map(p => p.user_id))];

        // Get profiles of other users
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', otherUserIds);

        const profileMap = {};
        profiles?.forEach(p => { profileMap[p.id] = p; });

        // Get last message for each conversation
        const convWithDetails = await Promise.all(
            convIds.map(async (convId) => {
                const otherUserId = allParticipants.find(p => p.conversation_id === convId)?.user_id;
                const otherProfile = profileMap[otherUserId] || {};

                const { data: lastMsg } = await supabase
                    .from('messages')
                    .select('content, created_at, sender_id')
                    .eq('conversation_id', convId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                return {
                    id: convId,
                    otherUser: otherProfile,
                    lastMessage: lastMsg,
                };
            })
        );

        // Sort by last message time
        convWithDetails.sort((a, b) => {
            const aTime = a.lastMessage?.created_at || '1970-01-01';
            const bTime = b.lastMessage?.created_at || '1970-01-01';
            return new Date(bTime) - new Date(aTime);
        });

        setConversations(convWithDetails);
    }

    async function searchUsers() {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
            .neq('id', user.id)
            .limit(10);

        if (!error && data) {
            setSearchResults(data);
        }
        setSearching(false);
    }

    useEffect(() => {
        const timer = setTimeout(searchUsers, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    async function startConversation(otherUserId) {
        // Check if conversation already exists
        const { data: myConvs } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', user.id);

        if (myConvs?.length) {
            const myConvIds = myConvs.map(c => c.conversation_id);
            const { data: sharedConvs } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', otherUserId)
                .in('conversation_id', myConvIds);

            if (sharedConvs?.length) {
                // Conversation exists, open it
                const convId = sharedConvs[0].conversation_id;
                const otherProfile = searchResults.find(r => r.id === otherUserId)
                    || conversations.find(c => c.otherUser.id === otherUserId)?.otherUser;

                setActiveConversation({ id: convId, otherUser: otherProfile });
                await loadMessages(convId);
                setView('chat');
                setSearchQuery('');
                setSearchResults([]);
                return;
            }
        }

        // Create new conversation
        const { data: newConv, error: convErr } = await supabase
            .from('conversations')
            .insert({})
            .select()
            .single();

        if (convErr) {
            alert('Failed to create conversation');
            return;
        }

        // Add both participants
        await supabase.from('conversation_participants').insert([
            { conversation_id: newConv.id, user_id: user.id },
            { conversation_id: newConv.id, user_id: otherUserId },
        ]);

        const otherProfile = searchResults.find(r => r.id === otherUserId);

        setActiveConversation({ id: newConv.id, otherUser: otherProfile });
        setMessages([]);
        setView('chat');
        setSearchQuery('');
        setSearchResults([]);
        fetchConversations();
    }

    async function loadMessages(conversationId) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setMessages(data);
        }
    }

    async function openConversation(conv) {
        setActiveConversation(conv);
        await loadMessages(conv.id);
        setView('chat');
        setTimeout(() => inputRef.current?.focus(), 200);
    }

    async function sendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || sending) return;

        setSending(true);
        const { error } = await supabase.from('messages').insert({
            conversation_id: activeConversation.id,
            sender_id: user.id,
            content: newMessage.trim(),
        });

        if (!error) {
            setNewMessage('');
        }
        setSending(false);
    }

    function formatTime(dateStr) {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return d.toLocaleDateString([], { weekday: 'short' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Chat Panel */}
            <div className="ml-auto relative w-full max-w-md h-full bg-[#1A2238] border-l border-white/10 flex flex-col shadow-2xl animate-slide-in-right">

                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10 flex-shrink-0">
                    {view === 'chat' ? (
                        <>
                            <button
                                onClick={() => { setView('list'); setActiveConversation(null); }}
                                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <img
                                src={activeConversation?.otherUser?.avatar_url || DEFAULT_AVATAR}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-[#85BB65]/30"
                                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {activeConversation?.otherUser?.full_name || activeConversation?.otherUser?.username || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    @{activeConversation?.otherUser?.username || ''}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 text-[#85BB65]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 className="text-lg font-bold text-white flex-1">Messages</h3>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {view !== 'chat' && (
                    <>
                        {/* Search Bar */}
                        <div className="p-3 border-b border-white/5">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by username..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#85BB65]/30"
                                />
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchQuery.trim() && (
                            <div className="border-b border-white/5 max-h-48 overflow-y-auto">
                                {searching ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No users found</div>
                                ) : (
                                    searchResults.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => startConversation(u.id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                        >
                                            <img
                                                src={u.avatar_url || DEFAULT_AVATAR}
                                                alt=""
                                                className="w-9 h-9 rounded-full object-cover border border-white/10"
                                                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{u.full_name || u.username}</p>
                                                <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                                            </div>
                                            <svg className="w-4 h-4 text-[#85BB65] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Conversation List */}
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 font-medium mb-1">No conversations yet</p>
                                    <p className="text-gray-600 text-sm">Search for a user to start chatting</p>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => openConversation(conv)}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                                    >
                                        <img
                                            src={conv.otherUser?.avatar_url || DEFAULT_AVATAR}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                                            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {conv.otherUser?.full_name || conv.otherUser?.username || 'User'}
                                                </p>
                                                {conv.lastMessage && (
                                                    <span className="text-xs text-gray-600 flex-shrink-0 ml-2">
                                                        {formatTime(conv.lastMessage.created_at)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                {conv.lastMessage
                                                    ? (conv.lastMessage.sender_id === user.id ? 'You: ' : '') + conv.lastMessage.content
                                                    : 'No messages yet'}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* Chat Messages View */}
                {view === 'chat' && activeConversation && (
                    <>
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <p className="text-gray-500 text-sm">Send a message to start the conversation</p>
                                </div>
                            )}
                            {messages.map((msg, i) => {
                                const isMe = msg.sender_id === user.id;
                                return (
                                    <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm break-words ${isMe
                                                    ? 'bg-[#85BB65] text-[#0f1729] rounded-br-md'
                                                    : 'bg-white/10 text-white rounded-bl-md'
                                                }`}
                                        >
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-[#0f1729]/60' : 'text-gray-500'}`}>
                                                {formatTime(msg.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="p-3 border-t border-white/10 flex gap-2 flex-shrink-0">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#85BB65]/30"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="px-4 py-2.5 bg-[#85BB65] text-[#0f1729] rounded-xl font-semibold text-sm hover:bg-[#74a856] transition-colors disabled:opacity-40"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    </>
                )}
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.25s ease-out;
                }
            `}</style>
        </div>
    );
}
