'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import {
    Package, Clock, CheckCircle, Truck, XCircle, ArrowLeft,
    MapPin, CreditCard, Store, Calendar, MessageCircle, RefreshCcw,
    FileText, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { ORDER_STATUS_CONFIG, OrderStatus } from '@/types/orders';

interface OrderItem {
    id: string;
    product_id: string;
    product_name: string;
    product_image: string;
    quantity: number;
    price: number;
    total: number;
}

interface OrderHistory {
    id: string;
    old_status: string | null;
    new_status: string;
    changed_by_role: string;
    notes: string | null;
    created_at: string;
}

interface Order {
    id: string;
    status: OrderStatus;
    total: number;
    subtotal: number;
    shipping_fee: number;
    discount: number;
    payment_method: string;
    payment_status: string;
    coupon_code: string | null;
    notes: string | null;
    tracking_number: string | null;
    xendit_invoice_url: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
    delivered_at: string | null;
    store: { id: string; name: string; slug: string } | null;
    shipping_address: {
        complete_address: string;
        city: { name: string } | null;
        barangay: { name: string } | null;
    } | null;
    items: OrderItem[];
    history: OrderHistory[];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentUser, isAuthenticated } = useAppSelector((state) => state.user);

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('');

    // Check for payment status from URL
    const paymentStatus = searchParams.get('payment');

    useEffect(() => {
        if (currentUser && id) {
            fetchOrder();

            // Set up real-time subscription for order updates
            const orderChannel = supabase
                .channel(`order_${id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'orders',
                        filter: `id=eq.${id}`
                    },
                    () => {
                        // Refetch order when it's updated
                        fetchOrder();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'order_status_history',
                        filter: `order_id=eq.${id}`
                    },
                    () => {
                        // Refetch order when status history is added
                        fetchOrder();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(orderChannel);
            };
        }
    }, [currentUser, id]);

    const fetchOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    store:stores (id, name, slug),
                    shipping_address:addresses (
                        complete_address,
                        city:cities (name),
                        barangay:barangays (name)
                    )
                `)
                .eq('id', id)
                .eq('user_id', currentUser?.id)
                .single();

            if (error) throw error;

            // Fetch order items
            const { data: items } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', id);

            // Fetch order history
            const { data: history } = await supabase
                .from('order_status_history')
                .select('*')
                .eq('order_id', id)
                .order('created_at', { ascending: true });

            setOrder({
                ...data,
                items: items || [],
                history: history || []
            });
        } catch (err) {
            console.error('Error fetching order:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!order || !confirm('Are you sure you want to cancel this order?')) return;

        setActionLoading(true);
        try {
            await supabase
                .from('orders')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('id', order.id);

            await supabase.from('order_status_history').insert({
                order_id: order.id,
                old_status: order.status,
                new_status: 'cancelled',
                changed_by: currentUser?.id,
                changed_by_role: 'customer',
                notes: 'Cancelled by customer'
            });

            fetchOrder();
        } catch (err) {
            console.error('Error cancelling order:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmDelivery = async () => {
        if (!order) return;

        setActionLoading(true);
        try {
            await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

            await supabase.from('order_status_history').insert({
                order_id: order.id,
                old_status: 'delivered',
                new_status: 'completed',
                changed_by: currentUser?.id,
                changed_by_role: 'customer',
                notes: 'Customer confirmed receipt'
            });

            fetchOrder();
        } catch (err) {
            console.error('Error confirming delivery:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestRefund = async () => {
        if (!order || !refundReason.trim()) return;

        setActionLoading(true);
        try {
            await supabase.from('refund_requests').insert({
                order_id: order.id,
                user_id: currentUser?.id,
                reason: refundReason,
                requested_amount: order.total
            });

            // Note: Refund request is tracked in refund_requests table
            // Order status remains as is until admin approves refund

            setShowRefundModal(false);
            setRefundReason('');
            fetchOrder();
        } catch (err) {
            console.error('Error requesting refund:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handlePayNow = async () => {
        if (!order) return;

        if (order.xendit_invoice_url) {
            window.open(order.xendit_invoice_url, '_blank');
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch('/api/xendit/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create payment link');

            if (data.invoiceUrl) {
                // Refetch to get updated order with invoice details
                await fetchOrder();
                window.open(data.invoiceUrl, '_blank');
            }
        } catch (err) {
            console.error('Error creating payment:', err);
            alert('Failed to generate payment link. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case 'completed':
            case 'delivered':
                return <CheckCircle className="w-5 h-5" />;
            case 'shipped':
                return <Truck className="w-5 h-5" />;
            case 'processing':
            case 'pending':
                return <Clock className="w-5 h-5" />;
            case 'cancelled':
                return <XCircle className="w-5 h-5" />;
            case 'refunded':
                return <RefreshCcw className="w-5 h-5" />;
            default:
                return <Package className="w-5 h-5" />;
        }
    };

    const getProgressSteps = (status: OrderStatus) => {
        const steps = [
            { key: 'pending', label: 'Order Placed' },
            { key: 'processing', label: 'Processing' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'delivered', label: 'Delivered' },
        ];

        const statusOrder: Record<string, number> = {
            'pending': 0,
            'processing': 1,
            'shipped': 2,
            'delivered': 3,
            'completed': 4,
        };

        const currentStep = statusOrder[status] ?? -1;

        return steps.map((step, index) => ({
            ...step,
            completed: index <= currentStep,
            current: index === currentStep
        }));
    };

    if (!isAuthenticated) {
        return (
            <>
                <Header />
                <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                    <div className="container-custom flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
                            <p className="text-gray-500">You need to be logged in to view order details.</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                    <div className="container-custom flex items-center justify-center min-h-[400px]">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-mocha-600" />
                            <p className="text-mocha-600 font-medium">Loading order...</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (!order) {
        return (
            <>
                <Header />
                <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                    <div className="container-custom flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                            <p className="text-gray-500 mb-6">This order doesn&apos;t exist or you don&apos;t have access to it.</p>
                            <Link href="/orders" className="btn-primary">Back to Orders</Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const statusConfig = ORDER_STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800', description: '' };
    const progressSteps = getProgressSteps(order.status);
    const canCancel = order.status === 'pending';
    const canConfirmDelivery = order.status === 'delivered';
    const canRequestRefund = order.status === 'delivered' || order.status === 'completed';
    const showPayButton = order.status === 'pending' && order.payment_method === 'xendit' && order.payment_status === 'pending';

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                <div className="container-custom max-w-4xl">
                    {/* Back Button */}
                    <Link
                        href="/orders"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Orders
                    </Link>

                    {/* Payment Status Alert */}
                    {paymentStatus === 'success' && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <p className="text-green-800 font-medium">Payment successful! Your order is being processed.</p>
                            </div>
                        </div>
                    )}
                    {paymentStatus === 'failed' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <p className="text-red-800 font-medium">Payment failed. Please try again.</p>
                            </div>
                        </div>
                    )}

                    {/* Order Header */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Order ID</p>
                                <h1 className="text-xl font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</h1>
                            </div>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.color}`}>
                                {getStatusIcon(order.status)}
                                {statusConfig.label}
                            </div>
                        </div>

                        {/* Progress Tracker */}
                        {!['cancelled', 'refunded'].includes(order.status) && (
                            <div className="relative">
                                <div className="flex justify-between">
                                    {progressSteps.map((step, index) => (
                                        <div key={step.key} className="flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                                                }`}>
                                                {step.completed ? <CheckCircle className="w-5 h-5" /> : index + 1}
                                            </div>
                                            <span className={`text-xs text-center ${step.current ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" style={{ marginLeft: '16px', marginRight: '16px' }}>
                                    <div
                                        className="h-full bg-green-500 transition-all"
                                        style={{ width: `${(progressSteps.filter(s => s.completed).length - 1) / (progressSteps.length - 1) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Rejection Reason */}
                        {order.status === 'cancelled' && order.rejection_reason && (
                            <div className="mt-4 p-4 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-800">
                                    <strong>Rejection Reason:</strong> {order.rejection_reason}
                                </p>
                            </div>
                        )}

                        {/* Tracking Number */}
                        {order.tracking_number && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Tracking Number:</strong> {order.tracking_number}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Order Items */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Store className="w-5 h-5 text-gray-400" />
                                    <h2 className="font-semibold text-gray-900">{order.store?.name || 'Store'}</h2>
                                </div>
                                <div className="space-y-4">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.product_image || '/placeholder.jpg'}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                <p className="text-sm font-medium text-mocha-600">₱{item.price.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">₱{item.total.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Timeline */}
                            {order.history.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h2 className="font-semibold text-gray-900 mb-4">Order Timeline</h2>
                                    <div className="space-y-4">
                                        {order.history.map((event, index) => (
                                            <div key={event.id} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-3 h-3 rounded-full ${index === order.history.length - 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                    {index < order.history.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <p className="font-medium text-gray-900">
                                                        {ORDER_STATUS_CONFIG[event.new_status as OrderStatus]?.label || event.new_status}
                                                    </p>
                                                    {event.notes && <p className="text-sm text-gray-500">{event.notes}</p>}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(event.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="space-y-6">
                            {/* Payment & Delivery Info */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <h2 className="font-semibold text-gray-900 mb-4">Order Details</h2>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-gray-500">Order Date</p>
                                            <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-gray-500">Payment</p>
                                            <p className="font-medium capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Xendit'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-gray-500">Delivery Address</p>
                                            <p className="font-medium">
                                                {order.shipping_address?.complete_address}
                                                {order.shipping_address?.barangay && `, ${order.shipping_address.barangay.name}`}
                                                {order.shipping_address?.city && `, ${order.shipping_address.city.name}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Price Summary */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <h2 className="font-semibold text-gray-900 mb-4">Payment Summary</h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span>₱{order.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Shipping</span>
                                        <span>₱{order.shipping_fee.toLocaleString()}</span>
                                    </div>
                                    {order.discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-₱{order.discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-lg">
                                        <span>Total</span>
                                        <span className="text-mocha-600">₱{order.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {showPayButton && (
                                    <button
                                        onClick={handlePayNow}
                                        className="w-full btn-primary"
                                    >
                                        Pay Now
                                    </button>
                                )}
                                {canConfirmDelivery && (
                                    <button
                                        onClick={handleConfirmDelivery}
                                        disabled={actionLoading}
                                        className="w-full btn-primary"
                                    >
                                        {actionLoading ? 'Processing...' : 'Confirm Receipt'}
                                    </button>
                                )}
                                {canRequestRefund && (
                                    <button
                                        onClick={() => setShowRefundModal(true)}
                                        className="w-full px-4 py-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors font-medium"
                                    >
                                        Request Refund
                                    </button>
                                )}
                                {canCancel && (
                                    <button
                                        onClick={handleCancelOrder}
                                        disabled={actionLoading}
                                        className="w-full px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                    >
                                        {actionLoading ? 'Processing...' : 'Cancel Order'}
                                    </button>
                                )}
                                {/* Contact Seller - Always Available */}
                                <Link
                                    href={`/messages?store=${order.store?.id}&order=${order.id}`}
                                    className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Contact Seller
                                </Link>
                                {/* Contact Seller About Delivered Order */}
                                {(order.status === 'delivered' || order.status === 'completed') && (
                                    <Link
                                        href={`/messages?store=${order.store?.id}&order=${order.id}&subject=delivered`}
                                        className="w-full px-4 py-2 text-mocha-600 bg-mocha-50 rounded-lg hover:bg-mocha-100 transition-colors font-medium flex items-center justify-center gap-2 border border-mocha-200"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Need Help with This Order?
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Refund Modal */}
                {showRefundModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Request Refund</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Please provide a reason for your refund request. Our team will review it within 3-5 business days.
                            </p>
                            <textarea
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Explain why you want a refund..."
                                className="w-full p-3 border border-gray-200 rounded-lg resize-none h-32 focus:outline-none focus:ring-2 focus:ring-mocha-500"
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setShowRefundModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestRefund}
                                    disabled={!refundReason.trim() || actionLoading}
                                    className="flex-1 btn-primary disabled:opacity-50"
                                >
                                    {actionLoading ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
            <CartDrawer />
            <SearchModal />
            <ToastContainer />
        </>
    );
}
