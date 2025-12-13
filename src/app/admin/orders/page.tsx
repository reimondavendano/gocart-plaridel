'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    ShoppingCart, Search, Eye, Clock, CheckCircle, XCircle,
    Truck, Package, RotateCcw, DollarSign, X, MapPin, User,
    CreditCard, Store, Calendar, Loader2, Check
} from 'lucide-react';

interface OrderItem {
    id: string;
    product_id: string;
    product_name: string;
    product_image: string;
    quantity: number;
    price: number;
    total: number;
}

interface Order {
    id: string;
    total: number;
    subtotal: number;
    shipping_fee: number;
    discount: number;
    status: string;
    payment_method: string;
    payment_status: string;
    coupon_code: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    user: { id: string; name: string; email: string; phone?: string } | null;
    store: { id: string; name: string; slug: string } | null;
    address?: {
        complete_address: string;
        city: { name: string } | null;
        barangay: { name: string } | null;
    };
    items?: OrderItem[];
}

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    store:stores(id, name, slug),
                    address:addresses(
                        complete_address,
                        city:cities(name),
                        barangay:barangays(name)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch user data separately
            const ordersWithUsers = await Promise.all((data || []).map(async (order: any) => {
                if (order.user_id) {
                    const { data: profileData } = await supabase
                        .from('user_profiles')
                        .select('name, phone, user:users(email)')
                        .eq('user_id', order.user_id)
                        .single();

                    const userObj = profileData?.user as any;
                    return {
                        ...order,
                        user: profileData ? {
                            id: order.user_id,
                            name: profileData.name,
                            phone: profileData.phone,
                            email: Array.isArray(userObj) ? userObj[0]?.email : userObj?.email
                        } : null
                    };
                }
                return { ...order, user: null };
            }));

            setOrders(ordersWithUsers);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const openOrderDetail = async (order: Order) => {
        // Fetch order items
        const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

        setSelectedOrder({ ...order, items: items || [] });
        setShowModal(true);
    };

    const updateOrderStatus = async (newStatus: string) => {
        if (!selectedOrder) return;
        setUpdating(true);

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', selectedOrder.id);

            if (error) throw error;

            setSelectedOrder({ ...selectedOrder, status: newStatus });
            fetchOrders();
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order status');
        } finally {
            setUpdating(false);
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
            refunded: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <DollarSign className="w-3.5 h-3.5" /> },
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

    // Stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0);
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

    const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Orders</h1>
                    <p className="text-mocha-500">Manage and track all platform orders</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{totalOrders}</p>
                            <p className="text-sm text-mocha-500">Total Orders</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{pendingOrders}</p>
                            <p className="text-sm text-mocha-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{deliveredOrders}</p>
                            <p className="text-sm text-mocha-500">Delivered</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{formatCurrency(totalRevenue)}</p>
                            <p className="text-sm text-mocha-500">Revenue</p>
                        </div>
                    </div>
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
                                    <tr key={order.id} className="hover:bg-mocha-50 transition-colors cursor-pointer" onClick={() => openOrderDetail(order)}>
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
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openOrderDetail(order); }}
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

            {/* Order Detail Modal */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-mocha-100 bg-mocha-50 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-mocha-900">Order #{selectedOrder.id.slice(0, 8)}</h2>
                                <p className="text-sm text-mocha-500">Placed on {formatDate(selectedOrder.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {getStatusBadge(selectedOrder.status)}
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-mocha-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-mocha-500" />
                                </button>
                            </div>
                        </div>

                        {/* Order Progress */}
                        <div className="p-4 border-b border-mocha-100 bg-white">
                            <div className="flex justify-between items-center max-w-2xl mx-auto">
                                {['pending', 'processing', 'shipped', 'delivered'].map((step, index) => {
                                    const currentIndex = ['pending', 'processing', 'shipped', 'delivered'].indexOf(selectedOrder.status);
                                    const isCompleted = index <= currentIndex;
                                    const isCurrent = step === selectedOrder.status;

                                    return (
                                        <div key={step} className="flex items-center">
                                            <div className={`flex flex-col items-center`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : 'bg-mocha-200 text-mocha-500'
                                                    } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}>
                                                    {isCompleted ? <Check className="w-5 h-5" /> : (
                                                        step === 'pending' ? <Clock className="w-5 h-5" /> :
                                                            step === 'processing' ? <Package className="w-5 h-5" /> :
                                                                step === 'shipped' ? <Truck className="w-5 h-5" /> :
                                                                    <CheckCircle className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <span className={`text-xs mt-1 font-medium ${isCompleted ? 'text-green-600' : 'text-mocha-500'}`}>
                                                    {step.charAt(0).toUpperCase() + step.slice(1)}
                                                </span>
                                            </div>
                                            {index < 3 && (
                                                <div className={`w-16 h-1 mx-2 ${index < currentIndex ? 'bg-green-500' : 'bg-mocha-200'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Customer Info */}
                                <div className="bg-mocha-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-mocha-900 flex items-center gap-2 mb-3">
                                        <User className="w-4 h-4 text-mocha-500" /> Customer
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="font-medium text-mocha-900">{selectedOrder.user?.name || 'Guest'}</p>
                                        <p className="text-mocha-600">{selectedOrder.user?.email}</p>
                                        <p className="text-mocha-600">{selectedOrder.user?.phone || 'No phone'}</p>
                                    </div>
                                </div>

                                {/* Store Info */}
                                <div className="bg-mocha-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-mocha-900 flex items-center gap-2 mb-3">
                                        <Store className="w-4 h-4 text-mocha-500" /> Store
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="font-medium text-mocha-900">{selectedOrder.store?.name}</p>
                                        <p className="text-mocha-600">/{selectedOrder.store?.slug}</p>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="bg-mocha-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-mocha-900 flex items-center gap-2 mb-3">
                                        <MapPin className="w-4 h-4 text-mocha-500" /> Shipping Address
                                    </h3>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-mocha-600">{selectedOrder.address?.complete_address}</p>
                                        <p className="text-mocha-600">
                                            {selectedOrder.address?.barangay?.name}, {selectedOrder.address?.city?.name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="bg-mocha-50 rounded-xl p-4">
                                <h3 className="font-semibold text-mocha-900 flex items-center gap-2 mb-4">
                                    <Package className="w-4 h-4 text-mocha-500" /> Order Items
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 bg-white rounded-lg p-3">
                                            <img
                                                src={item.product_image || 'https://via.placeholder.com/60'}
                                                alt={item.product_name}
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-mocha-900">{item.product_name}</p>
                                                <p className="text-sm text-mocha-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                                            </div>
                                            <p className="font-semibold text-mocha-900">{formatCurrency(item.total)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-mocha-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-mocha-900 flex items-center gap-2 mb-3">
                                        <CreditCard className="w-4 h-4 text-mocha-500" /> Payment Info
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-mocha-600">Method</span>
                                            <span className="font-medium text-mocha-900 uppercase">{selectedOrder.payment_method || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-mocha-600">Status</span>
                                            {getPaymentBadge(selectedOrder.payment_status)}
                                        </div>
                                        {selectedOrder.coupon_code && (
                                            <div className="flex justify-between">
                                                <span className="text-mocha-600">Coupon</span>
                                                <span className="font-mono text-mocha-900">{selectedOrder.coupon_code}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-mocha-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-mocha-900 flex items-center gap-2 mb-3">
                                        <DollarSign className="w-4 h-4 text-mocha-500" /> Order Summary
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-mocha-600">Subtotal</span>
                                            <span className="text-mocha-900">{formatCurrency(selectedOrder.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-mocha-600">Shipping</span>
                                            <span className="text-mocha-900">{formatCurrency(selectedOrder.shipping_fee)}</span>
                                        </div>
                                        {selectedOrder.discount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-mocha-600">Discount</span>
                                                <span className="text-green-600">-{formatCurrency(selectedOrder.discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-mocha-200">
                                            <span className="font-semibold text-mocha-900">Total</span>
                                            <span className="font-bold text-mocha-900 text-lg">{formatCurrency(selectedOrder.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-mocha-100 bg-mocha-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-mocha-500">Update Status:</span>
                                <select
                                    value={selectedOrder.status}
                                    onChange={(e) => updateOrderStatus(e.target.value)}
                                    disabled={updating}
                                    className="px-3 py-2 border border-mocha-200 rounded-lg text-sm focus:outline-none focus:border-mocha-400"
                                >
                                    {ORDER_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                {updating && <Loader2 className="w-4 h-4 animate-spin text-mocha-500" />}
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
