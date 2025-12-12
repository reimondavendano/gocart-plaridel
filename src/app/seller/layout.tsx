'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser } from '@/store/slices/userSlice';
import { supabase } from '@/lib/supabase';
import { User as UserType } from '@/types';
import {
    LayoutDashboard, Package, Store, Settings, LogOut, Menu, X,
    User, MapPin, CreditCard, Bell, ChevronDown, Plus, BarChart3, MessageSquare
} from 'lucide-react';

interface SellerSession {
    id: string;
    email: string;
    name: string;
    avatar: string;
    role: string;
    plan: { name: string; price: number; features: string[] } | null;
    phone: string;
    loginAt: string;
}

const sidebarLinks = [
    { href: '/seller', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/seller/products', label: 'Products', icon: Package },
    { href: '/seller/store', label: 'My Store', icon: Store },
    { href: '/seller/orders', label: 'Orders', icon: CreditCard },
    { href: '/seller/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/seller/messages', label: 'Messages', icon: MessageSquare },
    { href: '/seller/profile', label: 'Profile', icon: User },
    { href: '/seller/addresses', label: 'Addresses', icon: MapPin },
    { href: '/seller/settings', label: 'Settings', icon: Settings },
];

export default function SellerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { currentUser, isAuthenticated } = useAppSelector((state) => state.user);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sellerSession, setSellerSession] = useState<SellerSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if this is the login page
    const isLoginPage = pathname === '/seller/login';

    useEffect(() => {
        const checkAuth = async () => {
            // 1. Check localStorage for seller session (legacy/explicit seller login)
            const storedSession = localStorage.getItem('gocart_seller');
            if (storedSession) {
                try {
                    const session = JSON.parse(storedSession);
                    setSellerSession(session);
                    dispatch(setUser(session));
                    setIsLoading(false);
                    return;
                } catch (e) {
                    localStorage.removeItem('gocart_seller');
                }
            }

            // 2. Check Supabase Session (e.g. Google Login)
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                try {
                    // Fetch profile and user data
                    const { data: profileData } = await supabase
                        .from('user_profiles')
                        .select('*, plan:plans(*)')
                        .eq('user_id', session.user.id)
                        .single();

                    const { data: userData } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (userData && profileData) {
                        const mappedUser: UserType = {
                            id: session.user.id,
                            email: session.user.email || '',
                            name: profileData.name || session.user.email?.split('@')[0] || 'User',
                            role: userData.role,
                            planId: profileData.plan_id,
                            plan: profileData.plan ? {
                                id: profileData.plan.id,
                                name: profileData.plan.name,
                                price: profileData.plan.price,
                                currency: profileData.plan.currency,
                                features: profileData.plan.features,
                                maxStores: profileData.plan.max_stores,
                                maxProducts: profileData.plan.max_products,
                                transactionFee: profileData.plan.transaction_fee,
                                isActive: profileData.plan.is_active,
                                createdAt: profileData.plan.created_at
                            } : undefined,
                            avatar: profileData.avatar,
                            phone: profileData.phone,
                            createdAt: profileData.created_at,
                            updatedAt: profileData.updated_at
                        };

                        // Only set if they are actually a seller
                        if (userData.role === 'seller') {
                            dispatch(setUser(mappedUser));
                        }
                    }
                } catch (error) {
                    console.error('Error restoring session:', error);
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [dispatch]);

    useEffect(() => {
        // Skip auth check if on login page
        if (isLoginPage) return;

        // Wait for loading to complete
        if (isLoading) return;

        // Check if user is authenticated via either method
        const hasSessionAuth = sellerSession && sellerSession.role === 'seller';
        const hasReduxAuth = isAuthenticated && currentUser?.role === 'seller';

        if (!hasSessionAuth && !hasReduxAuth) {
            router.push('/seller/login');
        }
    }, [isLoading, isAuthenticated, currentUser, sellerSession, router, isLoginPage]);

    const handleLogout = () => {
        localStorage.removeItem('gocart_seller');
        setSellerSession(null);
        router.push('/seller/login');
    };

    // If on login page, just render children (the login form)
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Get the active user (prefer session, fallback to Redux)
    const activeUser = sellerSession || currentUser;

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-cloud-200 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // If not authenticated, show loading (will redirect)
    const hasValidAuth = (sellerSession && sellerSession.role === 'seller') ||
        (isAuthenticated && currentUser?.role === 'seller');

    if (!hasValidAuth) {
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
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white border-r border-mocha-200 z-50 transition-all duration-300 shadow-lg
                    ${sidebarOpen ? 'w-64' : 'w-20'} 
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-mocha-100">
                    <Link href="/seller" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mocha-400 to-mocha-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">G</span>
                        </div>
                        {sidebarOpen && (
                            <div className="flex flex-col">
                                <span className="font-bold text-mocha-800">GoCart</span>
                                <span className="text-xs text-mocha-500">Seller Portal</span>
                            </div>
                        )}
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:flex p-1.5 rounded-lg hover:bg-mocha-100 text-mocha-500 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
                    {sidebarLinks.map((link) => {
                        const isActive = pathname === link.href ||
                            (link.href !== '/seller' && pathname.startsWith(link.href));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-mocha-500 text-white shadow-lg shadow-mocha-500/20'
                                        : 'text-mocha-600 hover:bg-mocha-100 hover:text-mocha-800'
                                    }`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-mocha-400 group-hover:text-mocha-600'}`} />
                                {sidebarOpen && (
                                    <span className="font-medium">{link.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-3 border-t border-mocha-100">
                    <div className={`flex items-center gap-3 p-2 rounded-xl bg-mocha-50 ${sidebarOpen ? '' : 'justify-center'}`}>
                        <img
                            src={activeUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller'}
                            alt={activeUser?.name}
                            className="w-9 h-9 rounded-lg object-cover"
                        />
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-mocha-800 truncate">{activeUser?.name}</p>
                                <p className="text-xs text-mocha-500 truncate">{activeUser?.email}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors ${sidebarOpen ? '' : 'justify-center'}`}
                    >
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {/* Top Header */}
                <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-mocha-100 sticky top-0 z-30">
                    <div className="h-full flex items-center justify-between px-4 lg:px-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="lg:hidden p-2 rounded-lg hover:bg-mocha-100 text-mocha-600"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg font-semibold text-mocha-800">
                                {sidebarLinks.find(l => pathname === l.href || (l.href !== '/seller' && pathname.startsWith(l.href)))?.label || 'Seller Portal'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-mocha-600 hover:bg-mocha-100 transition-colors text-sm font-medium"
                            >
                                <Store className="w-4 h-4" />
                                Back to Home
                            </Link>
                            <button className="relative p-2 rounded-xl hover:bg-mocha-100 text-mocha-600 transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <Link
                                href="/seller/products/new"
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-mocha-500 hover:bg-mocha-600 text-white font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Product
                            </Link>
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
