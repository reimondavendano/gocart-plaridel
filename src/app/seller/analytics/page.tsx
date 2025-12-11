'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import {
    BarChart3, TrendingUp, DollarSign, ShoppingBag, Users,
    Calendar, ArrowUpRight, ArrowDownRight, Package
} from 'lucide-react';

export default function SellerAnalyticsPage() {
    const { currentUser } = useAppSelector((state) => state.user);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        avgOrderValue: 0,
        recentRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser?.id) {
            fetchStats();
        }
    }, [currentUser?.id]);

    const fetchStats = async () => {
        try {
            // Get store
            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('seller_id', currentUser?.id)
                .single();

            if (store) {
                // Fetch orders
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total, created_at')
                    .eq('store_id', store.id);

                // Fetch products count
                const { count: productCount } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('store_id', store.id);

                const totalRevenue = orders?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;
                const totalOrders = orders?.length || 0;
                const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                setStats({
                    totalRevenue,
                    totalOrders,
                    totalProducts: productCount || 0,
                    avgOrderValue,
                    recentRevenue: 0 // Mock for now
                });
            }
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-mocha-900">Analytics</h1>
                <p className="text-mocha-500">Track your store's performance</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-mocha-200 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-mocha-500">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-mocha-900 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-mocha-200 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-mocha-500">Total Orders</p>
                            <h3 className="text-2xl font-bold text-mocha-900 mt-1">{stats.totalOrders}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-mocha-200 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-mocha-500">Total Products</p>
                            <h3 className="text-2xl font-bold text-mocha-900 mt-1">{stats.totalProducts}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Package className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-mocha-200 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-mocha-500">Avg. Order Value</p>
                            <h3 className="text-2xl font-bold text-mocha-900 mt-1">{formatCurrency(stats.avgOrderValue)}</h3>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder Chart Section */}
            <div className="bg-white p-8 rounded-2xl border border-mocha-200 shadow-sm flex flex-col items-center justify-center text-center py-20">
                <BarChart3 className="w-16 h-16 text-mocha-200 mb-4" />
                <h3 className="text-lg font-semibold text-mocha-900">Detailed Analytics Coming Soon</h3>
                <p className="text-mocha-500 max-w-sm mt-2">
                    We are building advanced charts to help you visualize sales trends and customer insights.
                </p>
            </div>
        </div>
    );
}
