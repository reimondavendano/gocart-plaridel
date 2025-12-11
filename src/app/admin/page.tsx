'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Store, Users, Package, ShoppingCart, TrendingUp, TrendingDown,
    DollarSign, Eye, Clock, CheckCircle, XCircle, AlertTriangle,
    ArrowUpRight, BarChart3, Activity
} from 'lucide-react';

interface DashboardStats {
    totalStores: number;
    pendingStores: number;
    totalSellers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
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
    created_at: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalStores: 0,
        pendingStores: 0,
        totalSellers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0
    });
    const [recentStores, setRecentStores] = useState<RecentStore[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch stores count
            const { count: storesCount } = await supabase
                .from('stores')
                .select('*', { count: 'exact', head: true });

            // Fetch pending stores count
            const { count: pendingCount } = await supabase
                .from('stores')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // Fetch sellers count
            const { count: sellersCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'seller');

            // Fetch products count
            const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            // Fetch orders
            const { data: ordersData, count: ordersCount } = await supabase
                .from('orders')
                .select('total', { count: 'exact' });

            const totalRevenue = ordersData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;

            setStats({
                totalStores: storesCount || 0,
                pendingStores: pendingCount || 0,
                totalSellers: sellersCount || 0,
                totalProducts: productsCount || 0,
                totalOrders: ordersCount || 0,
                totalRevenue
            });

            // Fetch recent stores with seller info
            const { data: stores } = await supabase
                .from('stores')
                .select(`
                    id, name, status, created_at,
                    seller:users(name)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (stores) {
                setRecentStores(stores.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    seller_name: s.seller?.name || 'Unknown',
                    status: s.status,
                    created_at: s.created_at
                })));
            }

            // Fetch recent orders
            const { data: orders } = await supabase
                .from('orders')
                .select('id, total, status, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            if (orders) {
                setRecentOrders(orders);
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

    const statCards = [
        { label: 'Total Stores', value: stats.totalStores, icon: Store, color: 'from-mocha-500 to-mocha-600', change: '+12%' },
        { label: 'Pending Approval', value: stats.pendingStores, icon: Clock, color: 'from-yellow-500 to-orange-500', urgent: true },
        { label: 'Total Sellers', value: stats.totalSellers, icon: Users, color: 'from-dusk-400 to-dusk-600', change: '+8%' },
        { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'from-blue-500 to-blue-600', change: '+24%' },
        { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'from-green-500 to-green-600', change: '+15%' },
        { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'from-emerald-500 to-emerald-600', change: '+32%' },
    ];

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
                    <p className="text-mocha-500">Welcome back! Here's what's happening with your store.</p>
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white border border-mocha-200 rounded-2xl p-5 hover:shadow-lg transition-all shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-mocha-500 text-sm font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-mocha-900 mt-1">
                                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        {stat.change && (
                            <div className="flex items-center gap-1 mt-3">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-green-600 text-sm font-medium">{stat.change}</span>
                                <span className="text-mocha-400 text-sm">vs last month</span>
                            </div>
                        )}
                        {stat.urgent && stats.pendingStores > 0 && (
                            <div className="flex items-center gap-1 mt-3">
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                <span className="text-yellow-600 text-sm font-medium">Requires attention</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                            <p className="text-sm text-mocha-500">{formatDate(order.created_at)}</p>
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
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-mocha-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/admin/stores?status=pending" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mocha-50 hover:bg-mocha-100 border border-mocha-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <span className="text-sm font-medium text-mocha-700">Review Stores</span>
                    </a>
                    <a href="/admin/products" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mocha-50 hover:bg-mocha-100 border border-mocha-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-mocha-700">Manage Products</span>
                    </a>
                    <a href="/admin/orders" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mocha-50 hover:bg-mocha-100 border border-mocha-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <ShoppingCart className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-mocha-700">View Orders</span>
                    </a>
                    <a href="/admin/analytics" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mocha-50 hover:bg-mocha-100 border border-mocha-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-mocha-700">View Analytics</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
