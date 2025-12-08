'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    MapPin, Star, Package, TrendingUp, Calendar, CheckCircle,
    MessageCircle, User, ThumbsUp
} from 'lucide-react';
import { mockStores, mockProducts, mockRatings } from '@/data/mockup';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import ProductCard from '@/components/product/ProductCard';

export default function StorePage() {
    const params = useParams();
    const slug = params.slug as string;
    const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');
    const [sortBy, setSortBy] = useState('newest');
    const [filterCategory, setFilterCategory] = useState('all');

    const store = mockStores.find((s) => s.slug === slug);
    const products = store ? mockProducts.filter((p) => p.storeId === store.id) : [];

    // Derived lists
    const bestSellers = products.filter(p => p.rating >= 4.5 && p.reviewCount > 10).slice(0, 4);
    const deals = products.filter(p => p.comparePrice && p.comparePrice > p.price).slice(0, 4);

    // Get unique categories from store's products
    const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

    // Filter and Sort Logic
    const filteredProducts = products
        .filter(p => filterCategory === 'all' || p.category === filterCategory)
        .sort((a, b) => {
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            if (sortBy === 'rating') return b.rating - a.rating;
            return 0; // newest (mock default order)
        });

    // Get reviews for this store's products
    const productIds = products.map(p => p.id);
    const storeReviews = mockRatings.filter(r => productIds.includes(r.productId));

    if (!store) {
        notFound();
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                {/* Store Banner & Header */}
                <div className="bg-white border-b border-gray-200 mb-8 pb-0">
                    {/* Banner Image */}
                    <div className="h-48 md:h-64 w-full relative bg-gray-200">
                        <img
                            src={store.banner}
                            alt={store.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>

                    <div className="container-custom">
                        <div className="flex flex-col md:flex-row items-start gap-6 mb-8 relative">
                            {/* Store Logo - Overlapping Banner */}
                            <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg flex-shrink-0 relative z-10 -mt-16 md:-mt-20 ml-4 md:ml-0">
                                <img
                                    src={store.logo}
                                    alt={store.name}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>

                            {/* Store Info & Stats - On White Background */}
                            <div className="flex-1 flex flex-col md:flex-row items-start md:items-start justify-between gap-4 pt-4 md:pt-2 w-full">
                                {/* Info */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                            {store.name}
                                        </h1>
                                        {store.status === 'approved' && (
                                            <CheckCircle className="w-5 h-5 text-blue-500 fill-white" />
                                        )}
                                    </div>
                                    <p className="text-gray-600 line-clamp-1 max-w-md">
                                        {store.description}
                                    </p>
                                </div>

                                {/* Stats - Aligned nicely on the right */}
                                <div className="flex items-center gap-8 bg-gray-50 px-6 py-3 rounded-xl border border-gray-100 self-start md:self-center mt-2 md:mt-0">
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-gray-900">{store.rating}</p>
                                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 uppercase tracking-wide">
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            <span>Rating</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200" />
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-gray-900">{store.totalProducts}</p>
                                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 uppercase tracking-wide">
                                            <Package className="w-3 h-3 text-mocha-500" />
                                            <span>Products</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200" />
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-gray-900">{store.totalSales}</p>
                                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 uppercase tracking-wide">
                                            <TrendingUp className="w-3 h-3 text-mocha-500" />
                                            <span>Sales</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation / Tabs */}
                        <div className="flex items-center gap-6 border-t border-gray-100 pt-4 overflow-x-auto">
                            {[
                                { id: 'products', label: 'Products' },
                                { id: 'about', label: 'About' },
                                { id: 'reviews', label: 'Reviews' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`pb-4 font-medium px-2 whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                                            ? 'text-mocha-600 border-mocha-600'
                                            : 'text-gray-500 border-transparent hover:text-mocha-600'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                            <button className="text-gray-500 hover:text-mocha-600 pb-4 font-medium px-2 whitespace-nowrap transition-colors ml-auto">
                                Contact Seller
                            </button>
                        </div>
                    </div>
                </div>

                <div className="container-custom">
                    {activeTab === 'products' && (
                        <div className="space-y-12">
                            {/* Best Sellers Section */}
                            {bestSellers.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Best Sellers</h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {bestSellers.map((product) => (
                                            <ProductCard key={product.id} product={product} variant="default" />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Deals Section */}
                            {deals.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-red-500" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Hot Deals</h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {deals.map((product) => (
                                            <ProductCard key={product.id} product={product} variant="default" />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Main Product Grid with Filters */}
                            <section>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">All Products</h2>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Category Filter */}
                                        <select
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mocha-500"
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>
                                                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Sort Filter */}
                                        <select
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mocha-500"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="newest">Newest</option>
                                            <option value="rating">Top Rated</option>
                                            <option value="price-low">Price: Low to High</option>
                                            <option value="price-high">Price: High to Low</option>
                                        </select>
                                    </div>
                                </div>

                                {filteredProducts.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {filteredProducts.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
                                        <p className="text-gray-500">
                                            Try adjusting your filters to find what you're looking for.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">About {store.name}</h3>
                                    <p className="text-gray-600 leading-relaxed mb-6">
                                        {store.description}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-gray-50">
                                            <p className="text-sm text-gray-500 mb-1">Joined</p>
                                            <p className="font-medium text-gray-900">
                                                {new Date(store.createdAt).toLocaleDateString('en-US', {
                                                    month: 'long', year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-gray-50">
                                            <p className="text-sm text-gray-500 mb-1">Location</p>
                                            <p className="font-medium text-gray-900">Plaridel, Bulacan</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Store Performance</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Response Rate</span>
                                                <span className="font-medium text-green-600">98%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 w-[98%]" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Order Fulfillment</span>
                                                <span className="font-medium text-blue-600">99%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-[99%]" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Customer Rating</span>
                                                <span className="font-medium text-amber-500">{store.rating}/5.0</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-400 w-[96%]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="max-w-4xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Reviews ({storeReviews.length})
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-amber-400">
                                        <Star className="w-5 h-5 fill-current" />
                                        <span className="text-xl font-bold text-gray-900">{store.rating}</span>
                                    </div>
                                    <span className="text-gray-500">out of 5.0</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {storeReviews.length > 0 ? (
                                    storeReviews.map((review) => (
                                        <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-mocha-100 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-mocha-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">User</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1 text-green-600">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Verified Purchase
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 mb-4">{review.review}</p>
                                            {review.images && review.images.length > 0 && (
                                                <div className="flex gap-2 mb-4">
                                                    {review.images.map((img, i) => (
                                                        <img
                                                            key={i}
                                                            src={img}
                                                            alt={`Review ${i}`}
                                                            className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                                        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
                                        <p className="text-gray-500">
                                            This store hasn't received any reviews yet.
                                        </p>
                                    </div>
                                )}
                            </div>
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
