'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart,
    Users, Package, Store, Calendar, ArrowUpRight
} from 'lucide-react';

interface AnalyticsData {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    avgOrderValue: number;
    topStores: { name: string; revenue: number; orders: number }[];
    topProducts: { name: string; sold: number; revenue: number }[];
    ordersByStatus: { status: string; count: number }[];
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            // Fetch orders
            const { data: ordersData } = await supabase
                .from('orders')
                .select('total, status, store_id, stores(name)');

            const totalRevenue = ordersData?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;
            const totalOrders = ordersData?.length || 0;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Count customers
            const { count: customerCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'customer');

            // Count products
            const { count: productCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            // Orders by status
            const statusCounts: Record<string, number> = {};
            ordersData?.forEach(order => {
                statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
            });

            setData({
                totalRevenue,
                totalOrders,
                totalCustomers: customerCount || 0,
                totalProducts: productCount || 0,
                avgOrderValue,
                topStores: [],
                topProducts: [],
                ordersByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const statCards = [
        { label: 'Total Revenue', value: formatCurrency(data?.totalRevenue || 0), icon: DollarSign, color: 'from-green-500 to-emerald-600', change: '+12.5%' },
        { label: 'Total Orders', value: data?.totalOrders || 0, icon: ShoppingCart, color: 'from-blue-500 to-blue-600', change: '+8.2%' },
        { label: 'Total Customers', value: data?.totalCustomers || 0, icon: Users, color: 'from-purple-500 to-purple-600', change: '+15.3%' },
        { label: 'Avg Order Value', value: formatCurrency(data?.avgOrderValue || 0), icon: TrendingUp, color: 'from-orange-500 to-orange-600', change: '+5.1%' },
    ];

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-500',
            processing: 'bg-blue-500',
            shipped: 'bg-purple-500',
            delivered: 'bg-green-500',
            cancelled: 'bg-red-500',
        };
        return colors[status] || 'bg-mocha-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Analytics</h1>
                    <p className="text-mocha-500">Track your platform performance</p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 bg-white border border-mocha-200 rounded-xl text-mocha-700 focus:outline-none focus:border-mocha-400"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">This year</option>
                </select>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <div className="flex items-center gap-1 mt-3">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 text-sm font-medium">{stat.change}</span>
                            <span className="text-mocha-400 text-sm">vs last period</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders by Status */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-mocha-900 mb-4">Orders by Status</h3>
                    <div className="space-y-4">
                        {data?.ordersByStatus.map((item) => {
                            const total = data.ordersByStatus.reduce((sum, i) => sum + i.count, 0);
                            const percentage = total > 0 ? (item.count / total) * 100 : 0;
                            return (
                                <div key={item.status}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-mocha-700 capitalize">{item.status}</span>
                                        <span className="text-sm text-mocha-500">{item.count} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-2 bg-mocha-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getStatusColor(item.status)} rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-mocha-900 mb-4">Platform Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-mocha-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-mocha-500 mb-2">
                                <Store className="w-4 h-4" />
                                <span className="text-sm">Total Stores</span>
                            </div>
                            <p className="text-2xl font-bold text-mocha-900">8</p>
                        </div>
                        <div className="bg-mocha-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-mocha-500 mb-2">
                                <Package className="w-4 h-4" />
                                <span className="text-sm">Total Products</span>
                            </div>
                            <p className="text-2xl font-bold text-mocha-900">{data?.totalProducts || 0}</p>
                        </div>
                        <div className="bg-mocha-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-mocha-500 mb-2">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">Active Sellers</span>
                            </div>
                            <p className="text-2xl font-bold text-mocha-900">6</p>
                        </div>
                        <div className="bg-mocha-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-mocha-500 mb-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">This Month</span>
                            </div>
                            <p className="text-2xl font-bold text-mocha-900">{formatCurrency(data?.totalRevenue || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
