'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    MessageSquare, Search, Send, User, Store, Clock,
    CheckCircle, Circle, ChevronRight, Loader2
} from 'lucide-react';

interface Conversation {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_email: string;
    sender_role: 'user' | 'seller' | 'admin'; // Based on user role
    subject: string;
    updated_at: string;
    status: string;
    unread_count?: number;
}

interface ThreadMessage {
    id: string;
    content: string;
    sender_role: 'user' | 'admin';
    created_at: string;
}

export default function AdminMessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyText, setReplyText] = useState('');
    const [adminId, setAdminId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Get admin ID from session
        const adminSession = localStorage.getItem('gocart_admin_session');
        if (adminSession) {
            try {
                const session = JSON.parse(adminSession);
                setAdminId(session.id);
            } catch (e) {
                console.error('Invalid admin session');
            }
        }
        fetchConversations();

        // Subscribe to new messages to refresh conversation list
        const channel = supabase
            .channel('admin_conversations')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchThreadMessages(selectedConversation);

            // Subscribe to real-time messages
            const channel = supabase
                .channel(`admin_msgs:${selectedConversation}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversation}`
                }, (payload) => {
                    setThreadMessages(prev => [...prev, payload.new as ThreadMessage]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedConversation]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [threadMessages]);

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    id, subject, status, updated_at,
                    user:users(id, name, email, role)
                `)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            // Map to local interface
            const formatted: Conversation[] = (data || []).map((c: any) => ({
                id: c.id,
                sender_id: c.user?.id,
                sender_name: c.user?.name || 'Unknown User',
                sender_email: c.user?.email,
                sender_role: c.user?.role || 'user',
                subject: c.subject,
                updated_at: c.updated_at,
                status: c.status
            }));

            setConversations(formatted);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchThreadMessages = async (conversationId: string) => {
        setLoadingMessages(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setThreadMessages(data as ThreadMessage[]);
        } catch (error) {
            console.error('Error fetching thread:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedConversation || !adminId) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    {
                        conversation_id: selectedConversation,
                        sender_id: adminId,
                        sender_role: 'admin',
                        content: replyText.trim()
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setThreadMessages([...threadMessages, data]);
                setReplyText('');

                // Update conversation timestamp
                await supabase
                    .from('conversations')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', selectedConversation);

                // Refresh list
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending reply:', error);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const currentChat = conversations.find(c => c.id === selectedConversation);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-mocha-900">Messages</h1>
                <p className="text-mocha-500">Manage customer and seller inquiries</p>
            </div>

            <div className="h-[calc(100vh-200px)] grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Panel */}
                <div className="lg:col-span-1 bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    {/* Search */}
                    <div className="p-4 border-b border-mocha-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 text-sm"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-mocha-400" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-mocha-500">
                                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No messages found</p>
                            </div>
                        ) : (
                            filteredConversations.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => setSelectedConversation(chat.id)}
                                    className={`w-full p-4 text-left border-b border-mocha-50 transition-colors hover:bg-mocha-50 ${selectedConversation === chat.id ? 'bg-mocha-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${chat.sender_role === 'seller' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {chat.sender_role === 'seller' ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-mocha-900 truncate">{chat.sender_name}</span>
                                                <span className="text-xs text-mocha-400 whitespace-nowrap ml-2">{formatDate(chat.updated_at).split(',')[0]}</span>
                                            </div>
                                            <p className="text-sm text-mocha-600 truncate font-medium">{chat.subject}</p>
                                            <p className="text-xs text-mocha-400 truncate mt-0.5">{chat.sender_email}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="lg:col-span-2 bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    {selectedConversation && currentChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-mocha-100 flex items-center justify-between bg-mocha-50/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentChat.sender_role === 'seller' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {currentChat.sender_role === 'seller' ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-mocha-900">{currentChat.sender_name}</h3>
                                        <p className="text-xs text-mocha-500">{currentChat.sender_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${currentChat.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {currentChat.status}
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-mocha-50/30">
                                {loadingMessages ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="w-8 h-8 animate-spin text-mocha-400" />
                                    </div>
                                ) : (
                                    threadMessages.map((msg) => {
                                        const isAdmin = msg.sender_role === 'admin';
                                        return (
                                            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                                    <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${isAdmin
                                                        ? 'bg-mocha-600 text-white rounded-tr-sm'
                                                        : 'bg-white border border-mocha-200 text-mocha-800 rounded-tl-sm'
                                                        }`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-xs text-mocha-400 mt-1 px-1">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Input */}
                            <div className="p-4 bg-white border-t border-mocha-100">
                                <form onSubmit={handleReply} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!replyText.trim()}
                                        className="px-4 py-3 bg-mocha-600 hover:bg-mocha-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-mocha-400 p-8">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-medium text-lg">Select a conversation</p>
                            <p className="text-sm">Choose a thread from the list to view and reply.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
