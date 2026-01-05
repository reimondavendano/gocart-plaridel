'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import { deleteFileFromUrl } from '@/lib/storage';
import {
    Search, Plus, Edit, Trash2, Eye, Package, Image as ImageIcon,
    ChevronDown, ShieldAlert, Ban, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compare_price: number | null;
    images: string[];
    stock: number;
    in_stock: boolean;
    rating: number;
    review_count: number;
    category_id: string;
    category: { slug: string } | null;
    is_featured: boolean;
    is_new: boolean;
    is_disabled: boolean;
    is_disabled_by_admin: boolean;
    disabled_by_admin_notes: string | null;
    created_at: string;
}

interface Category {
    slug: string;
    name: string;
}

export default function SellerProductsPage() {
    const { currentUser } = useAppSelector((state) => state.user);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [storeId, setStoreId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser?.id) {
            fetchStoreAndProducts();
        }
    }, [currentUser?.id]);

    const fetchStoreAndProducts = async () => {
        try {
            // Get seller's store
            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('seller_id', currentUser?.id)
                .single();

            if (store) {
                setStoreId(store.id);

                // Fetch products with joined category slug AND name
                const { data: productsData } = await supabase
                    .from('products')
                    .select('*, category:categories(slug, name)')
                    .eq('store_id', store.id)
                    .order('created_at', { ascending: false });

                if (productsData) {
                    setProducts(productsData.map(p => ({
                        ...p,
                        is_disabled: p.is_disabled ?? false,
                        is_disabled_by_admin: p.is_disabled_by_admin ?? false,
                        disabled_by_admin_notes: p.disabled_by_admin_notes ?? null
                    })) as Product[]);

                    // Derive categories from fetched products
                    const uniqueCategoriesMap = new Map();
                    productsData.forEach((p: any) => {
                        if (p.category) {
                            uniqueCategoriesMap.set(p.category.slug, p.category.name);
                        }
                    });

                    const derivedCategories = Array.from(uniqueCategoriesMap.entries()).map(([slug, name]) => ({
                        slug,
                        name
                    })).sort((a, b) => a.name.localeCompare(b.name));

                    setCategories(derivedCategories);
                }
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId: string) => {
        try {
            // Find product to get images
            const productToDelete = products.find(p => p.id === productId);

            // Delete images from storage
            if (productToDelete && productToDelete.images && productToDelete.images.length > 0) {
                await Promise.all(productToDelete.images.map(url => deleteFileFromUrl(url)));
            }

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (!error) {
                setProducts(products.filter(p => p.id !== productId));
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
        setDeleteModal(null);
    };

    // Toggle product disabled status (by seller)
    const toggleDisabled = async (product: Product) => {
        if (product.is_disabled_by_admin) return; // Cannot toggle if disabled by admin

        try {
            const { error } = await supabase
                .from('products')
                .update({ is_disabled: !product.is_disabled })
                .eq('id', product.id);

            if (!error) {
                setProducts(products.map(p =>
                    p.id === product.id ? { ...p, is_disabled: !p.is_disabled } : p
                ));
            }
        } catch (error) {
            console.error('Error toggling product:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category?.slug === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Stats
    const adminDisabledCount = products.filter(p => p.is_disabled_by_admin).length;
    const sellerDisabledCount = products.filter(p => p.is_disabled && !p.is_disabled_by_admin).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Products</h1>
                    <p className="text-mocha-500">Manage your product catalog</p>
                </div>
                <Link
                    href="/seller/products/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mocha-500 hover:bg-mocha-600 text-white font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                    />
                </div>
                <div className="relative">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="appearance-none px-4 py-3 pr-10 bg-white border border-mocha-200 rounded-xl text-mocha-900 focus:outline-none focus:border-mocha-400 cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400 pointer-events-none" />
                </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-mocha-100 p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-mocha-100 flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-mocha-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-mocha-900 mb-2">No products found</h3>
                    <p className="text-mocha-500 mb-6">
                        {searchQuery || categoryFilter !== 'all'
                            ? 'Try adjusting your search or filter'
                            : 'Start by adding your first product'}
                    </p>
                    <Link
                        href="/seller/products/new"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mocha-500 hover:bg-mocha-600 text-white font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Product
                    </Link>
                </div>
            ) : (
                <>
                    {/* Admin Disabled Warning */}
                    {adminDisabledCount > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-800">{adminDisabledCount} product{adminDisabledCount > 1 ? 's' : ''} disabled by Admin</h3>
                                <p className="text-sm text-red-700">Some of your products have been disabled by the platform administrator. Please review the notes below for each affected product.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow group ${product.is_disabled_by_admin ? 'border-red-300 bg-red-50/30' :
                                product.is_disabled ? 'border-orange-300 bg-orange-50/30' : 'border-mocha-100'
                                }`}>
                                {/* Admin Disabled Banner */}
                                {product.is_disabled_by_admin && (
                                    <div className="bg-red-100 border-b border-red-200 px-3 py-2">
                                        <div className="flex items-center gap-2 text-red-700">
                                            <ShieldAlert className="w-4 h-4" />
                                            <span className="text-xs font-semibold">Disabled by Admin</span>
                                        </div>
                                        {product.disabled_by_admin_notes && (
                                            <p className="text-xs text-red-600 mt-1 line-clamp-2">{product.disabled_by_admin_notes}</p>
                                        )}
                                    </div>
                                )}
                                {/* Seller Disabled Banner */}
                                {product.is_disabled && !product.is_disabled_by_admin && (
                                    <div className="bg-orange-100 border-b border-orange-200 px-3 py-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-orange-700">
                                            <Ban className="w-4 h-4" />
                                            <span className="text-xs font-semibold">Product Disabled</span>
                                        </div>
                                        <button
                                            onClick={() => toggleDisabled(product)}
                                            className="text-xs text-orange-700 hover:text-orange-900 font-medium underline"
                                        >
                                            Enable
                                        </button>
                                    </div>
                                )}
                                {/* Product Image */}
                                <div className={`relative aspect-square bg-mocha-100 ${product.is_disabled || product.is_disabled_by_admin ? 'opacity-60' : ''}`}>
                                    {product.images?.[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-12 h-12 text-mocha-300" />
                                        </div>
                                    )}
                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {product.is_featured && (
                                            <span className="px-2 py-1 rounded-lg bg-mocha-500 text-white text-xs font-medium">
                                                Featured
                                            </span>
                                        )}
                                        {product.is_new && (
                                            <span className="px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-medium">
                                                New
                                            </span>
                                        )}
                                        {!product.in_stock && (
                                            <span className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-medium">
                                                Out of Stock
                                            </span>
                                        )}
                                    </div>
                                    {/* Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Link
                                            href={`/product/${product.slug}`}
                                            className="p-2 rounded-lg bg-white/90 hover:bg-white text-mocha-700 transition-colors"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </Link>
                                        <Link
                                            href={`/seller/products/${product.id}/edit`}
                                            className="p-2 rounded-lg bg-white/90 hover:bg-white text-mocha-700 transition-colors"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() => setDeleteModal(product.id)}
                                            className="p-2 rounded-lg bg-white/90 hover:bg-white text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                {/* Product Info */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-mocha-900 truncate">{product.name}</h3>
                                            <p className="text-sm text-mocha-500 capitalize">{product.category?.slug?.replace('-', ' ')}</p>
                                        </div>
                                        {/* Disable Toggle Button */}
                                        {!product.is_disabled_by_admin && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleDisabled(product); }}
                                                className={`p-1.5 rounded-lg transition-colors ${product.is_disabled
                                                    ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                                    : 'bg-mocha-100 text-mocha-500 hover:bg-mocha-200'
                                                    }`}
                                                title={product.is_disabled ? 'Enable Product' : 'Disable Product'}
                                            >
                                                {product.is_disabled ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <div>
                                            <span className="text-lg font-bold text-mocha-900">{formatCurrency(product.price)}</span>
                                            {product.compare_price && (
                                                <span className="ml-2 text-sm text-mocha-400 line-through">
                                                    {formatCurrency(product.compare_price)}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-mocha-500">{product.stock} in stock</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold text-mocha-900 mb-2">Delete Product?</h3>
                        <p className="text-mocha-500 mb-6">This action cannot be undone. The product will be permanently removed.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-mocha-100 hover:bg-mocha-200 text-mocha-700 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteModal)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

