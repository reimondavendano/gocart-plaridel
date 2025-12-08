'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Zap, Tag, Percent, ArrowRight, Filter, Flame, ShoppingBag } from 'lucide-react';
import { mockProducts, Product } from '@/data/mockup';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import ProductCard from '@/components/product/ProductCard';

export default function DealsPage() {
    const [timeLeft, setTimeLeft] = useState({
        hours: 23,
        minutes: 45,
        seconds: 59,
    });
    const [filter, setFilter] = useState<'all' | 'flash' | 'clearance'>('all');

    // Get products with discounts
    const dealsProducts = mockProducts.filter(p => p.comparePrice && p.comparePrice > p.price);

    // Calculate discount percentage
    const getDiscount = (product: Product) => {
        if (!product.comparePrice) return 0;
        return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
    };

    // Sort by discount percentage
    const sortedDeals = [...dealsProducts].sort((a, b) => getDiscount(b) - getDiscount(a));

    // Flash deals (highest discounts)
    const flashDeals = sortedDeals.filter(p => getDiscount(p) >= 20);

    // Get display products based on filter
    const displayProducts = filter === 'flash'
        ? flashDeals
        : filter === 'clearance'
            ? sortedDeals.filter(p => getDiscount(p) < 20)
            : sortedDeals;

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Total savings
    const totalSavings = dealsProducts.reduce((acc, p) => {
        if (p.comparePrice) {
            return acc + (p.comparePrice - p.price);
        }
        return acc;
    }, 0);

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-cloud-200 to-cloud-100">
                {/* Hero Section */}
                <div className="gradient-premium py-12 md:py-16 mb-8 relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="container-custom relative z-10">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur mb-6">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                <span className="text-white font-medium">Limited Time Only</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                                Deals & Discounts
                            </h1>
                            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                                Grab these amazing deals before they&apos;re gone! Save big on your favorite products.
                            </p>

                            {/* Countdown Timer */}
                            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur">
                                <Clock className="w-6 h-6 text-white/80" />
                                <span className="text-white/80 font-medium">Flash Sale Ends In:</span>
                                <div className="flex gap-2">
                                    {['hours', 'minutes', 'seconds'].map((unit, i) => (
                                        <div key={unit} className="flex items-center gap-2">
                                            <div className="bg-white/20 rounded-lg px-3 py-2">
                                                <span className="text-2xl font-bold text-white tabular-nums">
                                                    {String(timeLeft[unit as keyof typeof timeLeft]).padStart(2, '0')}
                                                </span>
                                            </div>
                                            {i < 2 && <span className="text-white/60 text-xl font-bold">:</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container-custom">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="glass-card rounded-xl p-4 text-center">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-3">
                                <Tag className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-2xl font-bold text-mocha-800">{dealsProducts.length}</p>
                            <p className="text-sm text-mocha-500">Active Deals</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 text-center">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
                                <Flame className="w-6 h-6 text-orange-500" />
                            </div>
                            <p className="text-2xl font-bold text-mocha-800">{flashDeals.length}</p>
                            <p className="text-sm text-mocha-500">Flash Deals</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 text-center">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                                <Percent className="w-6 h-6 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold text-mocha-800">
                                {flashDeals.length > 0 ? getDiscount(flashDeals[0]) : 0}%
                            </p>
                            <p className="text-sm text-mocha-500">Max Discount</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 text-center">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                                <ShoppingBag className="w-6 h-6 text-purple-500" />
                            </div>
                            <p className="text-2xl font-bold text-mocha-800">₱{totalSavings.toLocaleString()}</p>
                            <p className="text-sm text-mocha-500">Total Savings</p>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-2">
                            {[
                                { id: 'all', label: 'All Deals', icon: Tag },
                                { id: 'flash', label: 'Flash Deals', icon: Zap },
                                { id: 'clearance', label: 'Clearance', icon: Percent },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setFilter(tab.id as typeof filter)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === tab.id
                                                ? 'bg-mocha-500 text-white shadow-lg'
                                                : 'bg-white text-mocha-600 hover:bg-mocha-100'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-mocha-600 hidden md:block">
                            Showing <span className="font-semibold text-mocha-800">{displayProducts.length}</span> deals
                        </p>
                    </div>

                    {/* Products Grid */}
                    {displayProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {displayProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl p-12 text-center">
                            <Tag className="w-16 h-16 text-mocha-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-mocha-900 mb-2">No Deals Found</h3>
                            <p className="text-mocha-600 mb-6">Check back later for more amazing deals!</p>
                            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                                Browse Products
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                    {/* Newsletter CTA */}
                    <div className="mt-12 glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-mocha-300/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-dusk-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 text-center">
                            <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                            <h2 className="text-2xl md:text-3xl font-bold text-mocha-900 mb-4">
                                Never Miss a Deal!
                            </h2>
                            <p className="text-mocha-600 mb-6 max-w-xl mx-auto">
                                Subscribe to our newsletter and get exclusive deals delivered to your inbox
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-4 py-3 rounded-xl border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                />
                                <button className="btn-primary whitespace-nowrap">
                                    Subscribe
                                </button>
                            </div>
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
