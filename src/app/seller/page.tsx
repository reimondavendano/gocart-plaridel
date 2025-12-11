'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import {
    Package, ShoppingCart, DollarSign, TrendingUp, Eye, Clock,
    ArrowUpRight, Star, AlertTriangle, CheckCircle, XCircle, Plus
} from 'lucide-react';

interface StoreData {
    id: string;
    name: string;
    slug: string;
    status: 'pending' | 'approved' | 'rejected';
    rating: number;
    total_reviews: number;
    total_products: number;
    total_sales: number;
}

interface DashboardStats {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
}

interface RecentOrder {
    id: string;
    total: number;
    status: string;
    created_at: string;
}

export default function SellerDashboard() {
    const { currentUser } = useAppSelector((state) => state.user);
    const [store, setStore] = useState<StoreData | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser?.id) {
            fetchDashboardData();
        }
    }, [currentUser?.id]);

    const fetchDashboardData = async () => {
        try {
            // Fetch seller's store
            const { data: storeData } = await supabase
                .from('stores')
                .select('*')
                .eq('seller_id', currentUser?.id)
                .single();

            if (storeData) {
                setStore(storeData);

                // Fetch products count
                const { count: productsCount } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('store_id', storeData.id);

                // Fetch orders for this store
                const { data: ordersData, count: ordersCount } = await supabase
                    .from('orders')
                    .select('total, status', { count: 'exact' })
                    .eq('store_id', storeData.id);

                const totalRevenue = ordersData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
                const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0;

                setStats({
                    totalProducts: productsCount || 0,
                    totalOrders: ordersCount || 0,
                    totalRevenue,
                    pendingOrders
                });

                // Fetch recent orders
                const { data: recent } = await supabase
                    .from('orders')
                    .select('id, total, status, created_at')
                    .eq('store_id', storeData.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (recent) {
                    setRecentOrders(recent);
                }
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
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
            approved: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
            processing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock className="w-3.5 h-3.5" /> },
            shipped: { bg: 'bg-purple-100', text: 'text-purple-700', icon: <Package className="w-3.5 h-3.5" /> },
            delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
        };
        const style = styles[status] || styles.pending;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${style.bg} ${style.text}`}>
                {style.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
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
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Welcome back, {currentUser?.name?.split(' ')[0]}!</h1>
                    <p className="text-mocha-500">Here's what's happening with your store today.</p>
                </div>
                <Link
                    href="/seller/products/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mocha-500 hover:bg-mocha-600 text-white font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add New Product
                </Link>
            </div>

            {/* Store Status Banner */}
            {store && store.status !== 'approved' && (
                <div className={`rounded-2xl p-4 flex items-center gap-4 ${store.status === 'pending'
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${store.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                        <AlertTriangle className={`w-6 h-6 ${store.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`font-medium ${store.status === 'pending' ? 'text-yellow-800' : 'text-red-800'}`}>
                            {store.status === 'pending' ? 'Store Pending Verification' : 'Store Rejected'}
                        </h3>
                        <p className={`text-sm ${store.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {store.status === 'pending'
                                ? 'Your store is currently under review. You can still add products while we verify your information.'
                                : 'Your store application was rejected. Please contact support for more information.'}
                        </p>
                    </div>
                    <Link
                        href="/seller/store"
                        className={`px-4 py-2 rounded-xl text-sm font-medium ${store.status === 'pending'
                                ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                                : 'bg-red-200 text-red-800 hover:bg-red-300'
                            } transition-colors`}
                    >
                        View Details
                    </Link>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-mocha-100 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-mocha-500 text-sm font-medium">Total Products</p>
                            <p className="text-2xl font-bold text-mocha-900 mt-1">{stats.totalProducts}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 text-sm font-medium">+12%</span>
                        <span className="text-mocha-400 text-sm">this month</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-mocha-100 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-mocha-500 text-sm font-medium">Total Orders</p>
                            <p className="text-2xl font-bold text-mocha-900 mt-1">{stats.totalOrders}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    {stats.pendingOrders > 0 && (
                        <div className="flex items-center gap-1 mt-3">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <span className="text-yellow-600 text-sm font-medium">{stats.pendingOrders} pending</span>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-5 border border-mocha-100 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-mocha-500 text-sm font-medium">Total Revenue</p>
                            <p className="text-2xl font-bold text-mocha-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 text-sm font-medium">+24%</span>
                        <span className="text-mocha-400 text-sm">this month</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-mocha-100 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-mocha-500 text-sm font-medium">Store Rating</p>
                            <p className="text-2xl font-bold text-mocha-900 mt-1">{store?.rating || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <Star className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                        <Eye className="w-4 h-4 text-mocha-400" />
                        <span className="text-mocha-500 text-sm">{store?.total_reviews || 0} reviews</span>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl border border-mocha-100 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-mocha-100">
                    <h2 className="text-lg font-semibold text-mocha-900">Recent Orders</h2>
                    <Link href="/seller/orders" className="text-mocha-500 hover:text-mocha-700 text-sm flex items-center gap-1">
                        View all <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="divide-y divide-mocha-100">
                    {recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-mocha-500">
                            No orders yet. Share your store to start receiving orders!
                        </div>
                    ) : (
                        recentOrders.map((order) => (
                            <div key={order.id} className="p-4 hover:bg-mocha-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-mocha-900">Order #{order.id.slice(0, 8)}</p>
                                        <p className="text-sm text-mocha-500">{formatDate(order.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-mocha-900">{formatCurrency(order.total)}</p>
                                        {getStatusBadge(order.status)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/seller/products/new" className="bg-white rounded-2xl p-5 border border-mocha-100 hover:border-mocha-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-mocha-100 flex items-center justify-center mb-3 group-hover:bg-mocha-200 transition-colors">
                        <Plus className="w-6 h-6 text-mocha-600" />
                    </div>
                    <h3 className="font-medium text-mocha-900">Add Product</h3>
                    <p className="text-sm text-mocha-500">Upload a new product</p>
                </Link>
                <Link href="/seller/orders" className="bg-white rounded-2xl p-5 border border-mocha-100 hover:border-mocha-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                        <ShoppingCart className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-medium text-mocha-900">Manage Orders</h3>
                    <p className="text-sm text-mocha-500">View and process orders</p>
                </Link>
                <Link href="/seller/store" className="bg-white rounded-2xl p-5 border border-mocha-100 hover:border-mocha-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                        <Eye className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-mocha-900">View Store</h3>
                    <p className="text-sm text-mocha-500">Preview your storefront</p>
                </Link>
                <Link href="/seller/analytics" className="bg-white rounded-2xl p-5 border border-mocha-100 hover:border-mocha-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-medium text-mocha-900">Analytics</h3>
                    <p className="text-sm text-mocha-500">View sales insights</p>
                </Link>
            </div>
        </div>
    );
}
