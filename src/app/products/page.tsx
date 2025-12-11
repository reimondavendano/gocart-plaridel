'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import ProductCard from '@/components/product/ProductCard';
import { Filter, Grid, List, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts } from '@/store/slices/productSlice';

const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
];

export default function ProductsPage() {
    const dispatch = useAppDispatch();
    const { products, isLoading } = useAppSelector((state) => state.product);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 20000 });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (products.length === 0) {
            dispatch(fetchProducts());
        }
    }, [dispatch, products.length]);

    // Derive categories from product list
    const categories = Array.from(new Set(products.map(p => p.category)));

    let filteredProducts = [...products];

    if (selectedCategory) {
        filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
    }

    filteredProducts = filteredProducts.filter(
        p => p.price >= priceRange.min && p.price <= priceRange.max
    );

    filteredProducts.sort((a, b) => {
        switch (sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'rating': return b.rating - a.rating;
            case 'popular': return b.reviewCount - a.reviewCount;
            default: return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
    });

    return (
        <>
            <Header />
            <main className="pt-24 pb-16 min-h-screen">
                <div className="container-custom">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-mocha-900">All Products</h1>
                            <p className="text-mocha-500">
                                {isLoading ? 'Loading...' : `${filteredProducts.length} products found`}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Mobile Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-mocha-100 text-mocha-700"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                            </button>

                            {/* Sort */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none px-4 py-2 pr-10 rounded-xl bg-cloud-100 border-2 border-cloud-400 text-mocha-700 focus:border-mocha-500 focus:outline-none cursor-pointer"
                                >
                                    {sortOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-500 pointer-events-none" />
                            </div>

                            {/* View Mode */}
                            <div className="hidden md:flex items-center gap-1 bg-cloud-200 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                                >
                                    <Grid className="w-4 h-4 text-mocha-600" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
                                >
                                    <List className="w-4 h-4 text-mocha-600" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-8">
                        {/* Filters Sidebar */}
                        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
                            <div className="flex items-center justify-between mb-6 lg:hidden">
                                <h3 className="text-lg font-bold text-mocha-900">Filters</h3>
                                <button onClick={() => setShowFilters(false)}>
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="glass-card rounded-2xl p-6 space-y-6">
                                {/* Categories */}
                                <div>
                                    <h4 className="font-semibold text-mocha-900 mb-4 flex items-center gap-2">
                                        <Filter className="w-4 h-4" />
                                        Categories
                                    </h4>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setSelectedCategory('')}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${!selectedCategory ? 'bg-mocha-500 text-white' : 'hover:bg-mocha-100 text-mocha-700'}`}
                                        >
                                            All Categories
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat ? 'bg-mocha-500 text-white' : 'hover:bg-mocha-100 text-mocha-700'}`}
                                            >
                                                {cat && cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <h4 className="font-semibold text-mocha-900 mb-4">Price Range</h4>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={priceRange.min}
                                            onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                                            placeholder="Min"
                                            className="w-full input-field !py-2"
                                        />
                                        <span className="text-mocha-400">-</span>
                                        <input
                                            type="number"
                                            value={priceRange.max}
                                            onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                                            placeholder="Max"
                                            className="w-full input-field !py-2"
                                        />
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                <button
                                    onClick={() => {
                                        setSelectedCategory('');
                                        setPriceRange({ min: 0, max: 20000 });
                                        setShowFilters(false);
                                    }}
                                    className="w-full py-2 rounded-xl border-2 border-mocha-300 text-mocha-700 hover:bg-mocha-50"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </aside>

                        {/* Products Grid */}
                        <div className="flex-1">
                            {isLoading && products.length === 0 ? (
                                <div className="text-center py-20 text-mocha-500">Loading products...</div>
                            ) : filteredProducts.length > 0 ? (
                                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                    {filteredProducts.map((product) => (
                                        <ProductCard key={product.id} product={product} variant={viewMode === 'list' ? 'compact' : 'default'} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <p className="text-mocha-500 text-lg">No products found matching your criteria.</p>
                                </div>
                            )}
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
