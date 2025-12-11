'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AppDispatch, RootState } from '@/store';
import { setSearchOpen } from '@/store/slices/uiSlice';
import { setSearchQuery, fetchProducts } from '@/store/slices/productSlice';

const trendingSearches = ['Headphones', 'Smart Watch', 'Leather Jacket', 'Handbag'];
const recentSearches = ['Wireless speaker', 'Gaming keyboard'];

export default function SearchModal() {
    const dispatch = useDispatch<AppDispatch>();
    const { searchOpen } = useSelector((state: RootState) => state.ui);
    const { searchResults, searchQuery, featuredProducts } = useSelector((state: RootState) => state.product);
    const inputRef = useRef<HTMLInputElement>(null);
    const [localQuery, setLocalQuery] = useState('');

    useEffect(() => {
        if (searchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [searchOpen]);

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(setSearchQuery(localQuery));
        }, 300);
        return () => clearTimeout(timer);
    }, [localQuery, dispatch]);

    useEffect(() => {
        if (featuredProducts.length === 0) {
            dispatch(fetchProducts());
        }
    }, [dispatch, featuredProducts.length]);

    if (!searchOpen) return null;

    // Use featured products as fallback if available, otherwise empty
    const displayResults = searchQuery ? searchResults : featuredProducts.slice(0, 4);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => dispatch(setSearchOpen(false))}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50">
                <div className="glass-card rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
                    {/* Search Input */}
                    <div className="relative border-b border-mocha-200">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                            placeholder="Search products, stores, or categories..."
                            className="w-full py-4 pl-12 pr-12 text-lg bg-transparent focus:outline-none text-mocha-900 placeholder:text-mocha-400"
                        />
                        {localQuery && (
                            <button
                                onClick={() => setLocalQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-mocha-100"
                            >
                                <X className="w-5 h-5 text-mocha-400" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                        {!searchQuery ? (
                            <>
                                {/* Trending */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 text-sm text-mocha-500 mb-3">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>Trending Searches</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {trendingSearches.map((term) => (
                                            <button
                                                key={term}
                                                onClick={() => setLocalQuery(term)}
                                                className="px-4 py-2 rounded-full bg-mocha-100 text-mocha-700 text-sm hover:bg-mocha-200 transition-colors"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 text-sm text-mocha-500 mb-3">
                                        <Clock className="w-4 h-4" />
                                        <span>Recent Searches</span>
                                    </div>
                                    <div className="space-y-2">
                                        {recentSearches.map((term) => (
                                            <button
                                                key={term}
                                                onClick={() => setLocalQuery(term)}
                                                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-mocha-100 transition-colors text-mocha-700"
                                            >
                                                <Clock className="w-4 h-4 text-mocha-400" />
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Popular Products */}
                                <div>
                                    <p className="text-sm text-mocha-500 mb-3">Popular Products</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {displayResults.map((product) => (
                                            <Link
                                                key={product.id}
                                                href={`/product/${product.slug}`}
                                                onClick={() => dispatch(setSearchOpen(false))}
                                                className="flex gap-3 p-2 rounded-xl hover:bg-mocha-100 transition-colors"
                                            >
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-mocha-900 truncate">{product.name}</p>
                                                    <p className="text-sm text-mocha-500">₱{product.price.toLocaleString()}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Search Results */}
                                {searchResults.length > 0 ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-mocha-500">{searchResults.length} results for &quot;{searchQuery}&quot;</p>
                                        {searchResults.map((product) => (
                                            <Link
                                                key={product.id}
                                                href={`/product/${product.slug}`}
                                                onClick={() => dispatch(setSearchOpen(false))}
                                                className="flex gap-4 p-3 rounded-xl hover:bg-mocha-100 transition-colors"
                                            >
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="w-16 h-16 rounded-lg object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-mocha-900">{product.name}</p>
                                                    <p className="text-sm text-mocha-500">{product.storeName}</p>
                                                    <p className="text-mocha-700 font-semibold mt-1">₱{product.price.toLocaleString()}</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-mocha-400 self-center" />
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-mocha-500">No results found for &quot;{searchQuery}&quot;</p>
                                        <p className="text-sm text-mocha-400 mt-1">Try a different search term</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
