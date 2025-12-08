'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Filter, SlidersHorizontal } from 'lucide-react';
import { mockCategories, mockProducts } from '@/data/mockup';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import ProductCard from '@/components/product/ProductCard';

export default function CategoryPage() {
    const params = useParams();
    const slug = params.slug as string;

    const category = mockCategories.find((c) => c.slug === slug);
    const products = mockProducts.filter((p) => p.category === slug);

    if (!category) {
        notFound();
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                {/* Hero / Header */}
                <div className="bg-white border-b border-gray-200 mb-8">
                    <div className="container-custom py-8 md:py-12">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-sm text-mocha-500">
                                    <Link href="/" className="hover:text-mocha-800">Home</Link>
                                    <span>/</span>
                                    <Link href="/categories" className="hover:text-mocha-800">Categories</Link>
                                    <span>/</span>
                                    <span className="text-mocha-800 font-medium">{category.name}</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                    {category.name}
                                </h1>
                                <p className="text-gray-500 max-w-2xl">
                                    {category.description}
                                </p>
                            </div>

                            {/* Optional: Add category image as a banner background or side image */}
                        </div>
                    </div>
                </div>

                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters (Placeholder for now) */}
                        <aside className="w-full lg:w-64 flex-shrink-0">
                            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-28">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-900">Filters</h3>
                                    <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                                </div>

                                {/* Price Range Mockup */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
                                    <div className="flex items-center gap-2">
                                        <input type="number" placeholder="Min" className="w-full px-3 py-2 border rounded-lg text-sm" />
                                        <span>-</span>
                                        <input type="number" placeholder="Max" className="w-full px-3 py-2 border rounded-lg text-sm" />
                                    </div>
                                </div>

                                {/* Rating Mockup */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Rating</h4>
                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map((rating) => (
                                            <label key={rating} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="rounded border-gray-300" />
                                                <span className="text-sm text-gray-600">{rating} Stars & Up</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-gray-600">
                                    Showing <span className="font-bold text-gray-900">{products.length}</span> results
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Sort by:</span>
                                    <select className="text-sm border-none bg-transparent font-medium text-gray-900 focus:ring-0 cursor-pointer">
                                        <option>Popularity</option>
                                        <option>Newest</option>
                                        <option>Price: Low to High</option>
                                        <option>Price: High to Low</option>
                                    </select>
                                </div>
                            </div>

                            {products.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                                    <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
                                    <p className="text-gray-500 mb-6">
                                        We couldn't find any products in this category right now.
                                    </p>
                                    <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                                        View All Products
                                    </Link>
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
