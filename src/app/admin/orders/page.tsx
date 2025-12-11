'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    ShoppingCart, Search, Eye, Clock, CheckCircle, XCircle,
    Truck, Package, RotateCcw, DollarSign, ChevronDown
} from 'lucide-react';

interface Order {
    id: string;
    total: number;
    subtotal: number;
    shipping_fee: number;
    discount: number;
    status: string;
    payment_method: string;
    payment_status: string;
    created_at: string;
    user: { name: string; email: string } | null;
    store: { name: string } | null;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    user:users(name, email),
                    store:stores(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
            processing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Package className="w-3.5 h-3.5" /> },
            shipped: { bg: 'bg-purple-100', text: 'text-purple-700', icon: <Truck className="w-3.5 h-3.5" /> },
            delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
            returned: { bg: 'bg-orange-100', text: 'text-orange-700', icon: <RotateCcw className="w-3.5 h-3.5" /> },
        };
        const style = styles[status] || styles.pending;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${style.bg} ${style.text}`}>
                {style.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getPaymentBadge = (status: string) => {
        return status === 'paid' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium">
                <DollarSign className="w-3 h-3" /> Paid
            </span>
        ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-medium">
                <Clock className="w-3 h-3" /> Pending
            </span>
        );
    };

    const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Orders</h1>
                    <p className="text-mocha-500">Manage and track all orders</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                    <input
                        type="text"
                        placeholder="Search by order ID or customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 shadow-sm"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {statuses.map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === status
                                    ? 'bg-mocha-600 text-white'
                                    : 'bg-white border border-mocha-200 text-mocha-600 hover:bg-mocha-50'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-mocha-500">
                        <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
                        <p className="font-medium">No orders found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-mocha-100 bg-mocha-50">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Order</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Customer</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Store</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Total</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Payment</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-mocha-100">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-mocha-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-mocha-900">#{order.id.slice(0, 8)}</p>
                                                <p className="text-xs text-mocha-500">{formatDate(order.created_at)}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm text-mocha-900">{order.user?.name || 'Guest'}</p>
                                                <p className="text-xs text-mocha-500">{order.user?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-mocha-700">{order.store?.name || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-mocha-900">{formatCurrency(order.total)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getPaymentBadge(order.payment_status)}
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
