'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppSelector } from '@/store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthModal from '@/components/auth/AuthModal';
import { MessageCircle, Search, Send, Store, User, Clock, ChevronRight } from 'lucide-react';

interface Conversation {
    id: string;
    subject: string;
    status: 'open' | 'closed' | 'pending';
    updated_at: string;
    store: {
        id: string;
        name: string;
        logo: string | null;
    } | null;
    last_message: {
        content: string;
        created_at: string;
        is_read: boolean;
        sender_role: string;
    } | null;
}

interface Message {
    id: string;
    content: string;
    sender_role: 'user' | 'store' | 'admin' | 'seller';
    created_at: string;
    is_read: boolean;
}

export default function MessagesPage() {
    const router = useRouter();
    const { currentUser, isAuthenticated } = useAppSelector((state) => state.user);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Auth Check
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            setAuthModalOpen(true);
        }
    }, [isAuthenticated, loading]);

    // Fetch Conversations
    useEffect(() => {
        async function fetchConversations() {
            if (!currentUser) return;

            try {
                // Fetch conversations where user_id is current user
                const { data, error } = await supabase
                    .from('conversations')
                    .select(`
                        id,
                        subject,
                        status,
                        updated_at,
                        store:stores (
                            id,
                            name,
                            logo
                        )
                    `)
                    .eq('user_id', currentUser.id)
                    .order('updated_at', { ascending: false });

                if (error) throw error;

                // For each conversation, fetch last message (could be optimized)
                const convsWithLastMsg = await Promise.all((data || []).map(async (conv: any) => {
                    const { data: msgData } = await supabase
                        .from('messages')
                        .select('content, created_at, is_read, sender_role')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    return {
                        ...conv,
                        store: conv.store, // mapped correctly
                        last_message: msgData || null
                    };
                }));

                setConversations(convsWithLastMsg);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching conversations:', err);
                setLoading(false);
            }
        }

        if (currentUser) {
            fetchConversations();
        } else {
            setLoading(false); // Stop loading if no user pending auth
        }
    }, [currentUser]);

    // Fetch Messages when conversation selected
    useEffect(() => {
        async function fetchMessages(convId: string) {
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', convId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setMessages(data || []);

                // Mark as read (optional, complex with RLS usually)
            } catch (err) {
                console.error(err);
            }
        }

        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
            // Subscribe to realtime messages
            const channel = supabase
                .channel(`conversation:${selectedConversation.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversation.id}`
                }, (payload) => {
                    setMessages(prev => [...prev, payload.new as Message]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedConversation]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !currentUser) return;

        setSending(true);
        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: selectedConversation.id,
                    sender_id: currentUser.id,
                    sender_role: 'user',
                    content: newMessage.trim()
                });

            if (error) throw error;

            setNewMessage('');

            // Update conversation updated_at
            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', selectedConversation.id);

        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-mocha-200 border-t-mocha-600 rounded-full animate-spin" />
                </div>
                <Footer />
            </>
        );
    }

    if (!currentUser) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center text-center px-4">
                    <MessageCircle className="w-16 h-16 text-mocha-300 mb-4" />
                    <h2 className="text-2xl font-bold text-mocha-900 mb-2">Login to view messages</h2>
                    <p className="text-mocha-600 mb-6">Please sign in to access your conversations with sellers.</p>
                    <button onClick={() => setAuthModalOpen(true)} className="btn-primary">
                        Sign In
                    </button>
                    <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-12 bg-cloud-100">
                <div className="container-custom h-[calc(100vh-140px)]">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full flex flex-col md:flex-row border border-mocha-100">
                        {/* Conversation List (Sidebar) */}
                        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-mocha-100 bg-mocha-50 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-mocha-100 bg-white">
                                <h2 className="text-xl font-bold text-mocha-900 mb-4 px-2">Messages</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                {conversations.length === 0 ? (
                                    <div className="text-center py-8 px-4">
                                        <div className="w-12 h-12 bg-mocha-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <MessageCircle className="w-6 h-6 text-mocha-400" />
                                        </div>
                                        <p className="text-mocha-600 font-medium">No messages yet</p>
                                        <p className="text-xs text-mocha-400 mt-1">Inquiries sent to sellers will appear here</p>
                                    </div>
                                ) : (
                                    conversations.map(conv => (
                                        <button
                                            key={conv.id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={`w-full text-left p-3 rounded-xl transition-all ${selectedConversation?.id === conv.id ? 'bg-white shadow-md ring-1 ring-mocha-200' : 'hover:bg-white hover:shadow-sm'}`}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Store className="w-4 h-4 text-mocha-500" />
                                                    <span className="font-semibold text-mocha-900 truncate max-w-[140px]">
                                                        {conv.store?.name || 'Store'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-mocha-400 whitespace-nowrap">
                                                    {new Date(conv.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-mocha-800 truncate mb-1">{conv.subject}</p>
                                            <p className="text-xs text-mocha-500 truncate">
                                                {conv.last_message ? (
                                                    <>
                                                        {conv.last_message.sender_role === 'user' ? 'You: ' : ''}
                                                        {conv.last_message.content}
                                                    </>
                                                ) : 'No messages'}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className={`flex-1 flex flex-col bg-white ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                            {selectedConversation ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-mocha-100 flex items-center gap-4 shadow-sm bg-white z-10">
                                        <button
                                            onClick={() => setSelectedConversation(null)}
                                            className="md:hidden p-2 -ml-2 hover:bg-mocha-50 rounded-full"
                                        >
                                            <ChevronRight className="w-5 h-5 rotate-180" />
                                        </button>

                                        <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold">
                                            {selectedConversation.store?.name?.charAt(0) || 'S'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-mocha-900">
                                                {selectedConversation.store?.name || 'Unknown Store'}
                                            </h3>
                                            <p className="text-xs text-mocha-500 flex items-center gap-1">
                                                {selectedConversation.subject}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Messages List */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cloud-50/50">
                                        {messages.map((msg, i) => {
                                            const isMe = msg.sender_role === 'user';
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm ${isMe
                                                            ? 'bg-mocha-600 text-white rounded-br-none'
                                                            : 'bg-white border border-mocha-100 text-mocha-800 rounded-bl-none'
                                                        }`}>
                                                        <p>{msg.content}</p>
                                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-mocha-200' : 'text-mocha-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-4 border-t border-mocha-100 bg-white">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                placeholder="Type your message..."
                                                className="flex-1 px-4 py-3 rounded-xl border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-500 bg-mocha-50"
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={!newMessage.trim() || sending}
                                                className="p-3 bg-mocha-600 text-white rounded-xl hover:bg-mocha-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-mocha-400 bg-cloud-50/30">
                                    <div className="w-20 h-20 bg-mocha-50 rounded-3xl flex items-center justify-center mb-4">
                                        <MessageCircle className="w-10 h-10 opacity-50" />
                                    </div>
                                    <p className="font-medium">Select a conversation to start chatting</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
