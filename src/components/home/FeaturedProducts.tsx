'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts } from '@/store/slices/productSlice';



export default function FeaturedProducts() {
    const dispatch = useAppDispatch();
    const { products, isLoading } = useAppSelector((state) => state.product);
    const [activeTab, setActiveTab] = useState('All');
    const [tabs, setTabs] = useState(['All', 'Trending']);

    // Derive Tabs from Products
    useEffect(() => {
        if (products.length > 0) {
            // Get unique categories from products
            const categories = Array.from(new Set(products.map(p => p.category)));
            // Format slugs to Title Case for display
            const formattedCats = categories.map(slug =>
                slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
            );

            setTabs(['All', ...formattedCats, 'Trending']);
        }
    }, [products]);

    useEffect(() => {
        if (products.length === 0) {
            dispatch(fetchProducts());
        }
    }, [dispatch, products.length]);

    const filteredProducts = activeTab === 'All'
        ? products.filter((p) => p.isFeatured)
        : activeTab === 'Trending'
            ? [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4)
            : products.filter((p) => p.category.toLowerCase() === activeTab.toLowerCase().replace(/\s+/g, '-'));

    if (isLoading && products.length === 0) {
        return <div className="py-12 text-center text-mocha-600">Loading hot picks...</div>;
    }

    return (
        <section className="py-12">
            <div className="container-custom">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="text-orange-500 font-semibold text-sm">Hot Picks</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-mocha-900">
                            Featured Products
                        </h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab
                                    ? 'gradient-mocha text-white shadow-md'
                                    : 'bg-cloud-200 text-mocha-600 hover:bg-mocha-100'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid - Balanced for 1200px container */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.slice(0, 5).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* View All */}
                <div className="text-center mt-12">
                    <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                        View All Products
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
