'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Package, Search, Star, Eye, Trash2, ChevronDown,
    Image as ImageIcon, Store, DollarSign, X, Sparkles,
    AlertTriangle, Tag, Ban, ShieldAlert, ToggleLeft, ToggleRight, Loader2
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
    tags: string[];
    is_featured: boolean;
    is_new: boolean;
    ai_generated: boolean;
    is_disabled: boolean;
    is_disabled_by_admin: boolean;
    disabled_by_admin_notes: string | null;
    created_at: string;
    updated_at: string;
    store: { id: string; name: string; slug: string } | null;
    category: { name: string; slug: string } | null;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'admin_disabled'>('all');
    const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);

    // Modal State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [disableNotes, setDisableNotes] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    store:stores(id, name, slug),
                    category:categories(name, slug)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts((data || []).map(p => ({
                ...p,
                is_disabled: p.is_disabled ?? false,
                is_disabled_by_admin: p.is_disabled_by_admin ?? false,
                disabled_by_admin_notes: p.disabled_by_admin_notes ?? null
            })));
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('slug, name').order('name');
        if (data) setCategories(data);
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        setDeleting(true);

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
        } finally {
            setDeleting(false);
        }
    };

    const toggleFeatured = async (product: Product) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_featured: !product.is_featured })
                .eq('id', product.id);

            if (error) throw error;
            fetchProducts();
            if (selectedProduct && selectedProduct.id === product.id) {
                setSelectedProduct({ ...selectedProduct, is_featured: !product.is_featured });
            }
        } catch (error) {
            console.error('Error toggling featured:', error);
        }
    };

    // Admin Disable Functions
    const openDisableModal = (product: Product) => {
        setSelectedProduct(product);
        setDisableNotes(product.disabled_by_admin_notes || '');
        setShowDisableModal(true);
    };

    const handleAdminDisable = async () => {
        if (!selectedProduct) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('products')
                .update({
                    is_disabled_by_admin: true,
                    disabled_by_admin_notes: disableNotes || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedProduct.id);

            if (error) throw error;

            setShowDisableModal(false);
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            console.error('Error disabling product:', error);
            alert('Failed to disable product');
        } finally {
            setSaving(false);
        }
    };

    const handleAdminEnable = async (product: Product) => {
        if (!confirm('Enable this product? This will remove the admin restriction.')) return;

        try {
            const { error } = await supabase
                .from('products')
                .update({
                    is_disabled_by_admin: false,
                    disabled_by_admin_notes: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', product.id);

            if (error) throw error;

            fetchProducts();
            if (selectedProduct && selectedProduct.id === product.id) {
                setSelectedProduct({
                    ...selectedProduct,
                    is_disabled_by_admin: false,
                    disabled_by_admin_notes: null
                });
            }
        } catch (error) {
            console.error('Error enabling product:', error);
            alert('Failed to enable product');
        }
    };

    const openProductDetail = (product: Product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    // Filtering
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category?.slug === categoryFilter;

        let matchesStatus = true;
        if (statusFilter === 'active') {
            matchesStatus = !product.is_disabled && !product.is_disabled_by_admin;
        } else if (statusFilter === 'disabled') {
            matchesStatus = product.is_disabled && !product.is_disabled_by_admin;
        } else if (statusFilter === 'admin_disabled') {
            matchesStatus = product.is_disabled_by_admin;
        }

        return matchesSearch && matchesCategory && matchesStatus;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Stats
    const totalProducts = products.length;
    const featuredProducts = products.filter(p => p.is_featured).length;
    const adminDisabled = products.filter(p => p.is_disabled_by_admin).length;
    const sellerDisabled = products.filter(p => p.is_disabled && !p.is_disabled_by_admin).length;
    const outOfStock = products.filter(p => p.stock === 0).length;

    const getProductStatus = (product: Product) => {
        if (product.is_disabled_by_admin) {
            return { label: 'Admin Disabled', color: 'bg-red-100 text-red-700', icon: <ShieldAlert className="w-3 h-3" /> };
        }
        if (product.is_disabled) {
            return { label: 'Seller Disabled', color: 'bg-orange-100 text-orange-700', icon: <Ban className="w-3 h-3" /> };
        }
        return { label: 'Active', color: 'bg-green-100 text-green-700', icon: <ToggleRight className="w-3 h-3" /> };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Products</h1>
                    <p className="text-mocha-500">Manage all products across all stores</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{totalProducts}</p>
                            <p className="text-sm text-mocha-500">Total</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{featuredProducts}</p>
                            <p className="text-sm text-mocha-500">Featured</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{adminDisabled}</p>
                            <p className="text-sm text-mocha-500">Admin Disabled</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Ban className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{sellerDisabled}</p>
                            <p className="text-sm text-mocha-500">Seller Disabled</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{outOfStock}</p>
                            <p className="text-sm text-mocha-500">Out of Stock</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 shadow-sm"
                    />
                </div>
                <div className="relative">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="appearance-none px-4 py-3 pr-10 bg-white border border-mocha-200 rounded-xl text-mocha-700 focus:outline-none focus:border-mocha-400 cursor-pointer shadow-sm"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400 pointer-events-none" />
                </div>
                <div className="flex gap-2">
                    {(['all', 'active', 'disabled', 'admin_disabled'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === status
                                    ? 'bg-mocha-600 text-white'
                                    : 'bg-white border border-mocha-200 text-mocha-600 hover:bg-mocha-50'
                                }`}
                        >
                            {status === 'all' ? 'All' :
                                status === 'active' ? 'Active' :
                                    status === 'disabled' ? 'Seller Disabled' : 'Admin Disabled'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-mocha-500">
                        <Package className="w-12 h-12 mb-3 opacity-50" />
                        <p className="font-medium">No products found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-mocha-100 bg-mocha-50">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Product</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Store</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Price</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Stock</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Status</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-mocha-100">
                                {filteredProducts.map((product) => {
                                    const status = getProductStatus(product);
                                    return (
                                        <tr key={product.id} className={`hover:bg-mocha-50 transition-colors cursor-pointer ${product.is_disabled_by_admin ? 'bg-red-50/50' : ''}`} onClick={() => openProductDetail(product)}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-mocha-100 overflow-hidden flex-shrink-0 relative">
                                                        {product.images?.[0] ? (
                                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageIcon className="w-5 h-5 text-mocha-400" />
                                                            </div>
                                                        )}
                                                        {product.is_disabled_by_admin && (
                                                            <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                                                                <ShieldAlert className="w-5 h-5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-mocha-900">{product.name}</p>
                                                        <p className="text-sm text-mocha-500">{product.category?.name || 'Uncategorized'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Store className="w-4 h-4 text-mocha-400" />
                                                    <span className="text-sm text-mocha-700">{product.store?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-mocha-900">{formatCurrency(product.price)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-700' :
                                                    product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {product.stock} in stock
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openProductDetail(product); }}
                                                        className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {product.is_disabled_by_admin ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAdminEnable(product); }}
                                                            className="p-2 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                                                            title="Enable Product"
                                                        >
                                                            <ToggleRight className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openDisableModal(product); }}
                                                            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                                            title="Disable Product"
                                                        >
                                                            <ShieldAlert className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }}
                                                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Product Detail Modal */}
            {showModal && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-mocha-100 bg-mocha-50 flex items-center justify-between">
                            <h2 className="font-bold text-mocha-900">Product Details</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-mocha-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-mocha-500" />
                            </button>
                        </div>

                        {/* Admin Disabled Warning */}
                        {selectedProduct.is_disabled_by_admin && (
                            <div className="bg-red-50 border-b border-red-200 p-4">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-red-800">Product Disabled by Admin</p>
                                        {selectedProduct.disabled_by_admin_notes && (
                                            <p className="text-sm text-red-700 mt-1">{selectedProduct.disabled_by_admin_notes}</p>
                                        )}
                                        <button
                                            onClick={() => handleAdminEnable(selectedProduct)}
                                            className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            Enable Product
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Product Header */}
                            <div className="flex gap-6">
                                <div className="w-32 h-32 rounded-xl bg-mocha-100 overflow-hidden flex-shrink-0">
                                    {selectedProduct.images?.[0] ? (
                                        <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-8 h-8 text-mocha-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-mocha-900">{selectedProduct.name}</h3>
                                            <p className="text-mocha-500">/{selectedProduct.slug}</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {selectedProduct.is_featured && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                                                    <Sparkles className="w-3 h-3" /> Featured
                                                </span>
                                            )}
                                            {(() => {
                                                const s = getProductStatus(selectedProduct); return (
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${s.color}`}>
                                                        {s.icon} {s.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                            <span className="font-medium text-mocha-900">{selectedProduct.rating?.toFixed(1) || '0.0'}</span>
                                            <span className="text-mocha-500">({selectedProduct.review_count} reviews)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Product Images */}
                            {selectedProduct.images && selectedProduct.images.length > 1 && (
                                <div>
                                    <h4 className="font-medium text-mocha-900 mb-2">All Images</h4>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {selectedProduct.images.map((img, idx) => (
                                            <img key={idx} src={img} alt={`${selectedProduct.name} ${idx + 1}`} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Product Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-mocha-50 rounded-xl p-4 text-center">
                                    <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                    <p className="text-lg font-bold text-mocha-900">{formatCurrency(selectedProduct.price)}</p>
                                    <p className="text-sm text-mocha-500">Price</p>
                                </div>
                                <div className="bg-mocha-50 rounded-xl p-4 text-center">
                                    <Package className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                    <p className="text-lg font-bold text-mocha-900">{selectedProduct.stock}</p>
                                    <p className="text-sm text-mocha-500">In Stock</p>
                                </div>
                                <div className="bg-mocha-50 rounded-xl p-4 text-center">
                                    <Tag className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                    <p className="text-lg font-bold text-mocha-900">{selectedProduct.category?.name || 'N/A'}</p>
                                    <p className="text-sm text-mocha-500">Category</p>
                                </div>
                                <div className="bg-mocha-50 rounded-xl p-4 text-center">
                                    <Store className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                                    <p className="text-lg font-bold text-mocha-900 truncate">{selectedProduct.store?.name}</p>
                                    <p className="text-sm text-mocha-500">Store</p>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedProduct.description && (
                                <div className="bg-mocha-50 rounded-xl p-4">
                                    <h4 className="font-medium text-mocha-900 mb-2">Description</h4>
                                    <p className="text-mocha-600 text-sm whitespace-pre-wrap">{selectedProduct.description}</p>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-mocha-50 rounded-xl p-4">
                                    <p className="text-mocha-500">Created</p>
                                    <p className="font-medium text-mocha-900">{formatDate(selectedProduct.created_at)}</p>
                                </div>
                                <div className="bg-mocha-50 rounded-xl p-4">
                                    <p className="text-mocha-500">Last Updated</p>
                                    <p className="font-medium text-mocha-900">{formatDate(selectedProduct.updated_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-mocha-100 bg-mocha-50 flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleFeatured(selectedProduct)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${selectedProduct.is_featured
                                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                            : 'bg-mocha-100 text-mocha-700 hover:bg-mocha-200'
                                        }`}
                                >
                                    {selectedProduct.is_featured ? 'Remove Featured' : 'Mark Featured'}
                                </button>
                                {!selectedProduct.is_disabled_by_admin && (
                                    <button
                                        onClick={() => openDisableModal(selectedProduct)}
                                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        <ShieldAlert className="w-4 h-4" />
                                        Disable by Admin
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => deleteProduct(selectedProduct.id)}
                                    disabled={deleting}
                                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Disable Modal */}
            {showDisableModal && selectedProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-mocha-100 bg-red-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-red-600" />
                                <h3 className="font-bold text-red-800">Disable Product</h3>
                            </div>
                            <button onClick={() => setShowDisableModal(false)} className="p-1 hover:bg-red-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-red-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-mocha-50 rounded-xl">
                                {selectedProduct.images?.[0] ? (
                                    <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-12 h-12 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-mocha-100 flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-mocha-400" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-mocha-900">{selectedProduct.name}</p>
                                    <p className="text-sm text-mocha-500">{selectedProduct.store?.name}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">
                                    Reason for Disabling <span className="text-mocha-400">(visible to seller)</span>
                                </label>
                                <textarea
                                    value={disableNotes}
                                    onChange={(e) => setDisableNotes(e.target.value)}
                                    placeholder="e.g., Product violates our policy on prohibited items..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400 resize-none"
                                />
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> This will hide the product from the storefront. The seller will be notified and can see the reason you provide.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowDisableModal(false)}
                                    className="px-4 py-2 text-mocha-600 hover:bg-mocha-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdminDisable}
                                    disabled={saving}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Disable Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
