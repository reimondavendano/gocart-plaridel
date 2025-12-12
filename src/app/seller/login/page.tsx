'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, Store, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SellerLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // First, verify the password using our RPC function
            const { data: isValid, error: rpcError } = await supabase
                .rpc('verify_user_password', {
                    user_email: email,
                    password_attempt: password
                });

            if (rpcError) {
                console.error('RPC Error:', rpcError);
                setError('An error occurred. Please try again.');
                setLoading(false);
                return;
            }

            if (!isValid) {
                setError('Invalid email or password');
                setLoading(false);
                return;
            }

            // Password is valid, now fetch the user data
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, role')
                .eq('email', email)
                .single();

            if (userError || !userData) {
                setError('User not found');
                setLoading(false);
                return;
            }

            // Check if user is a seller
            if (userData.role !== 'seller') {
                setError('This account is not a seller account');
                setLoading(false);
                return;
            }

            // Fetch profile data from user_profiles
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*, plan:plans(name, price, features)')
                .eq('user_id', userData.id)
                .single();

            // Store seller session in localStorage
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

            localStorage.setItem('gocart_seller', JSON.stringify(sellerSession));

            // Redirect to seller dashboard
            router.push('/seller');

        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-mocha-100 via-mocha-50 to-cloud-200 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-mocha-300/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-dusk-300/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-mocha-500 to-mocha-700 flex items-center justify-center shadow-lg">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-mocha-900">GoCart</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-mocha-900 mt-6">Seller Login</h1>
                    <p className="text-mocha-500 mt-2">Access your seller dashboard</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-mocha-200 p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seller@example.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-500 focus:ring-2 focus:ring-mocha-500/20 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-3.5 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-500 focus:ring-2 focus:ring-mocha-500/20 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-mocha-400 hover:text-mocha-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="text-right">
                            <a href="#" className="text-sm text-mocha-500 hover:text-mocha-700">
                                Forgot Password?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-mocha-500 to-mocha-600 hover:from-mocha-600 hover:to-mocha-700 text-white font-semibold shadow-lg shadow-mocha-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                'Sign In to Dashboard'
                            )}
                        </button>
                    </form>

                    {/* Demo Account */}
                    <div className="mt-6 p-4 rounded-xl bg-mocha-50 border border-mocha-100">
                        <p className="text-sm text-mocha-600 font-medium mb-2">Demo Account:</p>
                        <p className="text-sm text-mocha-500">
                            Email: <code className="bg-mocha-100 px-1.5 py-0.5 rounded">seller@gocart.ph</code>
                        </p>
                        <p className="text-sm text-mocha-500">
                            Password: <code className="bg-mocha-100 px-1.5 py-0.5 rounded">seller123</code>
                        </p>
                    </div>

                    {/* Links */}
                    <div className="mt-6 text-center text-sm text-mocha-500">
                        <p>
                            Want to become a seller?{' '}
                            <Link href="/" className="text-mocha-700 hover:text-mocha-900 font-medium">
                                Register here
                            </Link>
                        </p>
                        <p className="mt-2">
                            <Link href="/" className="text-mocha-500 hover:text-mocha-700">
                                ← Back to Store
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
