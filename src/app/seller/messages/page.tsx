'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import {
    Search, Plus, Send, CheckCircle, Clock,
    MessageSquare, MoreVertical, X, Loader2, Store as StoreIcon, User
} from 'lucide-react';

interface Conversation {
    id: string;
    subject: string;
    status: 'open' | 'closed' | 'pending';
    created_at: string;
    updated_at: string;
    user_id: string; // Customer ID (for inquiries) or User ID (for support)
    store_id: string | null;
    product_id: string | null;
    last_message?: string;
    // For Inquiries
    customer?: {
        email: string;
        profile?: {
            name: string;
            avatar: string;
        };
    };
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_role: 'user' | 'admin' | 'seller';
    content: string;
    created_at: string;
    is_read: boolean;
}

export default function SellerMessagesPage() {
    const { currentUser } = useAppSelector((state) => state.user);
    const [activeTab, setActiveTab] = useState<'inquiries' | 'support'>('inquiries');
    const [storeId, setStoreId] = useState<string | null>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Support Modal
    const [isCreating, setIsCreating] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [initialMessage, setInitialMessage] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch Store ID
    useEffect(() => {
        if (currentUser?.id) {
            async function fetchStore() {
                const { data } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('owner_id', currentUser!.id)
                    .single();
                if (data) setStoreId(data.id);
            }
            fetchStore();
        }
    }, [currentUser]);

    // Fetch Conversations
    useEffect(() => {
        if (currentUser?.id) {
            fetchConversations();
        }
    }, [currentUser, activeTab, storeId]);

    // Fetch Messages & Read Status
    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation);
            markAsRead(selectedConversation);

            // Subscribe
            const channel = supabase
                .channel(`seller_msgs:${selectedConversation}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversation}`
                }, (payload) => {
                    setMessages(prev => [...prev, payload.new as Message]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedConversation]);

    // Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        setLoadingConversations(true);
        try {
            let query = supabase
                .from('conversations')
                .select(`
                    *,
                    user:users!user_id(email)
                `) // Basic select, we'll fetch profiles manually if needed or via complicated join
                .order('updated_at', { ascending: false });

            if (activeTab === 'inquiries') {
                if (!storeId) {
                    setConversations([]);
                    setLoadingConversations(false);
                    return;
                }
                // Fetch inquiries for my store
                query = query.eq('store_id', storeId);
            } else {
                // Fetch support threads (my user_id, no store_id or store_id is null? usually just user_id)
                // Existing logic was eq user_id.
                // But wait, if I inquire a store, I AM a user_id too.
                // Support threads should probably be distiguished by Store ID being Null? Or a different flag.
                // Schema has 'store_id'. For Support, store_id is likely NULL if it's User<->Admin.
                query = query.eq('user_id', currentUser!.id).is('store_id', null);
            }

            const { data, error } = await query;
            if (error) throw error;

            // If inquiries, fetch profiles for customers
            let mappedConversations: Conversation[] = [];
            if (data) {
                // Fetch profiles for users in these conversations
                const userIds = data.map((c: any) => c.user_id);
                let profilesMap: Record<string, any> = {};

                if (userIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('user_profiles')
                        .select('user_id, name, avatar')
                        .in('user_id', userIds);

                    profiles?.forEach(p => { profilesMap[p.user_id] = p; });
                }

                mappedConversations = data.map((c: any) => ({
                    ...c,
                    customer: {
                        email: c.user?.email,
                        profile: profilesMap[c.user_id]
                    }
                }));
            }

            setConversations(mappedConversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoadingConversations(false);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        setLoadingMessages(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (data) setMessages(data as Message[]);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const markAsRead = async (conversationId: string) => {
        if (!currentUser) return;

        // If Inquiries: Mark messages from 'user' as read.
        // If Support: Mark messages from 'admin' as read.

        const targetRole = activeTab === 'inquiries' ? 'user' : 'admin';

        try {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .eq('sender_role', targetRole);
        } catch (error) {
            console.error('Error marking read:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !currentUser) return;

        const senderRole = activeTab === 'inquiries' ? 'seller' : 'user';

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    {
                        conversation_id: selectedConversation,
                        sender_id: currentUser.id,
                        sender_role: senderRole,
                        content: newMessage.trim()
                    }
                ])
                .select()
                .single();

            if (data) {
                setMessages([...messages, data as Message]);
                setNewMessage('');

                await supabase
                    .from('conversations')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', selectedConversation);

                // Refresh list to bump to top
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Only for Support tab
    const handleCreateSupportTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject.trim() || !initialMessage.trim() || !currentUser) return;

        try {
            const { data: thread, error: threadError } = await supabase
                .from('conversations')
                .insert([
                    {
                        user_id: currentUser.id,
                        subject: newSubject.trim(),
                        status: 'open',
                        store_id: null // Explicitly null for support
                    }
                ])
                .select()
                .single();

            if (threadError) throw threadError;

            if (thread) {
                const { error: msgError } = await supabase
                    .from('messages')
                    .insert([
                        {
                            conversation_id: thread.id,
                            sender_id: currentUser.id,
                            sender_role: 'user',
                            content: initialMessage.trim()
                        }
                    ]);

                if (msgError) throw msgError;

                setIsCreating(false);
                setNewSubject('');
                setInitialMessage('');
                fetchConversations();
                setSelectedConversation(thread.id);
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
        }
    };

    const currentThread = conversations.find(c => c.id === selectedConversation);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-mocha-100">
                <button
                    onClick={() => { setActiveTab('inquiries'); setSelectedConversation(null); }}
                    className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'inquiries' ? 'border-mocha-600 text-mocha-900 bg-mocha-50' : 'border-transparent text-mocha-500 hover:text-mocha-700'}`}
                >
                    Customer Inquiries
                </button>
                <button
                    onClick={() => { setActiveTab('support'); setSelectedConversation(null); }}
                    className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'support' ? 'border-mocha-600 text-mocha-900 bg-mocha-50' : 'border-transparent text-mocha-500 hover:text-mocha-700'}`}
                >
                    Admin Support
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-mocha-200 bg-white flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-mocha-100 flex items-center justify-between">
                        <h2 className="font-bold text-mocha-900">
                            {activeTab === 'inquiries' ? 'Inquiries' : 'Tickets'}
                        </h2>
                        {activeTab === 'support' && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="p-2 hover:bg-mocha-100 rounded-lg text-mocha-600 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="p-4 border-b border-mocha-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-9 pr-4 py-2 bg-mocha-50 border-transparent focus:bg-white focus:border-mocha-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-mocha-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loadingConversations ? (
                            <div className="flex items-center justify-center py-8 text-mocha-400">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-8 text-mocha-400">
                                <p>No {activeTab === 'inquiries' ? 'inquiries' : 'tickets'} found</p>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv.id)}
                                    className={`w-full text-left p-4 border-b border-mocha-50 hover:bg-mocha-50 transition-colors ${selectedConversation === conv.id ? 'bg-mocha-50 border-l-4 border-l-mocha-600' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-semibold text-sm truncate pr-2 ${selectedConversation === conv.id ? 'text-mocha-900' : 'text-mocha-700'}`}>
                                            {activeTab === 'inquiries'
                                                ? (conv.customer?.profile?.name || conv.customer?.email || 'Customer')
                                                : conv.subject}
                                        </h3>
                                        <span className="text-[10px] text-mocha-400 whitespace-nowrap flex-shrink-0">
                                            {new Date(conv.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-mocha-500 line-clamp-2">
                                        {activeTab === 'inquiries' ? conv.subject : (conv.last_message || 'No messages')}
                                    </p>
                                    {activeTab === 'inquiries' && conv.product_id && (
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-mocha-100 text-mocha-600 text-[10px] rounded-md">
                                            Product Inquiry
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-mocha-50/50 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-6 border-b border-mocha-200 bg-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedConversation(null)}
                                        className="md:hidden p-2 -ml-2 hover:bg-mocha-100 rounded-full text-mocha-500"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h3 className="font-bold text-mocha-900">
                                            {activeTab === 'inquiries'
                                                ? (currentThread?.customer?.profile?.name || currentThread?.customer?.email || 'Customer')
                                                : currentThread?.subject}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-mocha-500">
                                            <span className={`w-2 h-2 rounded-full ${currentThread?.status === 'open' ? 'bg-green-500' : 'bg-mocha-300'}`} />
                                            {currentThread?.status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {messages.map((msg) => {
                                    /* 
                                     Determine alignment:
                                     On 'inquiries' tab: I am 'seller'. So 'seller' msgs are Mine (Right). 'user' msgs are Theirs (Left).
                                     On 'support' tab: I am 'user'. So 'user' msgs are Mine (Right). 'admin' msgs are Theirs (Left).
                                    */
                                    let isMe = false;
                                    if (activeTab === 'inquiries') {
                                        isMe = msg.sender_role === 'seller';
                                    } else {
                                        isMe = msg.sender_role === 'user';
                                    }

                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMe
                                                    ? 'bg-mocha-600 text-white rounded-br-none'
                                                    : 'bg-white text-mocha-800 shadow-sm border border-mocha-100 rounded-bl-none'
                                                }`}>
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-mocha-200' : 'text-mocha-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white border-t border-mocha-200">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 px-4 py-3 bg-mocha-50 border-transparent focus:bg-white focus:border-mocha-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-mocha-500/20"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="px-4 py-2 bg-mocha-600 text-white rounded-xl hover:bg-mocha-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-mocha-400">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a conversation to view messages</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Support Ticket Modal for Admin Tab */}
            {isCreating && activeTab === 'support' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-mocha-100 flex items-center justify-between">
                            <h3 className="font-bold text-mocha-900">New Support Ticket</h3>
                            <button onClick={() => setIsCreating(false)} className="p-1 hover:bg-mocha-100 rounded text-mocha-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSupportTicket} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    className="w-full px-3 py-2 border border-mocha-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha-500"
                                    placeholder="Brief description of the issue"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Message</label>
                                <textarea
                                    value={initialMessage}
                                    onChange={(e) => setInitialMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-mocha-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha-500 h-32 resize-none"
                                    placeholder="Describe your issue in detail..."
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-mocha-600 text-white rounded-xl font-medium hover:bg-mocha-700 transition-colors">
                                Create Ticket
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
