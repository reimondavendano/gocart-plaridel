'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import { useAppSelector } from '@/store';
import {
    User as UserIcon, Settings, CreditCard, Ticket,
    Wallet, ClipboardList, Truck, Package, RotateCcw,
    ChevronRight, History
} from 'lucide-react';
import Link from 'next/link';
import { mockProducts } from '@/data/mockup';
import ProductCard from '@/components/product/ProductCard';

export default function ProfilePage() {
    const { currentUser, isAuthenticated } = useAppSelector((state) => state.user);

    // Mock Recent History (taking random 4 products)
    const recentHistory = mockProducts.slice(0, 4);

    if (!isAuthenticated || !currentUser) {
        return (
            <>
                <Header />
                <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
                        <p className="text-gray-500 mb-4">You need to be logged in to view your profile.</p>
                        <Link href="/" className="text-mocha-600 hover:underline">
                            Return Home
                        </Link>
                    </div>
                </main>
                <Footer />
                <CartDrawer />
                <SearchModal />
                <ToastContainer />
            </>
        );
    }

    const orderStatuses = [
        { label: 'To Pay', icon: Wallet, href: '/orders?status=pending' },
        { label: 'To Ship', icon: Package, href: '/orders?status=processing' },
        { label: 'To Receive', icon: Truck, href: '/orders?status=to_receive' },
        { label: 'Completed', icon: ClipboardList, href: '/orders?status=completed' },
        { label: 'Cancelled', icon: RotateCcw, href: '/orders?status=cancelled' },
    ];

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                <div className="container-custom max-w-5xl space-y-6">
                    {/* User Profile Header (Shopee Style) */}
                    <div className="bg-gradient-to-r from-mocha-600 to-mocha-800 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
                                />
                                <Link
                                    href="/profile/edit"
                                    className="absolute bottom-0 right-0 p-1.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-white" />
                                </Link>
                            </div>

                            <div className="flex-1">
                                <h1 className="text-2xl font-bold mb-1">{currentUser.name}</h1>
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <span className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
                                        <UserIcon className="w-3 h-3" />
                                        {currentUser.role === 'customer' ? 'Member' : 'Seller'}
                                    </span>
                                    {currentUser.subscription === 'plus' && (
                                        <span className="flex items-center gap-1 bg-amber-500/20 text-amber-100 px-3 py-1 rounded-full border border-amber-500/50">
                                            Plus Member
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="hidden md:flex gap-4">
                                <div className="text-center px-4 border-r border-white/10">
                                    <p className="text-xl font-bold">12</p>
                                    <p className="text-xs text-white/70">Vouchers</p>
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-xl font-bold">150</p>
                                    <p className="text-xs text-white/70">Points</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* My Purchases Status Bar */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">My Purchases</h2>
                            <Link href="/orders" className="text-sm text-gray-500 hover:text-mocha-600 flex items-center gap-1">
                                View Order History
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {orderStatuses.map((status) => (
                                <Link
                                    key={status.label}
                                    href={status.href}
                                    className="flex flex-col items-center justify-center gap-2 p-2 hover:bg-gray-50 rounded-xl transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-mocha-50 transition-colors">
                                        <status.icon className="w-5 h-5 text-gray-500 group-hover:text-mocha-600" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 group-hover:text-mocha-600">
                                        {status.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Wallet & Services (Optional/Placeholder) */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:border-mocha-200 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">My Wallet</h3>
                                    <p className="text-sm text-gray-500">Manage payment methods</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:border-mocha-200 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Ticket className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">My Vouchers</h3>
                                    <p className="text-sm text-gray-500">View available discounts</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    {/* Recent History / Recently Viewed */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <History className="w-5 h-5 text-mocha-600" />
                            <h2 className="text-lg font-bold text-gray-900">Recently Viewed</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {recentHistory.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
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
