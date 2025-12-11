'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Crown, TrendingUp, Zap } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function HeroSection() {
    const { currentUser } = useSelector((state: RootState) => state.user);
    const isPlus = ['Growth', 'Pro', 'Enterprise'].includes(currentUser?.plan?.name || '');

    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden pb-0 pt-32 lg:pt-0">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cloud-200 via-mocha-100 to-cloud-200" />

            {/* Decorative Elements */}
            <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-mocha-300/30 blur-3xl animate-float" />
            <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-dusk-400/20 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

            {/* Floating Shapes */}
            <div className="absolute top-1/4 right-1/4 w-20 h-20 rounded-2xl bg-mocha-400/20 rotate-12 animate-float" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-1/4 left-1/4 w-16 h-16 rounded-xl bg-dusk-500/20 -rotate-12 animate-float" style={{ animationDelay: '1s' }} />

            <div className="container-custom relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <div className="text-center lg:text-left">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mocha-100 border border-mocha-200 mb-6">
                            <Sparkles className="w-4 h-4 text-mocha-500" />
                            <span className="text-sm font-medium text-mocha-700">GoCart Shopping Experience</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-mocha-950 leading-tight mb-6">
                            Discover{' '}
                            <span className="gradient-text">Premium</span>
                            <br />
                            Products from
                            <br />
                            <span className="relative inline-block">
                                Trusted Sellers
                                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                                    <path d="M2 10C50 4 100 2 150 4C200 6 250 6 298 2" stroke="#A47764" strokeWidth="4" strokeLinecap="round" />
                                </svg>
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="text-lg text-mocha-600 mb-8 max-w-lg mx-auto lg:mx-0">
                            Your multi-vendor marketplace for electronics, fashion, beauty, and more.
                            Enjoy exclusive deals, GoCart product insights, and seamless shopping.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link href="/products" className="btn-primary flex items-center justify-center gap-2 text-lg !py-4 !px-8">
                                Start Shopping
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            {!isPlus && (
                                <Link href="/subscription" className="btn-accent flex items-center justify-center gap-2 text-lg !py-4 !px-8">
                                    <Crown className="w-5 h-5" />
                                    Try Plus Free
                                </Link>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 mt-12 justify-center lg:justify-start">
                            {[
                                { value: '10K+', label: 'Products' },
                                { value: '500+', label: 'Sellers' },
                                { value: '50K+', label: 'Customers' },
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-2xl md:text-3xl font-bold text-mocha-800">{stat.value}</p>
                                    <p className="text-sm text-mocha-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="relative hidden lg:block">
                        <div className="relative z-10">
                            {/* Main Product Card */}
                            <div className="glass-card rounded-3xl p-6 w-80 mx-auto transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                <img
                                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
                                    alt="Featured Product"
                                    className="w-full rounded-2xl mb-4"
                                />
                                <h3 className="font-semibold text-mocha-900">Premium Wireless Headphones</h3>
                                <p className="text-mocha-500 text-sm">TechZone Electronics</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xl font-bold text-mocha-800">₱4,999</span>
                                    <span className="text-sm text-mocha-400 line-through">₱6,999</span>
                                </div>
                            </div>

                            {/* Floating Cards */}
                            <div className="absolute -top-10 -left-10 glass-card rounded-2xl p-4 animate-float">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl gradient-mocha flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-mocha-900">Sales Up</p>
                                        <p className="text-xs text-green-600">+23% this week</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-5 -right-5 glass-card rounded-2xl p-4 animate-float" style={{ animationDelay: '1s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-dusk-500 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-mocha-900">Flash Sale</p>
                                        <p className="text-xs text-mocha-500">Up to 50% off</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
