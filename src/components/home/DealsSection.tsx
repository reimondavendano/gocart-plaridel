'use client';

import Link from 'next/link';
import { Percent, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { mockProducts } from '@/data/mockup';

export default function DealsSection() {
    const dealProducts = mockProducts.filter(p => p.comparePrice);

    return (
        <section className="py-12">
            <div className="container-custom">
                {/* Header */}
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Percent className="w-5 h-5 text-red-500" />
                            <span className="text-red-500 font-semibold text-sm">Limited Time</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-mocha-900">
                            Best Deals for You
                        </h2>
                    </div>
                    <Link
                        href="/deals"
                        className="hidden md:flex items-center gap-2 text-mocha-600 hover:text-mocha-500 text-sm font-medium transition-colors"
                    >
                        View All Deals
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {dealProducts.slice(0, 5).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
