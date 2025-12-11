'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import {
    Search, Plus, Send, CheckCircle, Clock,
    MessageSquare, MoreVertical, X, Loader2
} from 'lucide-react';

interface Conversation {
    id: string;
    subject: string;
    status: 'open' | 'closed' | 'pending';
    created_at: string;
    updated_at: string;
    last_message?: string;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_role: 'user' | 'admin';
    content: string;
    created_at: string;
    is_read: boolean;
}

export default function SellerMessagesPage() {
    const { currentUser } = useAppSelector((state) => state.user);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [initialMessage, setInitialMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentUser?.id) {
            fetchConversations();
        }
    }, [currentUser?.id]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation);
            // Mark as read
            markAsRead(selectedConversation);
        }
    }, [selectedConversation]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', currentUser?.id)
                .order('updated_at', { ascending: false });

            if (data) setConversations(data);
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
        try {
            // Mark messages from admin as read
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .eq('sender_role', 'admin');
        } catch (error) {
            console.error('Error marking read:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !currentUser) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    {
                        conversation_id: selectedConversation,
                        sender_id: currentUser.id,
                        sender_role: 'user',
                        content: newMessage.trim()
                    }
                ])
                .select()
                .single();

            if (data) {
                setMessages([...messages, data as Message]);
                setNewMessage('');

                // Update conversation updated_at
                await supabase
                    .from('conversations')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', selectedConversation);

                fetchConversations(); // Refresh list to update order/timestamps
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleCreateConversation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject.trim() || !initialMessage.trim() || !currentUser) return;

        try {
            // 1. Create conversation
            const { data: thread, error: threadError } = await supabase
                .from('conversations')
                .insert([
                    {
                        user_id: currentUser.id,
                        subject: newSubject.trim(),
                        status: 'open'
                    }
                ])
                .select()
                .single();

            if (threadError) throw threadError;

            if (thread) {
                // 2. Create initial message
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
            console.error('Error creating conversation:', error);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const currentThread = conversations.find(c => c.id === selectedConversation);

    return (
        <div className="h-[calc(100vh-140px)] flex bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Sidebar (List) */}
            <div className="w-80 border-r border-mocha-100 flex flex-col">
                <div className="p-4 border-b border-mocha-100 flex items-center justify-between">
                    <h2 className="font-bold text-mocha-900">Messages</h2>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="p-2 bg-mocha-100 hover:bg-mocha-200 text-mocha-700 rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-mocha-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full pl-9 pr-4 py-2 bg-mocha-50 border border-mocha-200 rounded-lg text-sm text-mocha-900 focus:outline-none focus:border-mocha-400"
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-mocha-400" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-6 text-center text-mocha-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No messages yet</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-2 text-mocha-600 text-sm font-medium hover:underline"
                            >
                                Start a conversation
                            </button>
                        </div>
                    ) : (
                        conversations.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => setSelectedConversation(chat.id)}
                                className={`w-full p-4 text-left border-b border-mocha-50 hover:bg-mocha-50 transition-colors flex flex-col gap-1 ${selectedConversation === chat.id ? 'bg-mocha-50' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-mocha-900 truncate pr-2">{chat.subject}</span>
                                    <span className="text-xs text-mocha-400 whitespace-nowrap">{formatDate(chat.updated_at)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${chat.status === 'open' ? 'bg-green-100 text-green-700' :
                                            chat.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {chat.status}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-mocha-50/30">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-6 py-4 bg-white border-b border-mocha-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-mocha-900">{currentThread?.subject}</h3>
                                <p className="text-xs text-mocha-500 flex items-center gap-1">
                                    Support Ticket #{currentThread?.id.slice(0, 8)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${currentThread?.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {currentThread?.status}
                                </span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loadingMessages ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-mocha-400" />
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_role === 'user';
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                                <div className={`p-4 rounded-2xl ${isMe
                                                        ? 'bg-mocha-600 text-white rounded-tr-sm'
                                                        : 'bg-white border border-mocha-200 text-mocha-800 rounded-tl-sm shadow-sm'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 px-1">
                                                    <span className="text-xs text-mocha-400">{formatTime(msg.created_at)}</span>
                                                    {!isMe && <span className="text-xs font-medium text-mocha-500">Support Team</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-mocha-100">
                            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400 resize-none max-h-32 min-h-[50px]"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-mocha-600 hover:bg-mocha-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-mocha-400">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Select a conversation to start messaging</p>
                    </div>
                )}
            </div>

            {/* Create Conversation Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95">
                        <div className="flex items-center justify-between p-4 border-b border-mocha-100 bg-mocha-50">
                            <h3 className="font-bold text-mocha-900">New Message to Support</h3>
                            <button onClick={() => setIsCreating(false)} className="p-1 hover:bg-mocha-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-mocha-500" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateConversation} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    placeholder="e.g., Order Issue #12345"
                                    className="w-full px-4 py-2 border border-mocha-200 rounded-lg focus:outline-none focus:border-mocha-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Message</label>
                                <textarea
                                    value={initialMessage}
                                    onChange={(e) => setInitialMessage(e.target.value)}
                                    placeholder="Describe your concern..."
                                    className="w-full px-4 py-2 border border-mocha-200 rounded-lg focus:outline-none focus:border-mocha-500 h-32 resize-none"
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
