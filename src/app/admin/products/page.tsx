'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Package, Search, Star, Eye, Trash2, Edit, Filter,
    ChevronDown, Image as ImageIcon, Store, DollarSign
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_price: number | null;
    images: string[];
    stock: number;
    in_stock: boolean;
    rating: number;
    review_count: number;
    category_slug: string;
    is_featured: boolean;
    created_at: string;
    store: { name: string } | null;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);

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
                    store:stores(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
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

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category_slug === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
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

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
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
            </div>

            {/* Products Grid */}
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
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Rating</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-mocha-100">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-mocha-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-mocha-100 overflow-hidden flex-shrink-0">
                                                    {product.images?.[0] ? (
                                                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="w-5 h-5 text-mocha-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-mocha-900">{product.name}</p>
                                                    <p className="text-sm text-mocha-500 capitalize">{product.category_slug?.replace('-', ' ')}</p>
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
                                            <div>
                                                <span className="font-medium text-mocha-900">{formatCurrency(product.price)}</span>
                                                {product.compare_price && (
                                                    <span className="ml-2 text-sm text-mocha-400 line-through">
                                                        {formatCurrency(product.compare_price)}
                                                    </span>
                                                )}
                                            </div>
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
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm text-mocha-700">{product.rating || 0}</span>
                                                <span className="text-sm text-mocha-400">({product.review_count || 0})</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
