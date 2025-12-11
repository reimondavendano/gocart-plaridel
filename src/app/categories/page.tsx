'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Smartphone, Shirt, Home, Sparkles, Dumbbell, BookOpen,
    ArrowRight, Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import { Category } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Smartphone, Shirt, Home, Sparkles, Dumbbell, BookOpen
};

const categoryColors = [
    'from-blue-500 to-blue-700',
    'from-rose-500 to-rose-700',
    'from-amber-500 to-amber-700',
    'from-pink-500 to-pink-700',
    'from-emerald-500 to-emerald-700',
    'from-violet-500 to-violet-700',
];

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const { data, error } = await supabase
                    .from('categories')
                    .select('*');

                if (error) {
                    console.error('Error fetching categories:', error);
                    return;
                }

                if (data) {
                    const mappedCategories: Category[] = data.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        slug: item.slug,
                        description: item.description,
                        image: item.image || '/placeholder-category.jpg',
                        icon: item.icon,
                        productCount: item.product_count || 0
                    }));
                    setCategories(mappedCategories);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCategories();
    }, []);

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-cloud-200 to-cloud-100">
                {/* Hero Section */}
                <div className="gradient-premium py-12 md:py-16 mb-8">
                    <div className="container-custom text-center">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                            Shop by Category
                        </h1>
                        <p className="text-white/80 text-lg max-w-2xl mx-auto">
                            Browse our wide selection of products organized by category
                        </p>
                    </div>
                </div>

                <div className="container-custom">
                    {/* Categories Grid */}
                    {loading ? (
                        <div className="text-center py-20 text-mocha-500">Loading categories...</div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map((category, index) => {
                                const Icon = iconMap[category.icon] || Smartphone;
                                const colorClass = categoryColors[index % categoryColors.length];

                                return (
                                    <Link
                                        key={category.id}
                                        href={`/category/${category.slug}`}
                                        className="group"
                                    >
                                        <div className="glass-card rounded-2xl overflow-hidden card-hover">
                                            {/* Category Image */}
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                                                {/* Icon Badge */}
                                                <div className={`absolute top-4 right-4 w-14 h-14 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}>
                                                    <Icon className="w-7 h-7 text-white" />
                                                </div>

                                                {/* Category Name on Image */}
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:translate-x-2 transition-transform">
                                                        {category.name}
                                                    </h3>
                                                    <p className="text-white/80 text-sm">
                                                        {category.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Category Info */}
                                            <div className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-mocha-600">
                                                        <Package className="w-4 h-4" />
                                                        <span className="text-sm">
                                                            <span className="font-semibold text-mocha-800">{category.productCount}</span> products
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-mocha-500 group-hover:text-mocha-700 group-hover:translate-x-1 transition-all">
                                                        <span className="text-sm font-medium">Browse</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Featured Categories Banner */}
                    <div className="mt-12 glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-mocha-300/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-dusk-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 text-center">
                            <h2 className="text-2xl md:text-3xl font-bold text-mocha-900 mb-4">
                                Can&apos;t find what you&apos;re looking for?
                            </h2>
                            <p className="text-mocha-600 mb-6 max-w-xl mx-auto">
                                Browse all our products or use our search feature to find exactly what you need
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/products" className="btn-primary inline-flex items-center justify-center gap-2">
                                    View All Products
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
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
