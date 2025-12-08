'use client';

import Link from 'next/link';
import { Star, ArrowRight, Store, ShoppingBag } from 'lucide-react';
import { mockStores } from '@/data/mockup';

export default function StoresSection() {
    const approvedStores = mockStores.filter(s => s.status === 'approved');

    return (
        <section className="py-20 bg-gradient-to-b from-cloud-100 to-cloud-200">
            <div className="container-custom">
                {/* Header */}
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Store className="w-6 h-6 text-mocha-500" />
                            <span className="text-mocha-500 font-semibold">Verified Sellers</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-mocha-900">
                            Top Stores
                        </h2>
                    </div>
                    <Link
                        href="/stores"
                        className="hidden md:flex items-center gap-2 text-mocha-600 hover:text-mocha-500 font-medium transition-colors"
                    >
                        View All Stores
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Stores Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {approvedStores.map((store) => (
                        <Link key={store.id} href={`/store/${store.slug}`} className="group">
                            <div className="glass-card rounded-2xl overflow-hidden card-hover">
                                {/* Banner */}
                                <div className="h-32 bg-gradient-to-br from-mocha-400 to-mocha-600 relative overflow-hidden">
                                    <img
                                        src={store.banner}
                                        alt={store.name}
                                        className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-6 -mt-12 relative">
                                    {/* Logo */}
                                    <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4 overflow-hidden">
                                        <img src={store.logo} alt={store.name} className="w-16 h-16" />
                                    </div>

                                    <h3 className="text-xl font-bold text-mocha-900 group-hover:text-mocha-600 transition-colors">
                                        {store.name}
                                    </h3>
                                    <p className="text-mocha-500 text-sm line-clamp-2 mt-2">
                                        {store.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-mocha-200">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            <span className="font-semibold text-mocha-800">{store.rating}</span>
                                            <span className="text-sm text-mocha-500">({store.totalReviews})</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-mocha-500">
                                            <ShoppingBag className="w-4 h-4" />
                                            <span className="text-sm">{store.totalProducts} products</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <Link
                        href="/seller/register"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-mocha-400 text-mocha-700 font-semibold hover:bg-mocha-50 transition-colors"
                    >
                        <Store className="w-5 h-5" />
                        Become a Seller
                    </Link>
                </div>
            </div>
        </section>
    );
}
