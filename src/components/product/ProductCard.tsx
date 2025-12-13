'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Heart, ShoppingCart, Eye, MessageCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { Product } from '@/types';
import { addToCart } from '@/store/slices/cartSlice';
import { addToast } from '@/store/slices/uiSlice';
import { toggleWishlist, selectIsInWishlist } from '@/store/slices/wishlistSlice';

interface ProductCardProps {
    product: Product;
    variant?: 'default' | 'compact' | 'featured';
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const isInWishlist = useAppSelector(selectIsInWishlist(product.id));

    const discount = product.comparePrice
        ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
        : 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(addToCart({ product, quantity: 1 }));
        dispatch(addToast({
            type: 'success',
            title: 'Added to Cart',
            message: `${product.name} has been added to your cart.`,
        }));
    };

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(toggleWishlist(product.id));
        dispatch(addToast({
            type: 'info',
            title: isInWishlist ? 'Removed from Wishlist' : 'Added to Wishlist',
            message: isInWishlist
                ? `${product.name} has been removed from your wishlist.`
                : `${product.name} has been added to your wishlist.`,
        }));
    };

    if (variant === 'compact') {
        return (
            <Link href={`/product/${product.slug}`} className="flex gap-3 p-2.5 rounded-xl glass-card card-hover group">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-mocha-900 truncate group-hover:text-mocha-600 transition-colors">
                        {product.name}
                    </h4>
                    <p className="text-xs text-mocha-500 mt-0.5">{product.storeName}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-bold text-sm text-mocha-700">₱{product.price.toLocaleString()}</span>
                        {product.comparePrice && (
                            <span className="text-xs text-mocha-400 line-through">₱{product.comparePrice.toLocaleString()}</span>
                        )}
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link href={`/product/${product.slug}`} className="group">
            <div className="glass-card rounded-xl overflow-hidden card-hover">
                {/* Image Container - Compact 4:3 aspect ratio */}
                <div className="relative aspect-[4/3] overflow-hidden bg-cloud-200">
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />

                    {/* Badges */}
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                        {product.isNew && (
                            <span className="px-1.5 py-0.5 rounded bg-green-500 text-white text-[9px] font-bold uppercase tracking-wide">
                                New
                            </span>
                        )}
                        {discount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold">
                                -{discount}%
                            </span>
                        )}
                        {product.aiGenerated && (
                            <span className="px-1.5 py-0.5 rounded bg-dusk-500 text-white text-[9px] font-bold">
                                AI ✨
                            </span>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <button
                            onClick={handleWishlist}
                            className={`w-6 h-6 rounded-md backdrop-blur flex items-center justify-center shadow transition-colors ${isInWishlist ? 'bg-red-50 hover:bg-red-100' : 'bg-white/90 hover:bg-white'
                                }`}
                        >
                            <Heart className={`w-3 h-3 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-mocha-600'}`} />
                        </button>
                        <button className="w-6 h-6 rounded-md bg-white/90 backdrop-blur hover:bg-white flex items-center justify-center shadow">
                            <Eye className="w-3 h-3 text-mocha-600" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/product/${product.slug}?action=inquire`);
                            }}
                            className="w-6 h-6 rounded-md bg-white/90 backdrop-blur hover:bg-white flex items-center justify-center shadow"
                            title="Inquire"
                        >
                            <MessageCircle className="w-3 h-3 text-mocha-600" />
                        </button>
                    </div>

                    {/* Add to Cart */}
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <button
                            onClick={handleAddToCart}
                            className="w-full bg-mocha-500 hover:bg-mocha-600 text-white py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                            <ShoppingCart className="w-3 h-3" />
                            Add to Cart
                        </button>
                    </div>
                </div>

                {/* Content - Compact spacing */}
                <div className="p-2.5">
                    <p className="text-[10px] text-mocha-500 truncate uppercase tracking-wide">{product.storeName || 'Unknown Store'}</p>
                    <h3 className="font-medium text-xs text-mocha-900 group-hover:text-mocha-600 transition-colors line-clamp-2 mt-0.5 leading-snug min-h-[32px]">
                        {product.name}
                    </h3>

                    {/* Rating - Smaller */}
                    <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-medium text-mocha-700">{product.rating}</span>
                        <span className="text-[10px] text-mocha-400">({product.reviewCount})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-sm font-bold text-mocha-800">
                            ₱{product.price.toLocaleString()}
                        </span>
                        {product.comparePrice && (
                            <span className="text-[10px] text-mocha-400 line-through">
                                ₱{product.comparePrice.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
