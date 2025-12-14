'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Percent, ArrowRight, Zap, Clock } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

interface Deal {
    id: string;
    title: string;
    description: string;
    deal_type: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    product_id: string | null;
    start_date: string;
    end_date: string;
    is_active: boolean;
    show_on_landing: boolean;
    priority: number;
    product?: {
        id: string;
        name: string;
        slug: string;
        description: string;
        price: number;
        compare_price: number | null;
        images: string[];
        rating: number;
        review_count: number;
        in_stock: boolean;
        is_featured: boolean;
        is_new: boolean;
        store_id: string;
        category_id: string;
        stock: number;
        tags: string[];
        store?: {
            id: string;
            name: string;
            slug: string;
        };
    };
}

interface SaleProduct {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compare_price: number;
    images: string[];
    rating: number;
    review_count: number;
    in_stock: boolean;
    is_featured: boolean;
    is_new: boolean;
    store_id: string;
    category_id: string;
    stock: number;
    tags: string[];
    store?: {
        id: string;
        name: string;
        slug: string;
    };
}

export default function DealsSection() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [saleProducts, setSaleProducts] = useState<SaleProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            const now = new Date().toISOString();

            // Fetch deals for landing page
            const { data: dealsData, error: dealsError } = await supabase
                .from('deals')
                .select(`
                    *,
                    product:products (
                        id, name, slug, description, price, compare_price, images,
                        rating, review_count, in_stock, is_featured, is_new, store_id,
                        category_id, stock, tags,
                        store:stores (id, name, slug)
                    )
                `)
                .eq('is_active', true)
                .eq('show_on_landing', true)
                .lte('start_date', now)
                .gte('end_date', now)
                .order('priority', { ascending: false })
                .limit(5);

            if (dealsError) {
                console.error('Error fetching deals:', dealsError);
            } else {
                setDeals(dealsData || []);
            }

            // Fetch sale products for "All Products" deals
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select(`
                    id, name, slug, description, price, compare_price, images,
                    rating, review_count, in_stock, is_featured, is_new, store_id,
                    category_id, stock, tags,
                    store:stores (id, name, slug)
                `)
                .gt('compare_price', 0)
                .order('created_at', { ascending: false })
                .limit(10);

            if (productsError) {
                console.error('Error fetching sale products:', productsError);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const onSale = (productsData || []).filter((p: any) => p.compare_price && p.compare_price > p.price).map((p: any) => ({
                    ...p,
                    store: Array.isArray(p.store) && p.store.length > 0 ? p.store[0] : (p.store || undefined)
                })) as SaleProduct[];
                setSaleProducts(onSale);
            }

            setIsLoading(false);
        };

        fetchData();
    }, []);

    // Calculate time left based on the nearest ending deal
    useEffect(() => {
        if (deals.length === 0) return;

        // Find the deal that ends soonest
        const nearestEndDate = deals.reduce((nearest, deal) => {
            const endDate = new Date(deal.end_date);
            return endDate < nearest ? endDate : nearest;
        }, new Date(deals[0].end_date));

        const updateTimeLeft = () => {
            const now = new Date();
            const diff = nearestEndDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ hours, minutes, seconds });
        };

        updateTimeLeft();
        const timer = setInterval(updateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [deals]);

    // Calculate dynamic banner data from the TOP DEAL
    const bannerData = useMemo(() => {
        if (deals.length === 0) return null;

        // Get the highest priority deal for the banner
        const topDeal = deals[0];

        // Calculate max discount percentage
        const maxDiscount = Math.max(
            ...deals
                .filter(d => d.discount_type === 'percentage')
                .map(d => d.discount_value),
            0
        );

        // Get deal type label
        const dealTypeLabels: Record<string, string> = {
            flash_sale: 'Flash Sale',
            clearance: 'Clearance Sale',
            seasonal: 'Seasonal Sale',
            bundle: 'Bundle Deal',
            special: 'Special Offer',
        };

        const dealTypeLabel = dealTypeLabels[topDeal.deal_type] || 'Flash Sale';

        // Use the actual deal title (from admin)
        const title = topDeal.title;

        // Use the actual deal description (from admin) or fallback
        const description = topDeal.description || 'Grab exclusive deals before they\'re gone';

        return {
            dealTypeLabel,
            title,
            description,
            maxDiscount,
        };
    }, [deals]);

    // Transform deals to products for ProductCard
    const dealProducts: Product[] = useMemo(() => {
        const products: Product[] = [];
        const addedProductIds = new Set<string>();

        // First, add products from deals with specific product_id
        deals.forEach(deal => {
            if (deal.product && !addedProductIds.has(deal.product.id)) {
                const p = deal.product;
                const originalPrice = p.price;
                const discountedPrice = deal.discount_type === 'percentage'
                    ? originalPrice * (1 - deal.discount_value / 100)
                    : originalPrice - deal.discount_value;

                products.push({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    description: p.description || '',
                    price: Math.max(0, discountedPrice),
                    comparePrice: originalPrice,
                    images: p.images || [],
                    category: p.category_id || '',
                    stock: p.stock || 0,
                    rating: p.rating || 0,
                    reviewCount: p.review_count || 0,
                    tags: p.tags || [],
                    inStock: p.in_stock ?? true,
                    isFeatured: p.is_featured ?? false,
                    isNew: p.is_new ?? false,
                    storeId: p.store_id,
                    store: p.store ? {
                        id: p.store.id,
                        name: p.store.name,
                        slug: p.store.slug,
                    } : undefined,
                });
                addedProductIds.add(p.id);
            }
        });

        // Then, for "All Products" deals, add sale products
        const hasAllProductsDeal = deals.some(d => d.product_id === null);
        if (hasAllProductsDeal && products.length < 5) {
            const allProductsDeal = deals.find(d => d.product_id === null);
            const remainingSlots = 5 - products.length;

            saleProducts.slice(0, remainingSlots).forEach(p => {
                if (!addedProductIds.has(p.id)) {
                    let finalPrice = p.price;
                    let comparePrice = p.compare_price;

                    if (allProductsDeal) {
                        finalPrice = allProductsDeal.discount_type === 'percentage'
                            ? p.price * (1 - allProductsDeal.discount_value / 100)
                            : p.price - allProductsDeal.discount_value;
                        comparePrice = p.price;
                    }

                    products.push({
                        id: p.id,
                        name: p.name,
                        slug: p.slug,
                        description: p.description || '',
                        price: Math.max(0, finalPrice),
                        comparePrice: comparePrice,
                        images: p.images || [],
                        category: p.category_id || '',
                        stock: p.stock || 0,
                        rating: p.rating || 0,
                        reviewCount: p.review_count || 0,
                        tags: p.tags || [],
                        inStock: p.in_stock ?? true,
                        isFeatured: p.is_featured ?? false,
                        isNew: p.is_new ?? false,
                        storeId: p.store_id,
                        store: p.store ? {
                            id: p.store.id,
                            name: p.store.name,
                            slug: p.store.slug,
                        } : undefined,
                    });
                    addedProductIds.add(p.id);
                }
            });
        }

        return products;
    }, [deals, saleProducts]);

    if (isLoading) {
        return null;
    }

    // Don't show section if no deals exist
    if (deals.length === 0) {
        return null;
    }

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
                {dealProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {dealProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-mocha-500">Check back soon for amazing deals!</p>
                    </div>
                )}

                {/* Mobile View All Link */}
                <div className="mt-6 text-center md:hidden">
                    <Link
                        href="/deals"
                        className="inline-flex items-center gap-2 text-mocha-600 hover:text-mocha-500 font-medium transition-colors"
                    >
                        View All Deals
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
