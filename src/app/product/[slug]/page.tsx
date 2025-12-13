'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Star, Heart, ShoppingCart, Share2, Shield, Truck, RotateCcw,
    ChevronRight, Minus, Plus, Store as StoreIcon, MessageCircle, Check, Package
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { addToast } from '@/store/slices/uiSlice';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import AuthModal from '@/components/auth/AuthModal';
import ToastContainer from '@/components/ui/Toast';
import ProductCard from '@/components/product/ProductCard';
import { Product, Store, Rating } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAppSelector } from '@/store';
import { setSidebarOpen } from '@/store/slices/uiSlice';
import { X, Send } from 'lucide-react';

export default function ProductPage() {
    const params = useParams();
    const dispatch = useDispatch();
    const [product, setProduct] = useState<Product | null>(null);
    const [store, setStore] = useState<Store | null>(null);
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const { currentUser } = useAppSelector((state) => state.user);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');
    const [loading, setLoading] = useState(true);

    // Inquiry State
    const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
    const [inquiryMessage, setInquiryMessage] = useState('');
    const [sendingInquiry, setSendingInquiry] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const searchParams = useSearchParams();

    const isOwner = !!(currentUser && store && currentUser.id === store.sellerId);

    useEffect(() => {
        if (product && !isOwner && searchParams.get('action') === 'inquire') {
            handleOpenInquiry();
        }
    }, [product, searchParams, isOwner]);


    const handleOpenInquiry = () => {
        if (isOwner) {
            dispatch(addToast({
                type: 'error',
                title: 'Action Not Allowed',
                message: 'You cannot inquire about your own product.'
            }));
            return;
        }

        if (!currentUser) {
            setAuthModalOpen(true);
            return;
        }
        // Template
        if (!inquiryMessage && product) {
            setInquiryMessage(`Hi, I'm interested in the ${product.name}. Could you please provides more details about...`);
        }
        setInquiryModalOpen(true);
    };

    const handleSendInquiry = async () => {
        if (!currentUser || !product || !inquiryMessage.trim()) return;

        setSendingInquiry(true);

        try {
            // Check if conversation exists (optional, or just create new one)
            // For simplicity, create a new conversation or append if we can find one efficiently. 
            // Here we just insert a new conversation for distinct product inquiry.

            // 1. Create Conversation
            const { data: conversationData, error: convError } = await supabase
                .from('conversations')
                .insert({
                    user_id: currentUser.id,
                    store_id: product.storeId,
                    product_id: product.id,
                    subject: `Inquiry: ${product.name}`,
                    status: 'open'
                })
                .select()
                .single();

            if (convError) throw convError;

            // 2. Create Message
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationData.id,
                    sender_id: currentUser.id,
                    sender_role: 'user', // customer
                    content: inquiryMessage,
                    is_read: false
                });

            if (msgError) throw msgError;

            dispatch(addToast({
                type: 'success',
                title: 'Inquiry Sent',
                message: 'The seller has been notified of your inquiry.'
            }));

            setInquiryModalOpen(false);
            setInquiryMessage('');

        } catch (error: any) {
            console.error('Error sending inquiry:', error);
            dispatch(addToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to send inquiry'
            }));
        } finally {
            setSendingInquiry(false);
        }
    };

    useEffect(() => {
        async function fetchProductData() {
            setLoading(true);
            const slug = params.slug as string;

            try {
                // Fetch Product
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (productError || !productData) {
                    console.error('Error fetching product:', productError);
                    setLoading(false);
                    return;
                }

                // Fetch Category to get slug
                let categorySlug = '';
                if (productData.category_id) {
                    const { data: categoryData } = await supabase
                        .from('categories')
                        .select('slug, name')
                        .eq('id', productData.category_id)
                        .single();

                    if (categoryData) {
                        categorySlug = categoryData.slug;
                    }
                }

                const mappedProduct: Product = {
                    id: productData.id,
                    name: productData.name,
                    slug: productData.slug,
                    description: productData.description,
                    price: productData.price,
                    comparePrice: productData.compare_price,
                    images: productData.images || [],
                    category: categorySlug, // Use category slug instead of category_id
                    storeId: productData.store_id,
                    rating: productData.rating || 0,
                    reviewCount: productData.review_count || 0,
                    stock: productData.stock || 0,
                    isNew: productData.is_new || false,
                    aiGenerated: productData.ai_generated || false,
                    tags: productData.tags || []
                };
                setProduct(mappedProduct);

                // Fetch Store
                if (mappedProduct.storeId) {
                    const { data: storeData } = await supabase
                        .from('stores')
                        .select('*')
                        .eq('id', mappedProduct.storeId)
                        .single();

                    if (storeData) {
                        setStore({
                            id: storeData.id,
                            name: storeData.name,
                            slug: storeData.slug,
                            description: storeData.description,
                            logo: storeData.logo,
                            banner: storeData.banner,
                            rating: storeData.rating,
                            totalProducts: storeData.total_products,
                            verified: storeData.verified,
                            createdAt: storeData.created_at,
                            updatedAt: storeData.updated_at || storeData.created_at,
                            sellerId: storeData.seller_id,
                            status: storeData.status as Store['status']
                        });
                    }
                }

                // Fetch Ratings (Placeholder for now as ratings table might not expect same UUIDs)
                setRatings([]);

                // Fetch Related Products (also fetch their category slugs)
                const { data: relatedData } = await supabase
                    .from('products')
                    .select('*, category:categories(slug)')
                    .eq('category_id', productData.category_id)
                    .neq('id', productData.id)
                    .limit(4);

                if (relatedData) {
                    setRelatedProducts(relatedData.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        slug: item.slug,
                        description: item.description,
                        price: item.price,
                        comparePrice: item.compare_price,
                        images: item.images || [],
                        category: item.category?.slug || '',
                        storeId: item.store_id,
                        rating: item.rating || 0,
                        reviewCount: item.review_count || 0,
                        stock: item.stock || 0,
                        isNew: item.is_new || false,
                        aiGenerated: item.ai_generated || false,
                        tags: item.tags || []
                    })));
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (params.slug) {
            fetchProductData();
        }
    }, [params.slug]);

    if (loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
                    <p>Loading product...</p>
                </main>
                <Footer />
            </>
        );
    }

    if (!product) {
        return (
            <>
                <Header />
                <main className="min-h-screen pt-24 pb-16">
                    <div className="container-custom">
                        <div className="glass-card rounded-2xl p-12 text-center">
                            <Package className="w-16 h-16 text-mocha-300 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-mocha-900 mb-2">Product Not Found</h1>
                            <p className="text-mocha-600 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
                            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                                Browse Products
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const discount = product.comparePrice
        ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
        : 0;

    const handleAddToCart = () => {
        dispatch(addToCart({ product, quantity }));
        dispatch(addToast({
            type: 'success',
            title: 'Added to Cart',
            message: `${quantity}x ${product.name} has been added to your cart.`,
        }));
    };

    const handleBuyNow = () => {
        dispatch(addToCart({ product, quantity }));
        dispatch(addToast({
            type: 'info',
            title: 'Proceeding to Checkout',
            message: 'Redirecting to checkout...',
        }));
    };

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-cloud-200 to-cloud-100">
                {/* Breadcrumb */}
                <div className="container-custom mb-6">
                    <nav className="flex items-center gap-2 text-sm text-mocha-500">
                        <Link href="/" className="hover:text-mocha-700 transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/products" className="hover:text-mocha-700 transition-colors">Products</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="capitalize">{product.category}</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-mocha-800 truncate max-w-[200px]">{product.name}</span>
                    </nav>
                </div>

                <div className="container-custom">
                    {/* Main Product Section */}
                    <div className="grid lg:grid-cols-2 gap-8 mb-12">
                        {/* Product Images */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="glass-card rounded-2xl overflow-hidden aspect-square relative group">
                                <img
                                    src={product.images[selectedImage]}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    {product.isNew && (
                                        <span className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold uppercase">
                                            New
                                        </span>
                                    )}
                                    {discount > 0 && (
                                        <span className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-bold">
                                            -{discount}%
                                        </span>
                                    )}
                                    {product.aiGenerated && (
                                        <span className="px-3 py-1 rounded-lg bg-dusk-500 text-white text-xs font-bold">
                                            AI ✨
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Thumbnail Images */}
                            {product.images.length > 1 && (
                                <div className="flex gap-3">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx
                                                ? 'border-mocha-500 ring-2 ring-mocha-200'
                                                : 'border-transparent hover:border-mocha-300'
                                                }`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            {/* Store Info */}
                            {store && (
                                <Link
                                    href={`/store/${store.slug}`}
                                    className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-mocha-100 hover:bg-mocha-200 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden">
                                        <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-mocha-800">{store.name}</p>
                                        <div className="flex items-center gap-1 text-xs text-mocha-500">
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            <span>{store.rating}</span>
                                            <span>•</span>
                                            <span>{store.totalProducts} products</span>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {/* Inquiry Modal */}
                            {inquiryModalOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
                                        <div className="p-4 border-b border-mocha-100 flex items-center justify-between bg-mocha-50">
                                            <h3 className="font-semibold text-mocha-900 flex items-center gap-2">
                                                <MessageCircle className="w-5 h-5 text-mocha-500" />
                                                Inquire about Product
                                            </h3>
                                            <button
                                                onClick={() => setInquiryModalOpen(false)}
                                                className="p-1 hover:bg-mocha-200 rounded-full transition-colors text-mocha-500"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-16 h-16 rounded-lg bg-mocha-100 flex-shrink-0 overflow-hidden border border-mocha-200">
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-mocha-900 line-clamp-2">{product.name}</p>
                                                    <p className="text-sm text-mocha-500 mt-1">₱{product.price.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-mocha-700 mb-2">Your Message</label>
                                                <textarea
                                                    value={inquiryMessage}
                                                    onChange={(e) => setInquiryMessage(e.target.value)}
                                                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50 resize-none h-32"
                                                    placeholder="Type your inquiry here..."
                                                ></textarea>
                                            </div>

                                            <button
                                                onClick={handleSendInquiry}
                                                disabled={sendingInquiry || !inquiryMessage.trim()}
                                                className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {sendingInquiry ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Sending...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Send Inquiry
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Title & Rating */}
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-mocha-900 mb-3">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${i < Math.floor(product.rating)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'fill-mocha-200 text-mocha-200'
                                                    }`}
                                            />
                                        ))}
                                        <span className="ml-2 font-medium text-mocha-800">{product.rating}</span>
                                    </div>
                                    <span className="text-mocha-500">|</span>
                                    <span className="text-mocha-600">{product.reviewCount} Reviews</span>
                                    <span className="text-mocha-500">|</span>
                                    <span className="text-mocha-600">{product.stock} in stock</span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="glass-card rounded-2xl p-5">
                                <div className="flex items-end gap-3 mb-2">
                                    <span className="text-3xl md:text-4xl font-bold text-mocha-900">
                                        ₱{product.price.toLocaleString()}
                                    </span>
                                    {product.comparePrice && (
                                        <>
                                            <span className="text-xl text-mocha-400 line-through">
                                                ₱{product.comparePrice.toLocaleString()}
                                            </span>
                                            <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-semibold rounded-lg">
                                                Save ₱{(product.comparePrice - product.price).toLocaleString()}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <p className="text-sm text-mocha-500">Inclusive of all taxes</p>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4">
                                <span className="text-mocha-700 font-medium">Quantity:</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={product.stock === 0}
                                        className={`w-10 h-10 rounded-xl bg-mocha-100 flex items-center justify-center transition-colors ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-mocha-200'
                                            }`}
                                    >
                                        <Minus className="w-4 h-4 text-mocha-700" />
                                    </button>
                                    <span className="w-16 text-center text-lg font-semibold text-mocha-900">
                                        {product.stock === 0 ? '0' : quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        disabled={product.stock === 0 || quantity >= product.stock}
                                        className={`w-10 h-10 rounded-xl bg-mocha-100 flex items-center justify-center transition-colors ${(product.stock === 0 || quantity >= product.stock)
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-mocha-200'
                                            }`}
                                    >
                                        <Plus className="w-4 h-4 text-mocha-700" />
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className={`flex-1 btn-primary flex items-center justify-center gap-2 !py-4 ${product.stock === 0 ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400 border-gray-400' : ''
                                        }`}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    disabled={product.stock === 0}
                                    className={`flex-1 btn-accent flex items-center justify-center gap-2 !py-4 ${product.stock === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300' : ''
                                        }`}
                                >
                                    Buy Now
                                </button>
                                <button
                                    onClick={() => setIsWishlisted(!isWishlisted)}
                                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${isWishlisted
                                        ? 'bg-red-100 text-red-500'
                                        : 'bg-mocha-100 text-mocha-600 hover:bg-mocha-200'
                                        }`}
                                >
                                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={handleOpenInquiry}
                                    disabled={isOwner}
                                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${isOwner
                                        ? 'bg-cloud-100 text-mocha-300 cursor-not-allowed'
                                        : 'bg-mocha-100 text-mocha-600 hover:bg-mocha-200'
                                        }`}
                                    title={isOwner ? "You cannot inquire on your own product" : "Inquire about this product"}
                                >
                                    <MessageCircle className="w-6 h-6" />
                                </button>
                                <button className="w-14 h-14 rounded-xl bg-mocha-100 text-mocha-600 hover:bg-mocha-200 flex items-center justify-center transition-colors">
                                    <Share2 className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="glass-card rounded-xl p-4 text-center">
                                    <Truck className="w-6 h-6 text-mocha-500 mx-auto mb-2" />
                                    <p className="text-xs text-mocha-700 font-medium">Free Shipping</p>
                                    <p className="text-[10px] text-mocha-500">Orders over ₱2000</p>
                                </div>
                                <div className="glass-card rounded-xl p-4 text-center">
                                    <RotateCcw className="w-6 h-6 text-mocha-500 mx-auto mb-2" />
                                    <p className="text-xs text-mocha-700 font-medium">Easy Returns</p>
                                    <p className="text-[10px] text-mocha-500">7-day return policy</p>
                                </div>
                                <div className="glass-card rounded-xl p-4 text-center">
                                    <Shield className="w-6 h-6 text-mocha-500 mx-auto mb-2" />
                                    <p className="text-xs text-mocha-700 font-medium">Secure Payment</p>
                                    <p className="text-[10px] text-mocha-500">100% protected</p>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 rounded-full bg-mocha-100 text-mocha-600 text-sm"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="glass-card rounded-2xl overflow-hidden mb-12">
                        {/* Tab Headers */}
                        <div className="flex border-b border-mocha-200">
                            {[
                                { id: 'description', label: 'Description' },
                                { id: 'reviews', label: `Reviews (${product.reviewCount})` },
                                { id: 'shipping', label: 'Shipping Info' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                        ? 'text-mocha-800'
                                        : 'text-mocha-500 hover:text-mocha-700'
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-mocha-500" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'description' && (
                                <div className="prose prose-mocha max-w-none">
                                    <p className="text-mocha-700 leading-relaxed">
                                        {product.description}
                                    </p>
                                    <h3 className="text-lg font-semibold text-mocha-900 mt-6 mb-3">Key Features</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2 text-mocha-700">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            Premium quality materials for durability
                                        </li>
                                        <li className="flex items-start gap-2 text-mocha-700">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            Designed for maximum comfort and performance
                                        </li>
                                        <li className="flex items-start gap-2 text-mocha-700">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            Modern design that fits any style
                                        </li>
                                        <li className="flex items-start gap-2 text-mocha-700">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            1-year manufacturer warranty included
                                        </li>
                                    </ul>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-6">
                                    {ratings.length > 0 ? (
                                        ratings.map(rating => (
                                            <div key={rating.id} className="flex gap-4 pb-6 border-b border-mocha-100 last:border-0">
                                                <img
                                                    src={rating.userAvatar}
                                                    alt={rating.userName}
                                                    className="w-12 h-12 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="font-medium text-mocha-900">{rating.userName}</span>
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-4 h-4 ${i < rating.rating
                                                                        ? 'fill-amber-400 text-amber-400'
                                                                        : 'fill-mocha-200 text-mocha-200'
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-mocha-500">
                                                            {new Date(rating.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-mocha-700">{rating.review}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <MessageCircle className="w-12 h-12 text-mocha-300 mx-auto mb-3" />
                                            <p className="text-mocha-600">No reviews yet. Be the first to review!</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'shipping' && (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Truck className="w-5 h-5 text-mocha-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-mocha-900">Standard Delivery</h4>
                                            <p className="text-sm text-mocha-600">3-5 business days • ₱150</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Package className="w-5 h-5 text-mocha-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-mocha-900">Express Delivery</h4>
                                            <p className="text-sm text-mocha-600">1-2 business days • ₱250</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <RotateCcw className="w-5 h-5 text-mocha-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-mocha-900">Returns Policy</h4>
                                            <p className="text-sm text-mocha-600">Free returns within 7 days of delivery</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold text-mocha-900 mb-6">You May Also Like</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {relatedProducts.map(p => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <CartDrawer />
            <SearchModal />
            <ToastContainer />
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </>
    );
}
