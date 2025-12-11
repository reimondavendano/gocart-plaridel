'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    Smartphone, Shirt, Home, Sparkles, Dumbbell, BookOpen,
    Coffee, Gamepad2, ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Smartphone, Shirt, Home, Sparkles, Dumbbell, BookOpen, Coffee, Gamepad2
};

const categoryColors = [
    'from-mocha-400 to-mocha-600',
    'from-dusk-400 to-dusk-600',
    'from-rose-400 to-rose-600',
    'from-amber-400 to-amber-600',
    'from-emerald-400 to-emerald-600',
    'from-violet-400 to-violet-600',
];

export default function CategoriesSection() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
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
                        icon: item.icon,
                        image: item.image,
                        description: item.description,
                        productCount: item.product_count,
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

    // Duplicate categories for seamless loop if enough categories exist
    const displayCategories = categories.length > 5 ? [...categories, ...categories] : categories;

    useEffect(() => {
        if (displayCategories.length === 0) return;

        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationId: number;
        let scrollPosition = 0;
        const scrollSpeed = 0.5; // pixels per frame

        const animate = () => {
            if (!isPaused && scrollContainer && displayCategories.length > 5) {
                scrollPosition += scrollSpeed;

                const halfWidth = scrollContainer.scrollWidth / 2;
                if (scrollPosition >= halfWidth) {
                    scrollPosition = 0;
                }

                scrollContainer.scrollLeft = scrollPosition;
            }
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [isPaused, displayCategories]);

    if (loading) {
        return null;
    }

    return (
        <section className="py-12 bg-gradient-to-b from-cloud-200 to-cloud-100">
            <div className="container-custom">
                {/* Header */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-mocha-900 mb-1">
                            Shop by Category
                        </h2>
                        <p className="text-mocha-600 text-sm">
                            Explore our wide range of product categories
                        </p>
                    </div>
                    <Link
                        href="/categories"
                        className="hidden md:flex items-center gap-2 text-mocha-600 hover:text-mocha-500 text-sm font-medium transition-colors"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Auto-scrolling carousel - contained width */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {displayCategories.map((category, i) => {
                        const Icon = iconMap[category.icon] || Smartphone;
                        const colorIndex = i % categoryColors.length;
                        return (
                            <Link
                                key={`${category.id}-${i}`}
                                href={`/category/${category.slug}`}
                                className="group flex-shrink-0"
                            >
                                <div className="glass-card rounded-2xl p-5 text-center card-hover w-[140px] md:w-[160px]">
                                    <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${categoryColors[colorIndex]} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-sm text-mocha-900 group-hover:text-mocha-600 transition-colors">
                                        {category.name}
                                    </h3>
                                    <p className="text-xs text-mocha-500 mt-0.5">
                                        {category.productCount} products
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile View All */}
                <div className="mt-6 text-center md:hidden">
                    <Link href="/categories" className="text-mocha-600 hover:text-mocha-500 text-sm font-medium inline-flex items-center gap-2">
                        View All Categories
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
