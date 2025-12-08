'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Search, MapPin, Package, TrendingUp, Filter, ChevronRight, Store as StoreIcon } from 'lucide-react';
import { mockStores, Store } from '@/data/mockup';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';

export default function StoresPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'rating' | 'products' | 'sales'>('rating');

    const approvedStores = mockStores.filter(store => store.status === 'approved');

    const filteredStores = approvedStores
        .filter(store =>
            store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return b.rating - a.rating;
                case 'products':
                    return b.totalProducts - a.totalProducts;
                case 'sales':
                    return b.totalSales - a.totalSales;
                default:
                    return 0;
            }
        });

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-cloud-200 to-cloud-100">
                {/* Hero Section */}
                <div className="gradient-premium py-12 md:py-16 mb-8">
                    <div className="container-custom text-center">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                            Explore Our Stores
                        </h1>
                        <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                            Discover trusted sellers offering quality products in Plaridel and nearby areas
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-xl mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                            <input
                                type="text"
                                placeholder="Search stores..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/95 backdrop-blur text-mocha-900 placeholder-mocha-400 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                            />
                        </div>
                    </div>
                </div>

                <div className="container-custom">
                    {/* Stats Bar */}
                    <div className="glass-card rounded-2xl p-6 mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-mocha-800">{approvedStores.length}</p>
                                <p className="text-sm text-mocha-500">Active Stores</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-mocha-800">
                                    {approvedStores.reduce((acc, s) => acc + s.totalProducts, 0)}
                                </p>
                                <p className="text-sm text-mocha-500">Total Products</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-mocha-800">
                                    {(approvedStores.reduce((acc, s) => acc + s.rating, 0) / approvedStores.length).toFixed(1)}
                                </p>
                                <p className="text-sm text-mocha-500">Avg Rating</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-mocha-800">
                                    {approvedStores.reduce((acc, s) => acc + s.totalSales, 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-mocha-500">Total Sales</p>
                            </div>
                        </div>
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-mocha-600">
                            Showing <span className="font-semibold text-mocha-800">{filteredStores.length}</span> stores
                        </p>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-mocha-500" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                className="bg-white border border-mocha-200 rounded-lg px-3 py-2 text-sm text-mocha-700 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                            >
                                <option value="rating">Top Rated</option>
                                <option value="products">Most Products</option>
                                <option value="sales">Best Sellers</option>
                            </select>
                        </div>
                    </div>

                    {/* Stores Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStores.map((store) => (
                            <Link
                                key={store.id}
                                href={`/store/${store.slug}`}
                                className="group"
                            >
                                <div className="glass-card rounded-2xl overflow-hidden card-hover">
                                    {/* Banner */}
                                    <div className="relative h-32 overflow-hidden">
                                        <img
                                            src={store.banner}
                                            alt={store.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    </div>

                                    {/* Store Info */}
                                    <div className="p-5 relative">
                                        {/* Logo */}
                                        <div className="absolute -top-8 left-5">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-white">
                                                <img
                                                    src={store.logo}
                                                    alt={store.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-8">
                                            <h3 className="text-lg font-bold text-mocha-900 group-hover:text-mocha-600 transition-colors mb-1">
                                                {store.name}
                                            </h3>
                                            <p className="text-sm text-mocha-500 line-clamp-2 mb-4">
                                                {store.description}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-1 text-mocha-700">
                                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                    <span className="font-medium">{store.rating}</span>
                                                    <span className="text-mocha-400">({store.totalReviews})</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-mocha-600">
                                                    <Package className="w-4 h-4" />
                                                    <span>{store.totalProducts} products</span>
                                                </div>
                                            </div>

                                            {/* Sales Badge */}
                                            <div className="mt-4 flex items-center gap-2 text-xs">
                                                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                                                    <TrendingUp className="w-3 h-3 inline mr-1" />
                                                    {store.totalSales.toLocaleString()} sales
                                                </span>
                                                <span className="px-2 py-1 rounded-full bg-mocha-100 text-mocha-700 font-medium">
                                                    <MapPin className="w-3 h-3 inline mr-1" />
                                                    Plaridel
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredStores.length === 0 && (
                        <div className="glass-card rounded-2xl p-12 text-center">
                            <StoreIcon className="w-16 h-16 text-mocha-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-mocha-900 mb-2">No Stores Found</h3>
                            <p className="text-mocha-600 mb-6">Try adjusting your search query</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <CartDrawer />
            <SearchModal />
            <ToastContainer />
        </>
    );
}
