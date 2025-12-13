'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import {
    ShoppingBag, Search, Eye, Filter, Truck, CheckCircle,
    XCircle, Clock, RotateCcw, Package, X, MapPin, Phone, Mail,
    CreditCard, Calendar, Printer
} from 'lucide-react';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    product: {
        name: string;
        images: string[];
        slug: string;
    };
}

interface OrderAddress {
    full_name: string;
    phone: string;
    street: string;
    barangay?: string; // or id
    city: string;
    province: string;
    postal_code: string;
    country: string;
}

interface Order {
    id: string;
    created_at: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    total: number;
    payment_method: string;
    payment_status: string;
    user: { name: string; email: string };
    items: OrderItem[];
    address?: OrderAddress; // Joined address
}

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function SellerOrdersPage() {
    const { currentUser } = useAppSelector((state) => state.user);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

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
                // We join addresses. Note: Ensure foreign key relationship exists. 
                // If address is null, it might be because the relationship is not named 'addresses' 
                // or address_id is null.
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        id, created_at, status, total, payment_method, payment_status,
                        user:users(name, email),
                        items:order_items(
                            id, quantity, price,
                            product:products(name, images, slug)
                        ),
                        address:addresses(*)
                    `)
                    .eq('store_id', store.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Transform data to match Order interface
                const formattedOrders = (data as any[])?.map(order => ({
                    ...order,
                    // address might be an array or object depending on relationship. Usually object if 1:1 via ID.
                    address: Array.isArray(order.address) ? order.address[0] : order.address,
                    items: order.items || []
                })) || [];

                setOrders(formattedOrders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!selectedOrder) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', selectedOrder.id);

            if (error) throw error;

            // Update local state
            setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus as any } : o));
            setSelectedOrder({ ...selectedOrder, status: newStatus as any });

        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
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
            order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    // Helper to calculate progress
    const getProgressStep = (status: string) => {
        if (status === 'cancelled' || status === 'returned') return -1;
        const steps = ['pending', 'processing', 'shipped', 'delivered'];
        return steps.indexOf(status);
    };

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
                        placeholder="Search by Order ID, Name, or Email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 shadow-sm"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', ...ORDER_STATUSES].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${statusFilter === status
                                ? 'bg-mocha-600 text-white border-mocha-600'
                                : 'bg-white border-mocha-200 text-mocha-600 hover:bg-mocha-50'
                                }`}
                        >
                            {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
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
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Date</th>
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
                                            <div className="text-xs text-mocha-500">{order.payment_status}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-mocha-500">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
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

            {/* Order Details Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-mocha-100 flex items-center justify-between bg-mocha-50">
                            <div>
                                <h2 className="text-xl font-bold text-mocha-900">Order #{selectedOrder.id.slice(0, 8)}</h2>
                                <p className="text-sm text-mocha-500">{formatDate(selectedOrder.created_at)}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-mocha-200 rounded-full transition-colors text-mocha-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Workflow / Progress */}
                            <div className="bg-mocha-50/50 rounded-xl p-6 border border-mocha-100">
                                <div className="flex items-center justify-between relative">
                                    {/* Progress Line */}
                                    <div className="absolute left-0 top-1/2 w-full h-1 bg-mocha-200 -z-10" />

                                    {['pending', 'processing', 'shipped', 'delivered'].map((step, index) => {
                                        const currentStepIndex = getProgressStep(selectedOrder.status);
                                        const isCompleted = currentStepIndex >= index;
                                        const isCurrent = currentStepIndex === index;
                                        const isCancelled = selectedOrder.status === 'cancelled' || selectedOrder.status === 'returned';

                                        return (
                                            <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : isCancelled
                                                            ? 'bg-gray-100 border-gray-300 text-gray-400'
                                                            : 'bg-white border-mocha-300 text-mocha-300'
                                                    }`}>
                                                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : (
                                                        index === 0 ? <Clock className="w-4 h-4" /> :
                                                            index === 1 ? <Package className="w-4 h-4" /> :
                                                                index === 2 ? <Truck className="w-4 h-4" /> :
                                                                    <CheckCircle className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <span className={`text-xs font-medium capitalize ${isCurrent ? 'text-mocha-900' : 'text-mocha-400'
                                                    }`}>{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {(selectedOrder.status === 'cancelled' || selectedOrder.status === 'returned') && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center font-medium border border-red-100">
                                        Order was {selectedOrder.status}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-mocha-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-mocha-500" /> Customer Details
                                    </h3>
                                    <div className="bg-white border border-mocha-100 rounded-xl p-4 space-y-3 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-mocha-100 flex items-center justify-center text-mocha-600 font-bold text-lg">
                                                {selectedOrder.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-mocha-900">{selectedOrder.user?.name || 'Guest User'}</p>
                                                <p className="text-sm text-mocha-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {selectedOrder.user?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-mocha-50">
                                            <p className="text-xs font-semibold text-mocha-400 uppercase mb-1">Shipping Address</p>
                                            <p className="text-sm text-mocha-700">
                                                {selectedOrder.address ? (
                                                    <>
                                                        {selectedOrder.address.street}<br />
                                                        {selectedOrder.address.city}, {selectedOrder.address.province}<br />
                                                        {selectedOrder.address.country} {selectedOrder.address.postal_code}
                                                    </>
                                                ) : 'No address provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-mocha-900 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-mocha-500" /> Payment
                                    </h3>
                                    <div className="bg-white border border-mocha-100 rounded-xl p-4 space-y-3 shadow-sm">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-mocha-500">Method</span>
                                            <span className="font-medium uppercase">{selectedOrder.payment_method || 'COD'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-mocha-500">Status</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>{selectedOrder.payment_status}</span>
                                        </div>
                                        <div className="pt-3 border-t border-mocha-50 flex justify-between items-center text-lg font-bold text-mocha-900">
                                            <span>Total</span>
                                            <span>{formatCurrency(selectedOrder.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-mocha-900 flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-mocha-500" /> Order Items
                                </h3>
                                <div className="bg-white border border-mocha-100 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full">
                                        <thead className="bg-mocha-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-mocha-500 uppercase">Product</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-mocha-500 uppercase">Price</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-mocha-500 uppercase">Qty</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-mocha-500 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-mocha-50">
                                            {selectedOrder.items?.map((item, idx) => (
                                                <tr key={item.id || idx}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded bg-mocha-100 flex-shrink-0 overflow-hidden">
                                                                {item.product?.images?.[0] ? (
                                                                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className="w-full h-full p-2 text-mocha-300" />
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-medium text-mocha-900">{item.product?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm text-mocha-600">
                                                        {formatCurrency(item.price || 0)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm text-mocha-600">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-medium text-mocha-900">
                                                        {formatCurrency((item.price || 0) * item.quantity)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-mocha-100 bg-mocha-50 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex gap-2 w-full md:w-auto">
                                <button className="px-4 py-2 bg-white border border-mocha-200 text-mocha-700 rounded-xl hover:bg-mocha-50 transition-colors flex items-center gap-2">
                                    <Printer className="w-4 h-4" /> Print Invoice
                                </button>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <select
                                    className="px-4 py-2 border border-mocha-200 rounded-xl bg-white focus:outline-none focus:border-mocha-400 text-sm"
                                    value={selectedOrder.status}
                                    onChange={(e) => handleUpdateStatus(e.target.value)}
                                    disabled={updating}
                                >
                                    {ORDER_STATUSES.map(status => (
                                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                                    ))}
                                </select>
                                <button
                                    className="px-6 py-2 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                                    onClick={() => handleUpdateStatus(selectedOrder.status)} // Just acts as 'save' if needed, but select does it auto
                                    disabled={updating}
                                >
                                    {updating ? 'Updating...' : 'Update Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
