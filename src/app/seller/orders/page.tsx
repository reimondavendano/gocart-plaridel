'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import {
    ShoppingBag, Search, Eye, Filter, Truck, CheckCircle,
    XCircle, Clock, RotateCcw, Package
} from 'lucide-react';

interface Order {
    id: string;
    created_at: string;
    status: string;
    total: number;
    payment_status: string;
    user: { name: string; email: string };
    items: { quantity: number; product: { name: string } }[];
}

export default function SellerOrdersPage() {
    const { currentUser } = useAppSelector((state) => state.user);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (currentUser?.id) {
            fetchOrders();
        }
    }, [currentUser?.id]);

    const fetchOrders = async () => {
        try {
            // Get seller's store first
            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('seller_id', currentUser?.id)
                .single();

            if (store) {
                // Fetch orders for this store
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        id, created_at, status, total, payment_status,
                        user:users(name, email),
                        items:order_items(quantity, product:products(name))
                    `)
                    .eq('store_id', store.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Keep the type casting safe
                setOrders((data as any[])?.map(order => ({
                    ...order,
                    user: order.user, // User is an object here
                    items: order.items // items structure aligned
                })) || []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const getStatusStyle = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            processing: 'bg-blue-100 text-blue-700',
            shipped: 'bg-purple-100 text-purple-700',
            delivered: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
            returned: 'bg-orange-100 text-orange-700',
        };
        return styles[status.toLowerCase()] || 'bg-gray-100 text-gray-700';
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.user?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Orders</h1>
                    <p className="text-mocha-500">Manage and track your customer orders</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 shadow-sm"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${statusFilter === status
                                    ? 'bg-mocha-600 text-white border-mocha-600'
                                    : 'bg-white border-mocha-200 text-mocha-600 hover:bg-mocha-50'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-mocha-500">
                        <ShoppingBag className="w-12 h-12 mb-3 opacity-50" />
                        <p className="font-medium">No orders found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-mocha-100 bg-mocha-50">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Order ID</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Customer</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Items</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Total</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Payment</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Date</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-mocha-100">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-mocha-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-mocha-900">#{order.id.slice(0, 8)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-mocha-900">{order.user?.name || 'Guest'}</span>
                                                <span className="text-xs text-mocha-500">{order.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-mocha-600">
                                                {order.items?.length > 0
                                                    ? `${order.items[0].product?.name || 'Product'} ${order.items.length > 1 ? `+${order.items.length - 1} more` : ''}`
                                                    : 'No items'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-mocha-900">{formatCurrency(order.total)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {order.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-mocha-500">
                                            {formatDate(order.created_at)}
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
