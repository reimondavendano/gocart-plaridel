'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search, ShoppingCart, User, Menu, X, Crown, Heart,
    Bell, ChevronDown, Store, Settings, LogOut, Package
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectCartCount } from '@/store/slices/cartSlice';
import { setCartOpen, setSearchOpen, setMobileMenuOpen } from '@/store/slices/uiSlice';
import { setUser, logout } from '@/store/slices/userSlice';
import AuthModal from '@/components/auth/AuthModal';
import SellerRegistrationModal from '@/components/seller/SellerRegistrationModal';
import { supabase } from '@/lib/supabase';
import { User as UserType } from '@/types';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/stores', label: 'Stores' },
    { href: '/categories', label: 'Categories' },
    { href: '/deals', label: 'Deals' },
];

export default function Header() {
    const dispatch = useAppDispatch();
    const cartCount = useAppSelector(selectCartCount);
    const { currentUser, isAuthenticated } = useAppSelector((state) => state.user);
    const { mobileMenuOpen } = useAppSelector((state) => state.ui);
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        const fetchProfile = async (session: any) => {
            if (!session?.user) return;

            try {
                // 1. Try fetching profile with plan data
                let { data: profile, error } = await supabase
                    .from('users')
                    .select('*, plan:plans(*)')
                    .eq('id', session.user.id)
                    .single();

                // 2. Fallback: If querying with plan fails (e.g., schema relationship issue), try basic fetch
                if (error && error.code !== 'PGRST116') {
                    console.warn('Fetching with plan failed, trying basic profile fetch...', error.message);
                    const { data: basicProfile, error: basicError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (!basicError) {
                        profile = basicProfile;
                        error = null;
                    } else {
                        error = basicError;
                    }
                }

                // 3. Handle Existing Profile
                if (profile) {
                    const mappedUser: UserType = {
                        id: profile.id,
                        email: profile.email,
                        name: profile.name,
                        role: profile.role,
                        planId: profile.plan_id,
                        plan: profile.plan ? {
                            id: profile.plan.id,
                            name: profile.plan.name,
                            price: profile.plan.price,
                            currency: profile.plan.currency,
                            features: profile.plan.features,
                            maxStores: profile.plan.max_stores,
                            maxProducts: profile.plan.max_products,
                            transactionFee: profile.plan.transaction_fee,
                            isActive: profile.plan.is_active,
                            createdAt: profile.plan.created_at
                        } : undefined,
                        avatar: profile.avatar,
                        phone: profile.phone,
                        createdAt: profile.created_at,
                        updatedAt: profile.updated_at
                    };
                    dispatch(setUser(mappedUser));
                }
                // 4. Handle New User (Social Login first time) - STRICT CHECK for "Row not found"
                else if (error && error.code === 'PGRST116') {
                    const newProfile = {
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.user_metadata.full_name || session.user.email!.split('@')[0],
                        avatar: session.user.user_metadata.avatar_url,
                        role: 'customer',
                        plan_id: null, // Optional for new customers
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    const { error: insertError } = await supabase
                        .from('users')
                        .insert([newProfile]);

                    if (!insertError) {
                        // Default 'Starter' plan for Redux state (even if null in DB)
                        const starterPlan = {
                            id: '11111111-1111-1111-1111-111111111111',
                            name: 'Starter',
                            price: 0,
                            currency: 'PHP',
                            features: [],
                            maxStores: 1,
                            maxProducts: 1,
                            transactionFee: 3,
                            isActive: true,
                            createdAt: new Date().toISOString()
                        };

                        dispatch(setUser({
                            id: newProfile.id,
                            email: newProfile.email,
                            name: newProfile.name,
                            avatar: newProfile.avatar,
                            role: 'customer' as const,
                            planId: newProfile.plan_id,
                            plan: starterPlan,
                            createdAt: newProfile.created_at,
                            updatedAt: newProfile.updated_at
                        }));
                    } else {
                        console.error("Failed to create new profile:", insertError);
                    }
                }
            } catch (err) {
                console.error("Unexpected error in auth flow:", err);
            }
        };

        // Initialize Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) fetchProfile(session);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                fetchProfile(session);
            } else if (event === 'SIGNED_OUT') {
                dispatch(logout());
            }
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            subscription.unsubscribe();
        };
    }, [dispatch]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(logout());
        setUserMenuOpen(false);
    };

    const isPlus = currentUser?.plan?.name === 'Growth' || currentUser?.plan?.name === 'Pro' || currentUser?.plan?.name === 'Enterprise';

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg' : 'bg-transparent'
                    }`}
            >
                <div className="container-custom">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl gradient-mocha flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                    <span className="text-white font-bold text-xl">G</span>
                                </div>
                                {isPlus && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-dusk-500 flex items-center justify-center">
                                        <Crown className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="hidden sm:block">
                                <span className="font-bold text-xl gradient-text">GoCart</span>
                                <span className="ml-1 badge-plus text-[10px]">Plaridel</span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="px-4 py-2 text-mocha-700 hover:text-mocha-500 font-medium transition-colors relative group"
                                >
                                    {link.label}
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-mocha-500 group-hover:w-3/4 transition-all duration-300" />
                                </Link>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-2 md:gap-4">
                            <button
                                onClick={() => dispatch(setSearchOpen(true))}
                                className="p-2 rounded-xl hover:bg-mocha-100 transition-colors text-mocha-700"
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            <Link href="/wishlist" className="p-2 rounded-xl hover:bg-mocha-100 transition-colors text-mocha-700 hidden md:flex">
                                <Heart className="w-5 h-5" />
                            </Link>

                            <button
                                onClick={() => dispatch(setCartOpen(true))}
                                className="p-2 rounded-xl hover:bg-mocha-100 transition-colors text-mocha-700 relative"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-mocha-500 text-white text-xs font-bold flex items-center justify-center">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </button>

                            {isAuthenticated && (
                                <button className="p-2 rounded-xl hover:bg-mocha-100 transition-colors text-mocha-700 hidden md:flex relative">
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                                </button>
                            )}

                            {isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 p-1 pr-3 rounded-xl hover:bg-mocha-100 transition-colors"
                                    >
                                        <img
                                            src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}
                                            alt={currentUser?.name}
                                            className="w-8 h-8 rounded-lg object-cover"
                                        />
                                        <span className="hidden md:block text-sm font-medium text-mocha-800 max-w-[100px] truncate">
                                            {currentUser?.name}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-mocha-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {userMenuOpen && (
                                        <>
                                            <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                                            <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-2xl p-2 animate-slide-up">
                                                <div className="px-3 py-2 border-b border-mocha-200">
                                                    <p className="font-medium text-mocha-900">{currentUser?.name}</p>
                                                    <p className="text-sm text-mocha-500 truncate">{currentUser?.email}</p>
                                                </div>
                                                <div className="py-2">
                                                    <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-mocha-100 text-mocha-700">
                                                        <User className="w-4 h-4" />
                                                        <span>My Profile</span>
                                                    </Link>
                                                    <Link href="/orders" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-mocha-100 text-mocha-700">
                                                        <Package className="w-4 h-4" />
                                                        <span>My Orders</span>
                                                    </Link>

                                                    {/* Dynamic Role-Based Link */}
                                                    {currentUser?.role === 'seller' ? (
                                                        <Link href="/seller" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-mocha-100 text-mocha-700">
                                                            <Store className="w-4 h-4" />
                                                            <span>Seller Portal</span>
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setUserMenuOpen(false);
                                                                setIsSellerModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-mocha-100 text-mocha-700 w-full text-left"
                                                        >
                                                            <Store className="w-4 h-4" />
                                                            <span>Become a Seller</span>
                                                        </button>
                                                    )}

                                                    {currentUser?.role === 'admin' && (
                                                        <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-mocha-100 text-mocha-700">
                                                            <Settings className="w-4 h-4" />
                                                            <span>Go to Dashboard</span>
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="border-t border-mocha-200 pt-2">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 w-full"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        <span>Sign Out</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="btn-primary text-sm px-4 py-2"
                                >
                                    Login
                                </button>
                            )}

                            <button
                                onClick={() => dispatch(setMobileMenuOpen(!mobileMenuOpen))}
                                className="p-2 rounded-xl hover:bg-mocha-100 transition-colors text-mocha-700 lg:hidden"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="lg:hidden glass border-t border-mocha-200 animate-slide-up">
                        <nav className="container-custom py-4 flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="px-4 py-3 text-mocha-700 hover:bg-mocha-100 rounded-xl font-medium transition-colors"
                                    onClick={() => dispatch(setMobileMenuOpen(false))}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {/* Mobile Logic for Seller Option */}
                            {isAuthenticated && currentUser?.role === 'customer' && (
                                <button
                                    onClick={() => {
                                        dispatch(setMobileMenuOpen(false));
                                        setIsSellerModalOpen(true);
                                    }}
                                    className="px-4 py-3 text-left w-full text-mocha-700 hover:bg-mocha-100 rounded-xl font-medium transition-colors flex items-center gap-2"
                                >
                                    <Store className="w-4 h-4" />
                                    Become a Seller
                                </button>
                            )}
                        </nav>
                    </div>
                )}
            </header>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <SellerRegistrationModal isOpen={isSellerModalOpen} onClose={() => setIsSellerModalOpen(false)} />
        </>
    );
}
