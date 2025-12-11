'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Users, Search, Mail, Phone, Store, Calendar, Crown,
    MoreVertical, Eye, Ban, CheckCircle, XCircle
} from 'lucide-react';

interface Seller {
    id: string;
    name: string;
    email: string;
    avatar: string;
    phone: string;
    role: string;
    plan: { name: string } | null;
    created_at: string;
    stores: { id: string; name: string; status: string }[];
}

export default function AdminSellersPage() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSellers();
    }, []);

    const fetchSellers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id, name, email, avatar, phone, role, created_at,
                    plan:plans(name),
                    stores(id, name, status)
                `)
                .eq('role', 'seller')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSellers(data || []);
        } catch (error) {
            console.error('Error fetching sellers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSellers = sellers.filter(seller =>
        seller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Sellers</h1>
                    <p className="text-mocha-500">Manage seller accounts and their stores</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex-1 relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                <input
                    type="text"
                    placeholder="Search sellers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 shadow-sm"
                />
            </div>

            {/* Sellers Table */}
            <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredSellers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-mocha-500">
                        <Users className="w-12 h-12 mb-3 opacity-50" />
                        <p className="font-medium">No sellers found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-mocha-100 bg-mocha-50">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Seller</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Contact</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Plan</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Stores</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Joined</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-mocha-100">
                                {filteredSellers.map((seller) => (
                                    <tr key={seller.id} className="hover:bg-mocha-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={seller.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.email}`}
                                                    alt={seller.name}
                                                    className="w-10 h-10 rounded-xl object-cover"
                                                />
                                                <div>
                                                    <p className="font-medium text-mocha-900">{seller.name}</p>
                                                    <p className="text-sm text-mocha-500">{seller.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-mocha-600">
                                                <Phone className="w-4 h-4" />
                                                <span className="text-sm">{seller.phone || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${seller.plan?.name === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                                                    seller.plan?.name === 'Pro' ? 'bg-blue-100 text-blue-700' :
                                                        seller.plan?.name === 'Growth' ? 'bg-green-100 text-green-700' :
                                                            'bg-mocha-100 text-mocha-700'
                                                }`}>
                                                {seller.plan?.name !== 'Starter' && <Crown className="w-3 h-3" />}
                                                {seller.plan?.name || 'Starter'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Store className="w-4 h-4 text-mocha-400" />
                                                <span className="text-sm text-mocha-700">{seller.stores?.length || 0} stores</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-mocha-500">{formatDate(seller.created_at)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
