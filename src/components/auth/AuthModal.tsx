'use client';

import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, User, Facebook } from 'lucide-react';
import { useAppDispatch } from '@/store';
import { setUser } from '@/store/slices/userSlice';
import { supabase } from '@/lib/supabase';
import { addToast } from '@/store/slices/uiSlice';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const dispatch = useAppDispatch();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (mode === 'login') {
                // 1. Try Supabase Auth first (for normal users)
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (!error && data.user) {
                    dispatch(addToast({ type: 'success', title: 'Welcome back!' }));
                    onClose();
                    return;
                }

                // 2. If Supabase Auth fails, try custom Seller Login using RPC
                // Use a separate try-catch block to avoid unhandled promise rejections
                try {
                    const { data: isValid, error: rpcError } = await supabase
                        .rpc('verify_user_password', {
                            user_email: email,
                            password_attempt: password
                        });

                    if (isValid) {
                        // Fetch user details from users table
                        const { data: userData } = await supabase
                            .from('users')
                            .select('id, email, role, created_at')
                            .eq('email', email)
                            .single();

                        if (userData && userData.role === 'seller') {
                            // Fetch profile details from user_profiles table
                            const { data: profileData } = await supabase
                                .from('user_profiles')
                                .select('*, plan:plans(name, price, features)')
                                .eq('user_id', userData.id)
                                .single();

                            // Create custom session for seller
                            const sellerSession = {
                                id: userData.id,
                                email: userData.email,
                                name: profileData?.name || 'Seller',
                                avatar: profileData?.avatar,
                                role: userData.role,
                                plan: profileData?.plan,
                                phone: profileData?.phone,
                                loginAt: new Date().toISOString()
                            };

                            // Save to localStorage so SellerLayout picks it up
                            localStorage.setItem('gocart_seller', JSON.stringify(sellerSession));

                            // Dispatch to Redux so UI updates immediately
                            dispatch(setUser({
                                id: userData.id,
                                email: userData.email,
                                role: userData.role,
                                name: profileData?.name || 'Seller',
                                avatar: profileData?.avatar,
                                phone: profileData?.phone,
                                planId: profileData?.plan_id || null,
                                createdAt: userData.created_at || new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                plan: profileData?.plan ? {
                                    ...profileData.plan,
                                    id: profileData.plan_id || 'custom-plan',
                                    currency: 'PHP',
                                    maxStores: 1,
                                    maxProducts: 100,
                                    transactionFee: 0,
                                    isActive: true,
                                    createdAt: new Date().toISOString()
                                } : undefined
                            }));

                            dispatch(addToast({ type: 'success', title: 'Welcome back, Seller!' }));
                            onClose();

                            // Redirect to seller dashboard nicely
                            window.location.href = '/seller';
                            return;
                        }
                    }
                } catch (rpcErr) {
                    console.error('RPC check failed', rpcErr);
                }

                // If both fail, throw error
                throw new Error('Invalid email or password');

            } else {
                // Register flow (Supabase Auth)
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        }
                    }
                });

                if (error) throw error;

                if (data.user) {
                    // Insert into users table (auth data only)
                    const { error: userError } = await supabase
                        .from('users')
                        .insert([
                            {
                                id: data.user.id,
                                email: email,
                                role: 'customer',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }
                        ]);

                    if (userError) {
                        console.error('User creation error:', userError);
                    }

                    // Insert into user_profiles table (profile data)
                    const { error: profileError } = await supabase
                        .from('user_profiles')
                        .insert([
                            {
                                user_id: data.user.id,
                                name: name,
                                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                                plan_id: '11111111-1111-1111-1111-111111111111', // Starter plan
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }
                        ]);

                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                    }

                    dispatch(addToast({ type: 'success', title: 'Account created!', message: 'Please check your email for verification.' }));
                    onClose();
                }
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            dispatch(addToast({ type: 'error', title: 'Authentication Failed', message: error.message || 'Invalid credentials' }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'facebook') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/`,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            dispatch(addToast({ type: 'error', title: 'Login Failed', message: error.message }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 pt-10">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            {mode === 'login'
                                ? 'Sign in to access your account'
                                : 'Join us and start shopping today'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-mocha-500 focus:ring-1 focus:ring-mocha-500 transition-all text-gray-900 placeholder:text-gray-400"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-mocha-500 focus:ring-1 focus:ring-mocha-500 transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-mocha-500 focus:ring-1 focus:ring-mocha-500 transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {mode === 'login' && (
                                <div className="flex justify-end mt-1">
                                    <button type="button" className="text-xs text-mocha-600 hover:text-mocha-800 font-medium">
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-mocha-600 hover:bg-mocha-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-mocha-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                mode === 'login' ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 text-gray-400 font-medium">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 4.66c1.61 0 3.1.56 4.28 1.69l3.19-3.19C17.46 1.15 14.97-.04 12-.04 7.7-.04 3.99 2.44 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-gray-700 text-sm font-semibold">Google</span>
                        </button>
                        <button
                            onClick={() => handleSocialLogin('facebook')}
                            className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <Facebook className="w-5 h-5 text-[#1877F2]" fill="#1877F2" />
                            <span className="text-gray-700 text-sm font-semibold">Facebook</span>
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                className="text-mocha-600 hover:text-mocha-700 font-bold hover:underline transition-colors"
                            >
                                {mode === 'login' ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
