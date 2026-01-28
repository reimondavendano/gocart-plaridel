'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import {
    ShoppingBag, Search, Eye, Truck, CheckCircle,
    XCircle, Clock, Package, X, MapPin, Mail,
    CreditCard, Printer, Check, AlertCircle,
    ChevronRight, RefreshCcw, Edit3, Loader2,
    RotateCcw, DollarSign
} from 'lucide-react';
import { ORDER_STATUS_CONFIG, OrderStatus } from '@/types/orders';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    product_name: string;
    product_image: string;
}

interface Order {
    id: string;
    created_at: string;
    status: OrderStatus;
    total: number;
    subtotal: number;
    shipping_fee: number;
    discount: number;
    payment_method: string;
    payment_status: string;
    tracking_number: string | null;
    rejection_reason: string | null;
    seller_approved_at: string | null;
    user: { name: string; email: string } | null;
    items: OrderItem[];
    address?: {
        complete_address?: string;
        label?: string;
        city?: { name: string };
        barangay?: { name: string };
    } | null;
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'];

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
    const [trackingNumber, setTrackingNumber] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    const [hasStore, setHasStore] = useState<boolean | null>(null);
    const [storeId, setStoreId] = useState<string | null>(null);

    // ... (rest of local state)

    useEffect(() => {
        if (currentUser?.id) {
            const getStore = async () => {
                try {
                    const { data: store } = await supabase
                        .from('stores')
                        .select('id')
                        .eq('seller_id', currentUser.id)
                        .single();

                    if (store) {
                        setStoreId(store.id);
                        setHasStore(true);
                    } else {
                        setHasStore(false);
                        setLoading(false);
                    }
                } catch (err) {
                    console.error('Error fetching store:', err);
                    setLoading(false);
                }
            };
            getStore();
        }
    }, [currentUser?.id]);

    useEffect(() => {
        if (!storeId) return;

        const fetchStoreOrders = async () => {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        id, created_at, status, total, subtotal, shipping_fee, discount,
                        payment_method, payment_status, tracking_number, rejection_reason, seller_approved_at,
                        user_id,
                        user:users(id, email),
                        address:addresses(complete_address, label, city:cities(name), barangay:barangays(name))
                    `)
                    .eq('store_id', storeId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Fetch profiles to get user names
                const formattedOrders = await Promise.all((data as any[]).map(async (order) => {
                    let name = 'Guest';
                    let email = '';
                    
                    // Use user_id directly from the order
                    const userId = order.user_id || order.user?.id;
                    if (userId) {
                        // First try to get from user_profiles
                        const { data: profile } = await supabase
                            .from('user_profiles')
                            .select('first_name, last_name, name')
                            .eq('user_id', userId)
                            .single();

                        if (profile) {
                            // Priority: name field, then first_name + last_name, then email
                            name = profile.name ||
                                ((profile.first_name || profile.last_name)
                                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                                    : null);
                        }

                        // If still no name, try to get email from users table
                        if (!name || name === 'Guest') {
                            const { data: userData } = await supabase
                                .from('users')
                                .select('email')
                                .eq('id', userId)
                                .single();
                            
                            if (userData?.email) {
                                email = userData.email;
                                // Use email username as name if no name found
                                name = userData.email.split('@')[0];
                            }
                        }
                    }

                    return {
                        ...order,
                        user: { 
                            ...order.user, 
                            name: name || 'Guest', 
                            email: email || order.user?.email || '' 
                        },
                        address: Array.isArray(order.address) ? order.address[0] : order.address,
                        items: [] // Fetched on demand
                    };
                }));

                setOrders(formattedOrders);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStoreOrders();

        const channel = supabase
            .channel(`seller_orders_${storeId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
                () => {
                    fetchStoreOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [storeId]);

    const openOrderDetail = async (order: Order) => {
        // Fetch order items
        const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

        setSelectedOrder({ ...order, items: items || [] });
        setTrackingNumber(order.tracking_number || '');
        setIsModalOpen(true);
    };

    const handleApproveOrder = async (order: Order) => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'processing',
                    seller_approved_at: new Date().toISOString()
                })
                .eq('id', order.id);

            if (error) throw error;

            // Log status change
            await supabase.from('order_status_history').insert({
                order_id: order.id,
                old_status: order.status,
                new_status: 'processing',
                changed_by: currentUser?.id,
                changed_by_role: 'seller',
                notes: 'Order approved by seller'
            });

            // Update local state
            setOrders(orders.map(o => o.id === order.id ? {
                ...o,
                status: 'processing' as OrderStatus,
                seller_approved_at: new Date().toISOString()
            } : o));

            if (selectedOrder?.id === order.id) {
                setSelectedOrder({ ...order, status: 'processing', seller_approved_at: new Date().toISOString() });
            }
        } catch (error) {
            console.error('Error approving order:', error);
            alert('Failed to approve order');
        } finally {
            setUpdating(false);
        }
    };

