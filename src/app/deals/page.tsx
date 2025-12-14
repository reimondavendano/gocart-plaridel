'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Clock, Zap, Tag, Percent, ArrowRight, Flame, ShoppingBag, Calendar, Package, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import ProductCard from '@/components/product/ProductCard';
import { Product } from '@/types';

interface Deal {
    id: string;
    title: string;
    description: string;
    deal_type: 'flash_sale' | 'clearance' | 'seasonal' | 'bundle' | 'special';
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

const dealTypeFilters = [
    { id: 'all', label: 'All Deals', icon: Tag },
    { id: 'flash_sale', label: 'Flash Deals', icon: Zap },
    { id: 'clearance', label: 'Clearance', icon: Percent },
    { id: 'seasonal', label: 'Seasonal', icon: Calendar },
    { id: 'bundle', label: 'Bundles', icon: Package },
    { id: 'special', label: 'Special', icon: Star },
];

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [saleProducts, setSaleProducts] = useState<SaleProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            const now = new Date().toISOString();

            // Fetch deals
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
                .lte('start_date', now)
                .gte('end_date', now)
                .order('priority', { ascending: false });

            if (dealsError) {
                console.error('Error fetching deals:', dealsError);
            } else {
                setDeals(dealsData || []);
            }

            // Fetch ALL products that are on sale (have compare_price > price)
            // This is for "All Products" deals
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select(`
                    id, name, slug, description, price, compare_price, images,
                    rating, review_count, in_stock, is_featured, is_new, store_id,
                    category_id, stock, tags,
                    store:stores (id, name, slug)
                `)
                .gt('compare_price', 0)
                .order('created_at', { ascending: false });

            if (productsError) {
                console.error('Error fetching sale products:', productsError);
            } else {
                // Filter products where compare_price > price
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

    // Get banner data from top priority deal
    const bannerData = useMemo(() => {
        if (deals.length === 0) return null;

        const topDeal = deals[0];
        const maxDiscount = Math.max(
            ...deals
                .filter(d => d.discount_type === 'percentage')
                .map(d => d.discount_value),
            0
        );

        return {
            title: topDeal.title || `Up to ${maxDiscount}% Off Today!`,
            description: topDeal.description || 'Grab these amazing deals before they\'re gone! Save big on your favorite products.',
            maxDiscount,
        };
    }, [deals]);

    // Filter deals based on type
    const filteredDeals = filter === 'all'
        ? deals
        : deals.filter(d => d.deal_type === filter);

    // Transform deals to products for ProductCard
    // Includes: deals with specific products + "All Products" deals use saleProducts
    const dealProducts: Product[] = useMemo(() => {
        const products: Product[] = [];
        const addedProductIds = new Set<string>();

        // First, add products from deals with specific product_id
        filteredDeals.forEach(deal => {
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
        const hasAllProductsDeal = filteredDeals.some(d => d.product_id === null);
        if (hasAllProductsDeal) {
            const allProductsDeal = filteredDeals.find(d => d.product_id === null);

            saleProducts.forEach(p => {
                if (!addedProductIds.has(p.id)) {
                    // Use the deal's discount OR the product's existing discount
                    let finalPrice = p.price;
                    let comparePrice = p.compare_price;

                    if (allProductsDeal) {
                        // Apply deal discount
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
    }, [filteredDeals, saleProducts]);

    // Stats
    const flashDealsCount = deals.filter(d => d.deal_type === 'flash_sale').length;
    const maxDiscount = bannerData?.maxDiscount || 0;
    const totalSavings = dealProducts.reduce((acc, p) => {
        if (p.comparePrice) {
            return acc + (p.comparePrice - p.price);
        }
        return acc;
    }, 0);

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-cloud-200 to-cloud-100">
                {/* Hero Section - DYNAMIC based on top deal */}
                <div className="gradient-premium py-12 md:py-16 mb-8 relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="container-custom relative z-10">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur mb-6">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                <span className="text-white font-medium">Limited Time Only</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                                {bannerData?.title || 'Deals & Discounts'}
                            </h1>
                            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                                {bannerData?.description || 'Grab these amazing deals before they\'re gone! Save big on your favorite products.'}
                            </p>

                            {/* Countdown Timer */}
                            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur">
                                <Clock className="w-6 h-6 text-white/80" />
                                <span className="text-white/80 font-medium">Flash Sale Ends In:</span>
                                <div className="flex gap-2">
                                    {['hours', 'minutes', 'seconds'].map((unit, i) => (
                                        <div key={unit} className="flex items-center gap-2">
                                            <div className="bg-white/20 rounded-lg px-3 py-2">
                                                <span className="text-2xl font-bold text-white tabular-nums">
                                                    {String(timeLeft[unit as keyof typeof timeLeft]).padStart(2, '0')}
                                                </span>
                                            </div>
                                            {i < 2 && <span className="text-white/60 text-xl font-bold">:</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container-custom">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="glass-card rounded-xl p-4 text-center">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-3">
                                <Tag className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-2xl font-bold text-mocha-800">{deals.length}</p>
                            <p className="text-sm text-mocha-500">Active Deals</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 text-center">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
                                <Flame className="w-6 h-6 text-orange-500" />
                            </div>
                            <p className="text-2xl font-bold text-mocha-800">{flashDealsCount}</p>
                            <p className="text-sm text-mocha-500">Flash Deals</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 text-center">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                                <Percent className="w-6 h-6 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold text-mocha-800">{maxDiscount}%</p>
                            <p className="text-sm text-mocha-500">Max Discount</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 text-center">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                                <ShoppingBag className="w-6 h-6 text-purple-500" />
                            </div>
                            <p className="text-2xl font-bold text-mocha-800">₱{totalSavings.toLocaleString()}</p>
                            <p className="text-sm text-mocha-500">Total Savings</p>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {dealTypeFilters.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setFilter(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === tab.id
                                            ? 'bg-mocha-500 text-white shadow-lg'
                                            : 'bg-white text-mocha-600 hover:bg-mocha-100'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-mocha-600 hidden md:block">
                            Showing <span className="font-semibold text-mocha-800">{dealProducts.length}</span> deals
                        </p>
                    </div>

                    {/* Products Grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : dealProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {dealProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl p-12 text-center">
                            <Tag className="w-16 h-16 text-mocha-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-mocha-900 mb-2">No Deals Found</h3>
                            <p className="text-mocha-600 mb-6">Check back later for more amazing deals!</p>
                            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                                Browse Products
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                    {/* Newsletter CTA */}
                    <div className="mt-12 glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-mocha-300/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-dusk-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 text-center">
                            <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                            <h2 className="text-2xl md:text-3xl font-bold text-mocha-900 mb-4">
                                Never Miss a Deal!
                            </h2>
                            <p className="text-mocha-600 mb-6 max-w-xl mx-auto">
                                Subscribe to our newsletter and get exclusive deals delivered to your inbox
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-4 py-3 rounded-xl border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                />
                                <button className="btn-primary whitespace-nowrap">
                                    Subscribe
                                </button>
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
