'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Store, Users, Package, ShoppingCart,
    Settings, LogOut, Menu, X, ChevronDown, Bell, Search,
    Shield, FileCheck, BarChart3, Tag, MessageSquare, MapPin, CreditCard, Ticket, Map, Zap
} from 'lucide-react';

const sidebarLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/stores', label: 'Stores', icon: Store, badge: 'Pending' },
    { href: '/admin/stores/map', label: 'Store Map', icon: Map },
    { href: '/admin/sellers', label: 'Sellers', icon: Users },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/categories', label: 'Categories', icon: Tag },
    { href: '/admin/deals', label: 'Deals', icon: Zap },
    { href: '/admin/locations', label: 'Locations', icon: MapPin },
    { href: '/admin/plans', label: 'Plans', icon: CreditCard },
    { href: '/admin/subscriptions', label: 'Subscriptions', icon: FileCheck },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [adminUser, setAdminUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);

    // Check if on login page
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        // Check admin session from localStorage
        const storedAdmin = localStorage.getItem('gocart_admin');
        if (storedAdmin) {
            setAdminUser(JSON.parse(storedAdmin));
        } else if (!isLoginPage) {
            router.push('/admin/login');
        }
    }, [isLoginPage, router]);

    const handleLogout = () => {
        localStorage.removeItem('gocart_admin');
        router.push('/admin/login');
    };

    // If on login page, render without layout
    if (isLoginPage) {
        return <>{children}</>;
    }

    // If no admin user and not login page, show loading
    if (!adminUser && !isLoginPage) {
        return (
            <div className="min-h-screen bg-cloud-200 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cloud-200">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-mocha-900 border-r border-mocha-800 z-50 transition-all duration-300 
                    ${sidebarOpen ? 'w-64' : 'w-20'} 
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-mocha-800">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mocha-400 to-mocha-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">G</span>
                        </div>
                        {sidebarOpen && (
                            <div className="flex flex-col">
                                <span className="font-bold text-white">GoCart</span>
                                <span className="text-xs text-mocha-400">Admin Panel</span>
                            </div>
                        )}
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:flex p-1.5 rounded-lg hover:bg-mocha-800 text-mocha-400 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
                    {sidebarLinks.map((link) => {
                        const isActive = pathname === link.href ||
                            (link.href !== '/admin' && pathname.startsWith(link.href));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-mocha-600 text-white shadow-lg'
                                        : 'text-mocha-300 hover:bg-mocha-800 hover:text-white'
                                    }`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-mocha-400 group-hover:text-mocha-200'}`} />
                                {sidebarOpen && (
                                    <>
                                        <span className="font-medium">{link.label}</span>
                                        {link.badge && (
                                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {link.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-3 border-t border-mocha-800">
                    <div className={`flex items-center gap-3 p-2 rounded-xl bg-mocha-800/50 ${sidebarOpen ? '' : 'justify-center'}`}>
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-dusk-400 to-dusk-600 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{adminUser?.name}</p>
                                <p className="text-xs text-mocha-400 truncate">{adminUser?.email}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors ${sidebarOpen ? '' : 'justify-center'}`}
                    >
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {/* Top Header */}
                <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-mocha-200 sticky top-0 z-30 shadow-sm">
                    <div className="h-full flex items-center justify-between px-4 lg:px-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="lg:hidden p-2 rounded-lg hover:bg-mocha-100 text-mocha-600"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div className="hidden md:flex items-center gap-2 bg-mocha-100 rounded-xl px-4 py-2">
                                <Search className="w-4 h-4 text-mocha-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-transparent border-none outline-none text-sm text-mocha-700 placeholder:text-mocha-400 w-64"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="relative p-2 rounded-xl hover:bg-mocha-100 text-mocha-600 transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <div className="flex items-center gap-2 pl-3 border-l border-mocha-200">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mocha-400 to-mocha-600 flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">{adminUser?.name?.charAt(0)}</span>
                                </div>
                                <span className="hidden md:block text-sm font-medium text-mocha-700">{adminUser?.name}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
