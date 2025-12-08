'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard, Package, ShoppingCart, Star, Settings,
    LogOut, ChevronLeft, ChevronRight, TrendingUp, DollarSign,
    Sparkles, Plus, Eye, Edit, MoreVertical, Crown
} from 'lucide-react';
import { sellerDashboardStats, mockProducts, mockOrders, mockStores } from '@/data/mockup';

const sidebarLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/seller' },
    { icon: Package, label: 'Products', href: '/seller/products' },
    { icon: ShoppingCart, label: 'Orders', href: '/seller/orders' },
    { icon: Star, label: 'Reviews', href: '/seller/reviews' },
    { icon: Settings, label: 'Store Settings', href: '/seller/settings' },
];

export default function SellerDashboard() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const store = mockStores[0];
    const storeProducts = mockProducts.filter(p => p.storeId === store.id);
    const storeOrders = mockOrders.filter(o => o.storeId === store.id);

    return (
        <div className="min-h-screen flex bg-cloud-200">
            {/* Sidebar */}
            <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-mocha-950 text-cloud-200 flex flex-col transition-all duration-300`}>
                {/* Logo */}
                <div className="p-4 border-b border-mocha-800 flex items-center justify-between">
                    {!sidebarCollapsed && (
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl gradient-mocha flex items-center justify-center">
                                <span className="text-white font-bold text-xl">G</span>
                            </div>
                            <span className="font-bold text-lg text-cloud-100">Seller Portal</span>
                        </Link>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 rounded-lg hover:bg-mocha-800 transition-colors ml-auto"
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6">
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 px-4 py-3 text-mocha-400 hover:text-cloud-100 hover:bg-mocha-800 transition-colors"
                        >
                            <link.icon className="w-5 h-5 flex-shrink-0" />
                            {!sidebarCollapsed && <span>{link.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* AI Feature */}
                {!sidebarCollapsed && (
                    <div className="p-4 mx-4 mb-4 rounded-xl bg-gradient-to-br from-dusk-500 to-mocha-600">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-white" />
                            <span className="font-semibold text-white">AI Assistant</span>
                        </div>
                        <p className="text-sm text-white/80 mb-3">Generate product descriptions with AI</p>
                        <Link href="/seller/products/new" className="block w-full py-2 text-center rounded-lg bg-white text-mocha-800 font-medium text-sm">
                            Try AI Generation
                        </Link>
                    </div>
                )}

                {/* Logout */}
                <div className="p-4 border-t border-mocha-800">
                    <Link href="/" className="flex items-center gap-3 text-mocha-400 hover:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5" />
                        {!sidebarCollapsed && <span>Back to Store</span>}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-16 bg-white border-b border-mocha-200 flex items-center justify-between px-6">
                    <div>
                        <h1 className="font-bold text-mocha-900">Dashboard</h1>
                        <p className="text-sm text-mocha-500">Welcome back, {store.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/seller/products/new" className="btn-primary flex items-center gap-2 !py-2">
                            <Plus className="w-4 h-4" />
                            Add Product
                        </Link>
                        <div className="w-10 h-10 rounded-xl bg-mocha-100 flex items-center justify-center">
                            <img src={store.logo} alt={store.name} className="w-8 h-8 rounded-lg" />
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Total Revenue', value: `₱${sellerDashboardStats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
                            { label: 'Total Orders', value: sellerDashboardStats.totalOrders, icon: ShoppingCart, color: 'bg-blue-500' },
                            { label: 'Products', value: sellerDashboardStats.totalProducts, icon: Package, color: 'bg-purple-500' },
                            { label: 'Avg Rating', value: sellerDashboardStats.averageRating, icon: Star, color: 'bg-amber-500' },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                </div>
                                <p className="text-2xl font-bold text-mocha-900">{stat.value}</p>
                                <p className="text-mocha-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Recent Orders & Products */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Recent Orders */}
                        <div className="glass-card rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-mocha-900">Recent Orders</h3>
                                <Link href="/seller/orders" className="text-mocha-500 hover:text-mocha-600 text-sm">View All</Link>
                            </div>
                            <div className="space-y-4">
                                {storeOrders.slice(0, 5).map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-cloud-100">
                                        <div>
                                            <p className="font-medium text-mocha-900">{order.id}</p>
                                            <p className="text-sm text-mocha-500">{order.items.length} items</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-mocha-800">₱{order.total.toLocaleString()}</p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="glass-card rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-mocha-900">Top Products</h3>
                                <Link href="/seller/products" className="text-mocha-500 hover:text-mocha-600 text-sm">View All</Link>
                            </div>
                            <div className="space-y-4">
                                {storeProducts.slice(0, 5).map((product) => (
                                    <div key={product.id} className="flex items-center gap-4 p-3 rounded-xl bg-cloud-100">
                                        <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-mocha-900 truncate">{product.name}</p>
                                            <p className="text-sm text-mocha-500">₱{product.price.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-4 h-4 text-mocha-400" />
                                            <Edit className="w-4 h-4 text-mocha-400" />
                                            <MoreVertical className="w-4 h-4 text-mocha-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
