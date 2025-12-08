'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard, Users, Store, Package, Tag, ShoppingCart,
    Settings, ChevronLeft, ChevronRight, TrendingUp, DollarSign,
    CheckCircle, XCircle, Clock, Eye, LogOut
} from 'lucide-react';
import { adminDashboardStats, mockStores, mockUsers, mockCoupons, mockOrders } from '@/data/mockup';

const sidebarLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: Store, label: 'Stores', href: '/admin/stores' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Package, label: 'Products', href: '/admin/products' },
    { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
    { icon: Tag, label: 'Coupons', href: '/admin/coupons' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminDashboard() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const pendingStores = mockStores.filter(s => s.status === 'pending');

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
                            <span className="font-bold text-lg text-cloud-100">Admin Panel</span>
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
                        <h1 className="font-bold text-mocha-900">Admin Dashboard</h1>
                        <p className="text-sm text-mocha-500">Manage your multi-vendor platform</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {pendingStores.length > 0 && (
                            <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                                {pendingStores.length} pending approval
                            </div>
                        )}
                        <div className="w-10 h-10 rounded-xl bg-mocha-500 flex items-center justify-center text-white font-bold">
                            A
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Total Revenue', value: `₱${(adminDashboardStats.totalRevenue / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'bg-green-500', change: '+12%' },
                            { label: 'Total Orders', value: adminDashboardStats.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'bg-blue-500', change: '+8%' },
                            { label: 'Total Products', value: adminDashboardStats.totalProducts, icon: Package, color: 'bg-purple-500', change: '+15%' },
                            { label: 'Total Users', value: adminDashboardStats.totalUsers.toLocaleString(), icon: Users, color: 'bg-amber-500', change: '+23%' },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
                                        <TrendingUp className="w-4 h-4" />
                                        {stat.change}
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-mocha-900">{stat.value}</p>
                                <p className="text-mocha-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Pending Stores */}
                        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-mocha-900">Pending Store Approvals</h3>
                                <Link href="/admin/stores" className="text-mocha-500 hover:text-mocha-600 text-sm">View All</Link>
                            </div>
                            {pendingStores.length > 0 ? (
                                <div className="space-y-4">
                                    {pendingStores.map((store) => (
                                        <div key={store.id} className="flex items-center justify-between p-4 rounded-xl bg-cloud-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-mocha-200 flex items-center justify-center overflow-hidden">
                                                    <img src={store.logo} alt={store.name} className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-mocha-900">{store.name}</p>
                                                    <p className="text-sm text-mocha-500 line-clamp-1">{store.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 rounded-xl bg-green-100 text-green-600 hover:bg-green-200">
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200">
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 rounded-xl bg-mocha-100 text-mocha-600 hover:bg-mocha-200">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-mocha-500">
                                    No pending store approvals
                                </div>
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="glass-card rounded-2xl p-6">
                            <h3 className="font-bold text-mocha-900 mb-6">Recent Activity</h3>
                            <div className="space-y-4">
                                {[
                                    { text: 'New order placed', time: '2 mins ago', icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
                                    { text: 'New user registered', time: '15 mins ago', icon: Users, color: 'bg-green-100 text-green-600' },
                                    { text: 'Store approved', time: '1 hour ago', icon: Store, color: 'bg-purple-100 text-purple-600' },
                                    { text: 'Coupon created', time: '2 hours ago', icon: Tag, color: 'bg-amber-100 text-amber-600' },
                                    { text: 'Product added', time: '3 hours ago', icon: Package, color: 'bg-pink-100 text-pink-600' },
                                ].map((activity, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl ${activity.color} flex items-center justify-center`}>
                                            <activity.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-mocha-900 text-sm">{activity.text}</p>
                                            <p className="text-xs text-mocha-400">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Active Coupons */}
                    <div className="mt-6 glass-card rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-mocha-900">Active Coupons</h3>
                            <Link href="/admin/coupons" className="text-mocha-500 hover:text-mocha-600 text-sm">Manage Coupons</Link>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            {mockCoupons.map((coupon) => (
                                <div key={coupon.id} className="p-4 rounded-xl bg-gradient-to-br from-mocha-100 to-cloud-100 border border-mocha-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono font-bold text-mocha-800">{coupon.code}</span>
                                        {coupon.forPlusOnly && (
                                            <span className="badge-plus text-[10px]">PLUS</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-mocha-500 mb-2">{coupon.description}</p>
                                    <div className="flex items-center justify-between text-xs text-mocha-400">
                                        <span>{coupon.usedCount}/{coupon.usageLimit} used</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(coupon.expiresAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