    const handleRejectOrder = async () => {
        if (!selectedOrder || !rejectionReason.trim()) return;

        setUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'cancelled',
                    rejection_reason: rejectionReason
                })
                .eq('id', selectedOrder.id);

            if (error) throw error;

            // Log status change
            await supabase.from('order_status_history').insert({
                order_id: selectedOrder.id,
                old_status: selectedOrder.status,
                new_status: 'cancelled',
                changed_by: currentUser?.id,
                changed_by_role: 'seller',
                notes: `Order rejected: ${rejectionReason}`
            });

            // Release stock reservations
            await supabase
                .from('stock_reservations')
                .update({ status: 'released' })
                .eq('order_id', selectedOrder.id);

            // Update local state
            setOrders(orders.map(o => o.id === selectedOrder.id ? {
                ...o,
                status: 'cancelled' as OrderStatus,
                rejection_reason: rejectionReason
            } : o));

            setShowRejectModal(false);
            setRejectionReason('');
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error rejecting order:', error);
            alert('Failed to reject order');
        } finally {
            setUpdating(false);
        }
    };

    const markAsPaid = async () => {
        if (!selectedOrder) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
                .eq('id', selectedOrder.id);

            if (error) throw error;

            // Update local state
            setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, payment_status: 'paid' } : o));
            setSelectedOrder({ ...selectedOrder, payment_status: 'paid' });
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Failed to update payment status');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateStatus = async (newStatus: OrderStatus) => {
        if (!selectedOrder) return;
        setUpdating(true);
        try {
            // Special handling for completion to trigger stock deduction via RPC
            if (newStatus === 'completed') {
                const { error } = await supabase.rpc('complete_order', { p_order_id: selectedOrder.id });
                if (error) throw error;

                // Update local state
                const updatedOrder = {
                    ...selectedOrder,
                    status: newStatus,
                    payment_status: 'paid',
                    completed_at: new Date().toISOString()
                };

                setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
                setSelectedOrder(updatedOrder);
            } else {
                // Standard update for other statuses
                const updateData: any = { status: newStatus };

                // Add tracking number if shipping
                if (newStatus === 'shipped' && trackingNumber) {
                    updateData.tracking_number = trackingNumber;
                }

                const { error } = await supabase
                    .from('orders')
                    .update(updateData)
                    .eq('id', selectedOrder.id);

                if (error) throw error;

                // Log status change
                await supabase.from('order_status_history').insert({
                    order_id: selectedOrder.id,
                    old_status: selectedOrder.status,
                    new_status: newStatus,
                    changed_by: currentUser?.id,
                    changed_by_role: 'seller',
                    notes: newStatus === 'shipped' && trackingNumber
                        ? `Shipped with tracking: ${trackingNumber}`
                        : `Status updated to ${newStatus}`
                });

                // Update local state
                const updatedOrder = {
                    ...selectedOrder,
                    status: newStatus,
                    tracking_number: trackingNumber || selectedOrder.tracking_number
                };

                setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
                setSelectedOrder(updatedOrder);
            }
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
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusStyle = (status: string) => {
        return ORDER_STATUS_CONFIG[status as OrderStatus]?.color || 'bg-gray-100 text-gray-700';
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const processingCount = orders.filter(o => o.status === 'processing').length;

    const getProgressStep = (status: string) => {
        if (status === 'cancelled' || status === 'refunded') return -1;
        const steps = ['pending', 'processing', 'shipped', 'delivered', 'completed'];
        return steps.indexOf(status);
    };

    const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
        const flow: Record<OrderStatus, OrderStatus | null> = {
            'pending': 'processing',
            'processing': 'shipped',
            'shipped': 'delivered',
            'delivered': 'completed',
            'completed': null,
            'cancelled': null,
            'refunded': null
        };
        return flow[currentStatus];
    };

    // Stats logic
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0);
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
            processing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Package className="w-3.5 h-3.5" /> },
            shipped: { bg: 'bg-purple-100', text: 'text-purple-700', icon: <Truck className="w-3.5 h-3.5" /> },
            delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
            completed: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
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

    const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Orders</h1>
                    <p className="text-mocha-500">Manage and track your store orders</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
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
                        placeholder="Search by Order ID, Name, or Email..."
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
                            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-mocha-500 animate-spin" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-mocha-500">
                        <ShoppingBag className="w-12 h-12 mb-3 opacity-50" />
                        <p className="font-medium">No orders found</p>
                        {hasStore === false && (
                            <p className="text-sm text-red-500 mt-2">Error: No store found linked to your account. Please create a store first.</p>
                        )}
                        {hasStore === true && (
                            <p className="text-xs text-mocha-400 mt-1">If you expect orders, please contact support (RLS Policy Issue).</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-mocha-100 bg-mocha-50">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Order</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Customer</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Total</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Payment</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-mocha-100">
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-mocha-50 transition-colors cursor-pointer"
                                        onClick={() => openOrderDetail(order)}
                                    >
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
                            {/* Status and Quick Actions */}
                            <div className="flex flex-wrap gap-3 items-center justify-between">
                                <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusStyle(selectedOrder.status)}`}>
                                    {ORDER_STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                                </span>

                                {selectedOrder.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApproveOrder(selectedOrder)}
                                            disabled={updating}
                                            className="px-4 py-2 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve Order
                                        </button>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            className="px-4 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Progress Tracker */}
                            {!['cancelled', 'refunded'].includes(selectedOrder.status) && (
                                <div className="bg-mocha-50/50 rounded-xl p-6 border border-mocha-100">
                                    <div className="flex items-center justify-between relative">
                                        <div className="absolute left-0 top-1/2 w-full h-1 bg-mocha-200 -z-10" />
                                        {['pending', 'processing', 'shipped', 'delivered', 'completed'].map((step, index) => {
                                            const currentStepIndex = getProgressStep(selectedOrder.status);
                                            const isCompleted = currentStepIndex >= index;
                                            const isCurrent = currentStepIndex === index;
                                            return (
                                                <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'bg-white border-mocha-300 text-mocha-300'
                                                        }`}>
                                                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : (
                                                            index === 0 ? <Clock className="w-4 h-4" /> :
                                                                index === 1 ? <Package className="w-4 h-4" /> :
                                                                    index === 2 ? <Truck className="w-4 h-4" /> :
                                                                        index === 3 ? <CheckCircle className="w-4 h-4" /> :
                                                                            <Check className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-medium capitalize ${isCurrent ? 'text-mocha-900' : 'text-mocha-400'}`}>
                                                        {step}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {selectedOrder.status === 'cancelled' && selectedOrder.rejection_reason && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                    <p className="text-sm text-red-700">
                                        <strong>Rejection Reason:</strong> {selectedOrder.rejection_reason}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-mocha-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-mocha-500" /> Customer & Delivery
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
                                                {selectedOrder.address?.complete_address || 'No address provided'}
                                                {selectedOrder.address?.barangay && `, ${selectedOrder.address.barangay.name}`}
                                                {selectedOrder.address?.city && `, ${selectedOrder.address.city.name}`}
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
                                            <span className="font-medium uppercase">{selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : 'Xendit'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-mocha-500">Status</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {selectedOrder.payment_status}
                                                </span>
                                                {selectedOrder.payment_status !== 'paid' && (
                                                    <button
                                                        onClick={markAsPaid}
                                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
                                                        disabled={updating}
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-mocha-50 space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-mocha-500">Subtotal</span>
                                                <span>{formatCurrency(selectedOrder.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-mocha-500">Shipping</span>
                                                <span>{formatCurrency(selectedOrder.shipping_fee)}</span>
                                            </div>
                                            {selectedOrder.discount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Discount</span>
                                                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                                                </div>
                                            )}
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
                                    <div className="divide-y divide-mocha-50">
                                        {selectedOrder.items?.map((item, idx) => (
                                            <div key={item.id || idx} className="flex items-center gap-4 p-4">
                                                <div className="w-16 h-16 rounded-lg bg-mocha-100 flex-shrink-0 overflow-hidden">
                                                    {item.product_image ? (
                                                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-full h-full p-4 text-mocha-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-mocha-900 truncate">{item.product_name}</p>
                                                    <p className="text-sm text-mocha-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-mocha-900">{formatCurrency(item.price * item.quantity)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tracking Number (for shipped/delivered status) */}
                            {['processing', 'shipped'].includes(selectedOrder.status) && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-mocha-900 flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-mocha-500" /> Shipping Details
                                    </h3>
                                    <div className="bg-white border border-mocha-100 rounded-xl p-4">
                                        <label className="block text-sm font-medium text-mocha-700 mb-2">Tracking Number</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={trackingNumber}
                                                onChange={(e) => setTrackingNumber(e.target.value)}
                                                placeholder="Enter tracking number"
                                                className="flex-1 px-4 py-2 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-mocha-100 bg-mocha-50 flex flex-col md:flex-row items-center justify-between gap-4">
                            <button className="px-4 py-2 bg-white border border-mocha-200 text-mocha-700 rounded-xl hover:bg-mocha-50 transition-colors flex items-center gap-2">
                                <Printer className="w-4 h-4" /> Print Invoice
                            </button>

                            {getNextStatus(selectedOrder.status) && (
                                <button
                                    onClick={() => handleUpdateStatus(getNextStatus(selectedOrder.status)!)}
                                    disabled={updating}
                                    className="px-6 py-2 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {updating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <ChevronRight className="w-4 h-4" />
                                            Mark as {ORDER_STATUS_CONFIG[getNextStatus(selectedOrder.status)!]?.label}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Order Modal */}
            {showRejectModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Reject Order</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Please provide a reason for rejecting this order. The customer will be notified.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., Out of stock, Cannot deliver to this area..."
                            rows={4}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectOrder}
                                disabled={!rejectionReason.trim() || updating}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                            >
                                {updating ? 'Rejecting...' : 'Reject Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
