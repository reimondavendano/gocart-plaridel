'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import { useAppSelector } from '@/store';
import { Package, Clock, CheckCircle, Truck, XCircle, ArrowRight, RefreshCcw, Search } from 'lucide-react';
import { mockOrders } from '@/data/mockup';
import Link from 'next/link';

export default function OrdersPage() {
    const { currentUser, isAuthenticated } = useAppSelector((state) => state.user);
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get('status') || 'all';

    const [activeTab, setActiveTab] = useState(initialStatus);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const status = searchParams.get('status');
        if (status) setActiveTab(status);
    }, [searchParams]);

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'To Pay' },
        { id: 'processing', label: 'To Ship' },
        { id: 'to_receive', label: 'To Receive' }, // Maps to 'shipped'
        { id: 'completed', label: 'Completed' },   // Maps to 'delivered'
        { id: 'cancelled', label: 'Cancelled' },
        { id: 'return_refund', label: 'Return/Refund' }, // Maps to 'returned' or 'refunded'
    ];

    const filterOrders = (orders: typeof mockOrders) => {
        return orders.filter(order => {
            // Filter by Tab
            if (activeTab === 'all') return true;
            if (activeTab === 'pending') return order.status === 'pending';
            if (activeTab === 'processing') return order.status === 'processing';
            if (activeTab === 'to_receive') return order.status === 'shipped';
            if (activeTab === 'completed') return order.status === 'delivered';
            if (activeTab === 'cancelled') return order.status === 'cancelled';
            if (activeTab === 'return_refund') return order.status === 'returned' || order.status === 'refunded';
            return true;
        }).filter(order => {
            // Filter by Search
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                order.id.toLowerCase().includes(term) ||
                order.items.some(item => item.productName.toLowerCase().includes(term))
            );
        });
    };

    const userOrders = currentUser
        ? filterOrders(mockOrders.filter(o => o.userId === currentUser.id))
        : [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-700';
            case 'processing': return 'bg-blue-100 text-blue-700';
            case 'shipped': return 'bg-purple-100 text-purple-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'returned':
            case 'refunded': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return <CheckCircle className="w-4 h-4" />;
            case 'processing': return <Clock className="w-4 h-4" />;
            case 'shipped': return <Truck className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            case 'returned':
            case 'refunded': return <RefreshCcw className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    if (!isAuthenticated || !currentUser) {
        return (
            <>
                <Header />
                <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
                        <p className="text-gray-500">You need to be logged in to view your orders.</p>
                    </div>
                </main>
                <Footer />
                <CartDrawer />
                <SearchModal />
                <ToastContainer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                <div className="container-custom max-w-5xl">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

                    {/* Tabs / Filter Bar */}
                    <div className="bg-white rounded-t-2xl shadow-sm border-b border-gray-100">
                        <div className="flex overflow-x-auto scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                                            ? 'text-mocha-600 border-mocha-600'
                                            : 'text-gray-500 border-transparent hover:text-mocha-600'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white p-4 shadow-sm border-b border-gray-100 mb-6">
                        <div className="max-w-md relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Order ID or Product Name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mocha-500 transition-shadow"
                            />
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                        {userOrders.length > 0 ? (
                            userOrders.map((order) => (
                                <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-900">
                                                    {order.storeId === 'store_001' ? 'TechZone Store' : 'Fashion Hub'}
                                                    {/* Mock store name lookup, ideally map stores */}
                                                </span>
                                                <span className="text-gray-300">|</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Order ID: {order.id}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
                                            <p className="text-lg font-bold text-mocha-600">₱{order.total.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex items-start gap-4">
                                                <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                                    <img
                                                        src={item.productImage}
                                                        alt={item.productName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">
                                                        {item.productName}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mb-2">
                                                        Variation: Default
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-gray-500">
                                                            x{item.quantity}
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            ₱{item.price.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex gap-3">
                                            {order.status === 'delivered' && (
                                                <button className="px-4 py-2 text-sm font-medium text-white bg-mocha-600 rounded-lg hover:bg-mocha-700 transition-colors">
                                                    Rate
                                                </button>
                                            )}
                                            <button className="px-4 py-2 text-sm font-medium text-mocha-600 bg-mocha-50 rounded-lg hover:bg-mocha-100 transition-colors border border-mocha-100">
                                                Buy Again
                                            </button>
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Found</h3>
                                <p className="text-gray-500 mb-6">
                                    {activeTab === 'all'
                                        ? "You haven't placed any orders yet."
                                        : `You have no orders in the '${tabs.find(t => t.id === activeTab)?.label}' list.`
                                    }
                                </p>
                                <Link
                                    href="/products"
                                    className="btn-primary inline-flex"
                                >
                                    Start Shopping
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
            <CartDrawer />
            <SearchModal />
            <ToastContainer />
        </>
    );
}
