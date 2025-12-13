'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Store, Users, Package, ShoppingCart, TrendingUp,
    DollarSign, Clock, CheckCircle, XCircle, AlertTriangle,
    ArrowUpRight, BarChart3, Star, CreditCard, Ticket,
    MapPin, Eye, Package2
} from 'lucide-react';

interface DashboardStats {
    // Stores
    totalStores: number;
    pendingStores: number;
    approvedStores: number;
    rejectedStores: number;
    // Users
    totalSellers: number;
    totalCustomers: number;
    // Products
    totalProducts: number;
    featuredProducts: number;
    outOfStockProducts: number;
    // Orders
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
    paidOrders: number;
    // Reviews
    averageRating: number;
    totalReviews: number;
    // Categories & Locations
    totalCategories: number;
    totalCities: number;
    totalBarangays: number;
    // Plans
    planSubscribers: { name: string; count: number }[];
}

interface RecentStore {
    id: string;
    name: string;
    seller_name: string;
    status: string;
    created_at: string;
}

interface RecentOrder {
    id: string;
    total: number;
    status: string;
    payment_status: string;
    created_at: string;
    customer_name?: string;
}

interface TopStore {
    id: string;
    name: string;
    rating: number;
    total_sales: number;
    total_revenue: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalStores: 0,
        pendingStores: 0,
        approvedStores: 0,
        rejectedStores: 0,
        totalSellers: 0,
        totalCustomers: 0,
        totalProducts: 0,
        featuredProducts: 0,
        outOfStockProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        totalRevenue: 0,
        paidOrders: 0,
        averageRating: 0,
        totalReviews: 0,
        totalCategories: 0,
        totalCities: 0,
        totalBarangays: 0,
        planSubscribers: []
    });
    const [recentStores, setRecentStores] = useState<RecentStore[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [topStores, setTopStores] = useState<TopStore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Stores counts
            const { count: storesCount } = await supabase.from('stores').select('*', { count: 'exact', head: true });
            const { count: pendingCount } = await supabase.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: approvedCount } = await supabase.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'approved');
            const { count: rejectedCount } = await supabase.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'rejected');

            // Users counts
            const { count: sellersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'seller');
            const { count: customersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer');

            // Products counts
            const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
            const { count: featuredCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_featured', true);
            const { count: outOfStockCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock', 0);

            // Orders data
            const { data: ordersData, count: ordersCount } = await supabase.from('orders').select('total, status, payment_status', { count: 'exact' });
            const totalRevenue = ordersData?.filter(o => o.payment_status === 'paid').reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
            const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0;
            const deliveredOrders = ordersData?.filter(o => o.status === 'delivered').length || 0;
            const paidOrders = ordersData?.filter(o => o.payment_status === 'paid').length || 0;

            // Reviews stats
            const { data: storesWithReviews } = await supabase.from('stores').select('rating, total_reviews');
            const totalReviews = storesWithReviews?.reduce((sum, s) => sum + (s.total_reviews || 0), 0) || 0;
            const avgRating = storesWithReviews && storesWithReviews.length > 0
                ? storesWithReviews.reduce((sum, s) => sum + (s.rating || 0), 0) / storesWithReviews.filter(s => s.rating > 0).length || 0
                : 0;

            // Categories & Locations
            const { count: categoriesCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
            const { count: citiesCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
            const { count: barangaysCount } = await supabase.from('barangays').select('*', { count: 'exact', head: true });

            // Plan subscribers
            const { data: plans } = await supabase.from('plans').select('id, name');
            const planSubscribers = await Promise.all((plans || []).map(async (plan) => {
                const { count } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('plan_id', plan.id);
                return { name: plan.name, count: count || 0 };
            }));

            setStats({
                totalStores: storesCount || 0,
                pendingStores: pendingCount || 0,
                approvedStores: approvedCount || 0,
                rejectedStores: rejectedCount || 0,
                totalSellers: sellersCount || 0,
                totalCustomers: customersCount || 0,
                totalProducts: productsCount || 0,
                featuredProducts: featuredCount || 0,
                outOfStockProducts: outOfStockCount || 0,
                totalOrders: ordersCount || 0,
                pendingOrders,
                deliveredOrders,
                totalRevenue,
                paidOrders,
                averageRating: avgRating,
                totalReviews,
                totalCategories: categoriesCount || 0,
                totalCities: citiesCount || 0,
                totalBarangays: barangaysCount || 0,
                planSubscribers
            });

            // Recent stores with seller info
            const { data: stores } = await supabase
                .from('stores')
                .select('id, name, status, created_at, seller_id')
                .order('created_at', { ascending: false })
                .limit(5);

            if (stores) {
                const storesWithSellers = await Promise.all(stores.map(async (s: any) => {
                    const { data: profile } = await supabase.from('user_profiles').select('name').eq('user_id', s.seller_id).single();
                    return { ...s, seller_name: profile?.name || 'Unknown' };
                }));
                setRecentStores(storesWithSellers);
            }

            // Recent orders with customer info
            const { data: orders } = await supabase
                .from('orders')
                .select('id, total, status, payment_status, created_at, user_id')
                .order('created_at', { ascending: false })
                .limit(5);

            if (orders) {
                const ordersWithCustomers = await Promise.all(orders.map(async (o: any) => {
                    if (o.user_id) {
                        const { data: profile } = await supabase.from('user_profiles').select('name').eq('user_id', o.user_id).single();
                        return { ...o, customer_name: profile?.name };
                    }
                    return { ...o, customer_name: 'Guest' };
                }));
                setRecentOrders(ordersWithCustomers);
            }

            // Top stores by sales
            const { data: topStoresData } = await supabase
                .from('stores')
                .select('id, name, rating, total_sales')
                .eq('status', 'approved')
                .order('total_sales', { ascending: false })
                .limit(5);

            if (topStoresData) {
                const storesWithRevenue = await Promise.all(topStoresData.map(async (store: any) => {
                    const { data: ordersData } = await supabase
                        .from('orders')
                        .select('total')
                        .eq('store_id', store.id)
                        .eq('payment_status', 'paid');
                    const revenue = ordersData?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;
                    return { ...store, total_revenue: revenue };
                }));
                setTopStores(storesWithRevenue);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            approved: 'bg-green-100 text-green-700 border-green-200',
            rejected: 'bg-red-100 text-red-700 border-red-200',
            delivered: 'bg-green-100 text-green-700 border-green-200',
            processing: 'bg-blue-100 text-blue-700 border-blue-200',
            shipped: 'bg-purple-100 text-purple-700 border-purple-200',
            cancelled: 'bg-red-100 text-red-700 border-red-200',
        };
        return styles[status] || 'bg-mocha-100 text-mocha-700 border-mocha-200';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Dashboard</h1>
                    <p className="text-mocha-500">Welcome back! Here's what's happening on GoCart Plaridel.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="bg-white border border-mocha-200 rounded-xl px-4 py-2 text-mocha-700 text-sm focus:outline-none focus:border-mocha-400 shadow-sm">
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                        <option>Last 90 days</option>
                        <option>This year</option>
                    </select>
                </div>
            </div>

            {/* Platform KPIs - Top Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
                            <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
                            <div className="flex items-center gap-1 mt-2">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm">From {stats.paidOrders} paid orders</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Users Overview */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 hover:shadow-lg transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-mocha-500 text-sm font-medium">Total Users</p>
                            <p className="text-2xl font-bold text-mocha-900 mt-1">{stats.totalSellers + stats.totalCustomers}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-mocha-600">{stats.totalSellers} Sellers</span>
                        <span className="text-mocha-400">•</span>
                        <span className="text-mocha-600">{stats.totalCustomers} Customers</span>
                    </div>
                </div>

                {/* Stores Overview */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 hover:shadow-lg transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-mocha-500 text-sm font-medium">Stores</p>
                            <p className="text-2xl font-bold text-mocha-900 mt-1">{stats.totalStores}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mocha-400 to-mocha-600 flex items-center justify-center shadow-lg">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-sm">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{stats.approvedStores} Approved</span>
                        {stats.pendingStores > 0 && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">{stats.pendingStores} Pending</span>
                        )}
                    </div>
                </div>

                {/* Orders Overview */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 hover:shadow-lg transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-mocha-500 text-sm font-medium">Total Orders</p>
                            <p className="text-2xl font-bold text-mocha-900 mt-1">{stats.totalOrders}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-sm">
                        <span className="text-green-600">{stats.deliveredOrders} delivered</span>
                        {stats.pendingOrders > 0 && (
                            <>
                                <span className="text-mocha-400">•</span>
                                <span className="text-yellow-600">{stats.pendingOrders} pending</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Second Row - More Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-white border border-mocha-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-mocha-900">{stats.totalProducts}</p>
                            <p className="text-xs text-mocha-500">Products</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-mocha-900">{stats.averageRating.toFixed(1)}</p>
                            <p className="text-xs text-mocha-500">Avg Rating</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Package2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-mocha-900">{stats.totalCategories}</p>
                            <p className="text-xs text-mocha-500">Categories</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-mocha-900">{stats.totalBarangays}</p>
                            <p className="text-xs text-mocha-500">Barangays</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-mocha-900">{stats.outOfStockProducts}</p>
                            <p className="text-xs text-mocha-500">Out of Stock</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Star className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-mocha-900">{stats.totalReviews}</p>
                            <p className="text-xs text-mocha-500">Reviews</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Distribution */}
            {stats.planSubscribers.length > 0 && (
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-mocha-900">Plan Distribution</h2>
                        <CreditCard className="w-5 h-5 text-mocha-400" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.planSubscribers.map((plan) => (
                            <div key={plan.name} className={`p-4 rounded-xl text-center ${plan.name === 'Enterprise' ? 'bg-purple-50 border border-purple-200' :
                                    plan.name === 'Pro' ? 'bg-blue-50 border border-blue-200' :
                                        plan.name === 'Growth' ? 'bg-green-50 border border-green-200' :
                                            'bg-mocha-50 border border-mocha-200'
                                }`}>
                                <p className="text-2xl font-bold text-mocha-900">{plan.count}</p>
                                <p className="text-sm text-mocha-600">{plan.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Stores */}
                <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-5 border-b border-mocha-100">
                        <h2 className="text-lg font-semibold text-mocha-900">Recent Store Applications</h2>
                        <a href="/admin/stores" className="text-mocha-500 hover:text-mocha-700 text-sm flex items-center gap-1">
                            View all <ArrowUpRight className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="divide-y divide-mocha-100">
                        {recentStores.length === 0 ? (
                            <div className="p-8 text-center text-mocha-500">
                                No store applications yet
                            </div>
                        ) : (
                            recentStores.map((store) => (
                                <div key={store.id} className="p-4 hover:bg-mocha-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-mocha-900">{store.name}</p>
                                            <p className="text-sm text-mocha-500">by {store.seller_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(store.status)}`}>
                                                {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                                            </span>
                                            <p className="text-xs text-mocha-400 mt-1">{formatDate(store.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-5 border-b border-mocha-100">
                        <h2 className="text-lg font-semibold text-mocha-900">Recent Orders</h2>
                        <a href="/admin/orders" className="text-mocha-500 hover:text-mocha-700 text-sm flex items-center gap-1">
                            View all <ArrowUpRight className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="divide-y divide-mocha-100">
                        {recentOrders.length === 0 ? (
                            <div className="p-8 text-center text-mocha-500">
                                No orders yet
                            </div>
                        ) : (
                            recentOrders.map((order) => (
                                <div key={order.id} className="p-4 hover:bg-mocha-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-mocha-900">#{order.id.slice(0, 8)}</p>
                                            <p className="text-sm text-mocha-500">{order.customer_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-mocha-900">{formatCurrency(order.total)}</p>
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border mt-1 ${getStatusBadge(order.status)}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Stores */}
                <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-5 border-b border-mocha-100">
                        <h2 className="text-lg font-semibold text-mocha-900">Top Performing Stores</h2>
                        <a href="/admin/stores" className="text-mocha-500 hover:text-mocha-700 text-sm flex items-center gap-1">
                            View all <ArrowUpRight className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="divide-y divide-mocha-100">
                        {topStores.length === 0 ? (
                            <div className="p-8 text-center text-mocha-500">
                                No stores yet
                            </div>
                        ) : (
                            topStores.map((store, index) => (
                                <div key={store.id} className="p-4 hover:bg-mocha-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-mocha-100 flex items-center justify-center font-bold text-mocha-600">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-mocha-900">{store.name}</p>
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-mocha-600">{store.rating?.toFixed(1) || '0.0'}</span>
                                                </div>
                                                <span className="text-mocha-400">•</span>
                                                <span className="text-mocha-600">{store.total_sales} sales</span>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-green-600">{formatCurrency(store.total_revenue)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-mocha-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <a href="/admin/stores?status=pending" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mocha-50 hover:bg-mocha-100 border border-mocha-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <span className="text-sm font-medium text-mocha-700 text-center">Review Stores</span>
                        {stats.pendingStores > 0 && (
                            <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">{stats.pendingStores}</span>
                        )}
                    </a>
                    <a href="/admin/products" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mocha-50 hover:bg-mocha-100 border border-mocha-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-mocha-700 text-center">Products</span>
                    </a>
                    <a href="/admin/orders" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mocha-50 hover:bg-mocha-100 border border-mocha-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <ShoppingCart className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-mocha-700 text-center">Orders</span>
                    </a>
                    <a href="/admin/coupons" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mocha-50 hover:bg-mocha-100 border border-mocha-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                            <Ticket className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-mocha-700 text-center">Coupons</span>
                    </a>
                    <a href="/admin/locations" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mocha-50 hover:bg-mocha-100 border border-mocha-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                            <MapPin className="w-6 h-6 text-teal-600" />
                        </div>
                        <span className="text-sm font-medium text-mocha-700 text-center">Locations</span>
                    </a>
                    <a href="/admin/analytics" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mocha-50 hover:bg-mocha-100 border border-mocha-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-mocha-700 text-center">Analytics</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
