'use client';

import Link from 'next/link';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAppSelector } from '@/store';
import { selectWishlistItems } from '@/store/slices/wishlistSlice';
import { mockProducts } from '@/data/mockup';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import ProductCard from '@/components/product/ProductCard';

export default function WishlistPage() {
    const wishlistIds = useAppSelector(selectWishlistItems);

    // Filter mock products based on wishlist IDs
    const wishlistProducts = mockProducts.filter((p) => wishlistIds.includes(p.id));

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-cloud-200 to-cloud-100">
                {/* Hero / Header */}
                <div className="bg-white border-b border-gray-200 mb-8">
                    <div className="container-custom py-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-2xl bg-red-50 text-red-500">
                                <Heart className="w-8 h-8 fill-red-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-mocha-900">
                                    My Wishlist
                                </h1>
                                <p className="text-mocha-500">
                                    {wishlistIds.length} {wishlistIds.length === 1 ? 'item' : 'items'} saved for later
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container-custom">
                    {wishlistProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {wishlistProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl p-12 text-center max-w-2xl mx-auto">
                            <div className="w-24 h-24 rounded-full bg-cloud-100 flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-12 h-12 text-mocha-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-mocha-900 mb-3">
                                Your wishlist is empty
                            </h2>
                            <p className="text-mocha-600 mb-8 max-w-md mx-auto">
                                Save items you love! Just click the heart icon on any product to add it here.
                            </p>
                            <Link
                                href="/products"
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Start Shopping
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <CartDrawer />
            <SearchModal />
            <ToastContainer />
        </>
    );
}
