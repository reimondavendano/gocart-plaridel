'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Users, Search, Mail, Phone, Store, Calendar, Crown,
    Eye, Ban, CheckCircle, XCircle, X, MapPin, Package,
    ShoppingCart, Star, DollarSign, TrendingUp, User, CreditCard
} from 'lucide-react';

interface Seller {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    phone?: string | null;
    role: string;
    plan: { id: string; name: string; price: number } | null;
    created_at: string;
    stores: { id: string; name: string; slug: string; status: string; total_products: number; total_sales: number; rating: number }[];
    address?: {
        complete_address: string;
        city: { name: string } | null;
        barangay: { name: string } | null;
    } | null;
    // Calculated stats
    total_revenue?: number;
    total_orders?: number;
}

export default function AdminSellersPage() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'stores' | 'plan' | 'analytics'>('profile');

    useEffect(() => {
        fetchSellers();
    }, []);

    const fetchSellers = async () => {
        try {
            // Fetch users with role 'seller'
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select(`
                    id, email, role, created_at,
                    stores(id, name, slug, status, total_products, total_sales, rating)
                `)
                .eq('role', 'seller')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Fetch profile data for each seller
            const sellersWithProfiles = await Promise.all((usersData || []).map(async (user: any) => {
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select(`
                        name, avatar, phone, 
                        plan:plans(id, name, price),
                        address:addresses(
                            complete_address,
                            city:cities(name),
                            barangay:barangays(name)
                        )
                    `)
                    .eq('user_id', user.id)
                    .single();

                // Calculate revenue from orders
                let total_revenue = 0;
                let total_orders = 0;

                if (user.stores && user.stores.length > 0) {
                    const storeIds = user.stores.map((s: any) => s.id);
                    const { data: ordersData } = await supabase
                        .from('orders')
                        .select('total')
                        .in('store_id', storeIds)
                        .eq('payment_status', 'paid');

                    if (ordersData) {
                        total_revenue = ordersData.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
                        total_orders = ordersData.length;
                    }
                }

                const planData = profileData?.plan;
                const plan = planData
                    ? (Array.isArray(planData) ? (planData.length > 0 ? planData[0] : null) : planData)
                    : null;

                const addressData = profileData?.address;
                const address = addressData
                    ? (Array.isArray(addressData) ? (addressData.length > 0 ? addressData[0] : null) : addressData)
                    : null;

                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at,
                    stores: user.stores || [],
                    name: profileData?.name || 'Unknown',
                    avatar: profileData?.avatar,
                    phone: profileData?.phone,
                    plan,
                    address,
                    total_revenue,
                    total_orders
                };
            }));

            setSellers(sellersWithProfiles as Seller[]);
        } catch (error) {
            console.error('Error fetching sellers:', error);
        } finally {
            setLoading(false);
        }
    };

    const openSellerDetail = (seller: Seller) => {
        setSelectedSeller(seller);
        setActiveTab('profile');
        setShowModal(true);
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return styles[status] || 'bg-mocha-100 text-mocha-700';
    };

    const getPlanBadge = (planName: string | undefined) => {
        switch (planName) {
            case 'Enterprise': return 'bg-purple-100 text-purple-700';
            case 'Pro': return 'bg-blue-100 text-blue-700';
            case 'Growth': return 'bg-green-100 text-green-700';
            default: return 'bg-mocha-100 text-mocha-700';
        }
    };

    // Stats
    const totalSellers = sellers.length;
    const activeSellers = sellers.filter(s => s.stores.some(st => st.status === 'approved')).length;
    const totalRevenue = sellers.reduce((sum, s) => sum + (s.total_revenue || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Sellers</h1>
                    <p className="text-mocha-500">Manage seller accounts and their stores</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{totalSellers}</p>
                            <p className="text-sm text-mocha-500">Total Sellers</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{activeSellers}</p>
                            <p className="text-sm text-mocha-500">Active Sellers</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Store className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">
                                {sellers.reduce((sum, s) => sum + s.stores.length, 0)}
                            </p>
                            <p className="text-sm text-mocha-500">Total Stores</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{formatCurrency(totalRevenue)}</p>
                            <p className="text-sm text-mocha-500">Total Revenue</p>
                        </div>
                    </div>
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
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Revenue</th>
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
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getPlanBadge(seller.plan?.name)}`}>
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
                                            <span className="font-medium text-mocha-900">{formatCurrency(seller.total_revenue || 0)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-mocha-500">{formatDate(seller.created_at)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openSellerDetail(seller)}
                                                className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors"
                                            >
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

            {/* Seller Detail Modal */}
            {showModal && selectedSeller && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-mocha-100 bg-mocha-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img
                                    src={selectedSeller.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedSeller.email}`}
                                    alt={selectedSeller.name}
                                    className="w-12 h-12 rounded-xl object-cover"
                                />
                                <div>
                                    <h2 className="font-bold text-mocha-900">{selectedSeller.name}</h2>
                                    <p className="text-sm text-mocha-500">{selectedSeller.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-mocha-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-mocha-500" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-mocha-100">
                            {(['profile', 'stores', 'plan', 'analytics'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                        ? 'border-mocha-600 text-mocha-900 bg-mocha-50'
                                        : 'border-transparent text-mocha-500 hover:text-mocha-700'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-mocha-900 flex items-center gap-2">
                                                <User className="w-4 h-4 text-mocha-500" /> Personal Information
                                            </h3>
                                            <div className="bg-mocha-50 rounded-xl p-4 space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-mocha-500">Name</span>
                                                    <span className="font-medium text-mocha-900">{selectedSeller.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-mocha-500">Email</span>
                                                    <span className="font-medium text-mocha-900">{selectedSeller.email}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-mocha-500">Phone</span>
                                                    <span className="font-medium text-mocha-900">{selectedSeller.phone || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-mocha-500">Member Since</span>
                                                    <span className="font-medium text-mocha-900">{formatDate(selectedSeller.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-mocha-900 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-mocha-500" /> Address Information
                                            </h3>
                                            <div className="bg-mocha-50 rounded-xl p-4 space-y-3">
                                                {selectedSeller.address ? (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-mocha-500">Address</span>
                                                            <span className="font-medium text-mocha-900 text-right">{selectedSeller.address.complete_address}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-mocha-500">Barangay</span>
                                                            <span className="font-medium text-mocha-900">{selectedSeller.address.barangay?.name || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-mocha-500">City</span>
                                                            <span className="font-medium text-mocha-900">{selectedSeller.address.city?.name || 'N/A'}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-mocha-400 text-center py-4">No address on file</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stores Tab */}
                            {activeTab === 'stores' && (
                                <div className="space-y-4">
                                    {selectedSeller.stores.length === 0 ? (
                                        <div className="text-center py-12 text-mocha-500">
                                            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">No stores yet</p>
                                        </div>
                                    ) : (
                                        selectedSeller.stores.map((store) => (
                                            <div key={store.id} className="bg-mocha-50 rounded-xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-mocha-200 flex items-center justify-center">
                                                        <Store className="w-6 h-6 text-mocha-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-mocha-900">{store.name}</p>
                                                        <p className="text-sm text-mocha-500">/{store.slug}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-center">
                                                        <p className="font-bold text-mocha-900">{store.total_products}</p>
                                                        <p className="text-xs text-mocha-500">Products</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-mocha-900">{store.total_sales}</p>
                                                        <p className="text-xs text-mocha-500">Sales</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                            <span className="font-bold text-mocha-900">{store.rating?.toFixed(1) || '0.0'}</span>
                                                        </div>
                                                        <p className="text-xs text-mocha-500">Rating</p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusBadge(store.status)}`}>
                                                        {store.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Plan Tab */}
                            {activeTab === 'plan' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-mocha-500 to-mocha-700 rounded-xl p-6 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white/80 text-sm">Current Plan</p>
                                                <p className="text-2xl font-bold">{selectedSeller.plan?.name || 'Starter'}</p>
                                            </div>
                                            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                                                <CreditCard className="w-8 h-8" />
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <span className="text-3xl font-bold">{formatCurrency(selectedSeller.plan?.price || 0)}</span>
                                            <span className="text-white/80">/month</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-mocha-50 rounded-xl p-4 text-center">
                                            <Store className="w-8 h-8 text-mocha-400 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-mocha-900">{selectedSeller.stores.length}</p>
                                            <p className="text-sm text-mocha-500">Stores Used</p>
                                        </div>
                                        <div className="bg-mocha-50 rounded-xl p-4 text-center">
                                            <Package className="w-8 h-8 text-mocha-400 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-mocha-900">
                                                {selectedSeller.stores.reduce((sum, s) => sum + s.total_products, 0)}
                                            </p>
                                            <p className="text-sm text-mocha-500">Products Used</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Analytics Tab */}
                            {activeTab === 'analytics' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-mocha-50 rounded-xl p-4 text-center">
                                            <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                            <p className="text-xl font-bold text-mocha-900">{formatCurrency(selectedSeller.total_revenue || 0)}</p>
                                            <p className="text-sm text-mocha-500">Total Revenue</p>
                                        </div>
                                        <div className="bg-mocha-50 rounded-xl p-4 text-center">
                                            <ShoppingCart className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                            <p className="text-xl font-bold text-mocha-900">{selectedSeller.total_orders || 0}</p>
                                            <p className="text-sm text-mocha-500">Total Orders</p>
                                        </div>
                                        <div className="bg-mocha-50 rounded-xl p-4 text-center">
                                            <Package className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                            <p className="text-xl font-bold text-mocha-900">
                                                {selectedSeller.stores.reduce((sum, s) => sum + s.total_products, 0)}
                                            </p>
                                            <p className="text-sm text-mocha-500">Total Products</p>
                                        </div>
                                        <div className="bg-mocha-50 rounded-xl p-4 text-center">
                                            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                                            <p className="text-xl font-bold text-mocha-900">
                                                {selectedSeller.stores.length > 0
                                                    ? (selectedSeller.stores.reduce((sum, s) => sum + (s.rating || 0), 0) / selectedSeller.stores.length).toFixed(1)
                                                    : '0.0'
                                                }
                                            </p>
                                            <p className="text-sm text-mocha-500">Avg Rating</p>
                                        </div>
                                    </div>

                                    <div className="bg-mocha-50 rounded-xl p-4">
                                        <h4 className="font-medium text-mocha-900 mb-3">Performance Summary</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-mocha-600">Average Order Value</span>
                                                <span className="font-medium text-mocha-900">
                                                    {selectedSeller.total_orders
                                                        ? formatCurrency((selectedSeller.total_revenue || 0) / selectedSeller.total_orders)
                                                        : formatCurrency(0)
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-mocha-600">Total Sales (All Stores)</span>
                                                <span className="font-medium text-mocha-900">
                                                    {selectedSeller.stores.reduce((sum, s) => sum + s.total_sales, 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-mocha-600">Account Age</span>
                                                <span className="font-medium text-mocha-900">
                                                    {Math.floor((new Date().getTime() - new Date(selectedSeller.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
