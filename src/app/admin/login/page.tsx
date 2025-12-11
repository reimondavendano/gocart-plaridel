'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Check against admins table
            const { data: admin, error: adminError } = await supabase
                .from('admins')
                .select('id, email, name, avatar, role')
                .eq('email', email)
                .single();

            if (adminError || !admin) {
                setError('Invalid credentials. This login is for administrators only.');
                setIsLoading(false);
                return;
            }

            // Verify password using Supabase RPC or simple check
            // For now, we'll use a direct password check via RPC
            const { data: isValid, error: rpcError } = await supabase.rpc('verify_admin_password', {
                admin_email: email,
                password_attempt: password
            });

            if (rpcError || !isValid) {
                // Fallback: Try basic auth if RPC not set up
                // In production, you'd have proper password verification
                setError('Invalid email or password.');
                setIsLoading(false);
                return;
            }

            // Store admin session
            localStorage.setItem('gocart_admin', JSON.stringify({
                id: admin.id,
                email: admin.email,
                name: admin.name,
                avatar: admin.avatar,
                role: admin.role
            }));

            router.push('/admin');
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-mocha-950 via-mocha-900 to-mocha-950 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-mocha-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-dusk-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-mocha-400 to-mocha-600 shadow-2xl mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">GoCart Admin</h1>
                    <p className="text-mocha-400 mt-1">Sign in to your admin account</p>
                </div>

                {/* Login Card */}
                <div className="bg-mocha-900/80 backdrop-blur-xl rounded-2xl border border-mocha-800 p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-mocha-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-mocha-800/50 border border-mocha-700 rounded-xl text-white placeholder:text-mocha-500 focus:outline-none focus:border-mocha-500 focus:ring-2 focus:ring-mocha-500/20 transition-all"
                                    placeholder="admin@gocart.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-mocha-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-mocha-800/50 border border-mocha-700 rounded-xl text-white placeholder:text-mocha-500 focus:outline-none focus:border-mocha-500 focus:ring-2 focus:ring-mocha-500/20 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-mocha-500 hover:text-mocha-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-mocha-500 to-mocha-600 hover:from-mocha-600 hover:to-mocha-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-mocha-600/20"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-mocha-800 text-center">
                        <p className="text-sm text-mocha-500">
                            This is a restricted area for authorized administrators only.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-mocha-600 text-sm mt-6">
                    © 2024 GoCart Plaridel. All rights reserved.
                </p>
            </div>
        </div>
    );
}
