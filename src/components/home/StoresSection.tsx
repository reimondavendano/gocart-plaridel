'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Store as StoreIcon, ShoppingBag } from 'lucide-react';
import { useAppSelector } from '@/store';
import AuthModal from '@/components/auth/AuthModal';
import SellerRegistrationModal from '@/components/seller/SellerRegistrationModal';
import { supabase } from '@/lib/supabase';
import { Store } from '@/types';

export default function StoresSection() {
    const { isAuthenticated } = useAppSelector((state) => state.user);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStores() {
            try {
                const { data, error } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('status', 'approved')
                    .eq('is_subscription_active', true)
                    .limit(6);

                if (error) {
                    console.error('Error fetching stores:', error);
                    return;
                }

                if (data) {
                    // Map DB snake_case to TS camelCase if needed, or rely on type match if they match.
                    // Checking schema: DB columns are snake_case (e.g. seller_id, address_id).
                    // Type Store expects camelCase (sellerId, addressId).
                    // So we need mapping.
                    const mappedStores: Store[] = data.map((item: any) => ({
                        id: item.id,
                        sellerId: item.seller_id,
                        name: item.name,
                        slug: item.slug,
                        description: item.description,
                        logo: item.logo,
                        banner: item.banner,
                        addressId: item.address_id,
                        status: item.status,
                        subscriptionEndsAt: item.subscription_ends_at,
                        isSubscriptionActive: item.is_subscription_active,
                        rating: item.rating,
                        totalReviews: item.total_reviews,
                        totalProducts: item.total_products,
                        totalSales: item.total_sales,
                        createdAt: item.created_at,
                        updatedAt: item.updated_at,
                    }));
                    setStores(mappedStores);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchStores();
    }, []);

    const handleCreateStore = () => {
        if (isAuthenticated) {
            setIsSellerModalOpen(true);
        } else {
            setIsAuthModalOpen(true);
        }
    };

    return (
        <section className="py-20 bg-gradient-to-b from-cloud-100 to-cloud-200">
            <div className="container-custom">
                {/* Header */}
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <StoreIcon className="w-6 h-6 text-mocha-500" />
                            <span className="text-mocha-500 font-semibold">Verified Sellers</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-mocha-900">
                            Top Stores
                        </h2>
                    </div>
                    <Link
                        href="/stores"
                        className="hidden md:flex items-center gap-2 text-mocha-600 hover:text-mocha-500 font-medium transition-colors"
                    >
                        View All Stores
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Stores Grid */}
                {loading ? (
                    <div className="text-center py-10 text-mocha-500">Loading stores...</div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map((store) => (
                            <Link key={store.id} href={`/store/${store.slug}`} className="group">
                                <div className="glass-card rounded-2xl overflow-hidden card-hover">
                                    {/* Banner */}
                                    <div className="h-32 bg-gradient-to-br from-mocha-400 to-mocha-600 relative overflow-hidden">
                                        <img
                                            src={store.banner || '/placeholder-banner.jpg'}
                                            alt={store.name}
                                            className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 -mt-12 relative">
                                        {/* Logo */}
                                        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4 overflow-hidden">
                                            <img
                                                src={store.logo || '/placeholder-logo.jpg'}
                                                alt={store.name}
                                                className="w-16 h-16 object-cover"
                                            />
                                        </div>

                                        <h3 className="text-xl font-bold text-mocha-900 group-hover:text-mocha-600 transition-colors">
                                            {store.name}
                                        </h3>
                                        <p className="text-mocha-500 text-sm line-clamp-2 mt-2">
                                            {store.description}
                                        </p>

                                        {/* Stats */}
                                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-mocha-200">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span className="font-semibold text-mocha-800">{store.rating}</span>
                                                <span className="text-sm text-mocha-500">({store.totalReviews})</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-mocha-500">
                                                <ShoppingBag className="w-4 h-4" />
                                                <span className="text-sm">{store.totalProducts} products</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <div className="text-center mt-12">
                    <button
                        onClick={handleCreateStore}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-mocha-400 text-mocha-700 font-semibold hover:bg-mocha-50 transition-colors"
                    >
                        <StoreIcon className="w-5 h-5" />
                        Create a Store
                    </button>
                </div>
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
            <SellerRegistrationModal
                isOpen={isSellerModalOpen}
                onClose={() => setIsSellerModalOpen(false)}
            />
        </section>
    );
}
