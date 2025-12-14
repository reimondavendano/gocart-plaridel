'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus, Edit2, Trash2, Search, Calendar, Tag,
    Zap, Eye, EyeOff, ArrowUpDown, X, Check, Loader2,
    Flame, Percent, Gift, Package, Star
} from 'lucide-react';

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
    created_at: string;
    product?: {
        id: string;
        name: string;
        price: number;
        images: string[];
        store?: {
            name: string;
        };
    };
}

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    store?: {
        name: string;
    } | null;
}

const dealTypeOptions = [
    { value: 'flash_sale', label: 'Flash Sale', icon: Zap, color: 'text-yellow-500 bg-yellow-100' },
    { value: 'clearance', label: 'Clearance', icon: Percent, color: 'text-red-500 bg-red-100' },
    { value: 'seasonal', label: 'Seasonal', icon: Calendar, color: 'text-green-500 bg-green-100' },
    { value: 'bundle', label: 'Bundle', icon: Package, color: 'text-blue-500 bg-blue-100' },
    { value: 'special', label: 'Special', icon: Star, color: 'text-purple-500 bg-purple-100' },
];

export default function AdminDealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deal_type: 'flash_sale' as Deal['deal_type'],
        discount_type: 'percentage' as Deal['discount_type'],
        discount_value: 10,
        product_id: '',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        is_active: true,
        show_on_landing: false,
        priority: 0,
    });

    useEffect(() => {
        fetchDeals();
        fetchProducts();
    }, []);

    const fetchDeals = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('deals')
            .select(`
                *,
                product:products (
                    id, name, price, images,
                    store:stores (name)
                )
            `)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching deals:', error);
        } else {
            setDeals(data || []);
        }
        setLoading(false);
    };

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select(`
                id, name, price, images,
                stores (name)
            `)
            .order('name');

        if (error) {
            console.error('Error fetching products:', error);
        } else {
            // Transform data to match Product interface
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformedProducts: Product[] = (data || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                images: p.images || [],
                store: p.stores ? { name: p.stores.name } : null
            }));
            setProducts(transformedProducts);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const dealData = {
            ...formData,
            product_id: formData.product_id || null,
        };

        if (editingDeal) {
            const { error } = await supabase
                .from('deals')
                .update(dealData)
                .eq('id', editingDeal.id);

            if (error) {
                console.error('Error updating deal:', error);
                alert('Failed to update deal');
            } else {
                fetchDeals();
                closeModal();
            }
        } else {
            const { error } = await supabase
                .from('deals')
                .insert([dealData]);

            if (error) {
                console.error('Error creating deal:', error);
                alert('Failed to create deal');
            } else {
                fetchDeals();
                closeModal();
            }
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this deal?')) return;

        const { error } = await supabase
            .from('deals')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting deal:', error);
            alert('Failed to delete deal');
        } else {
            fetchDeals();
        }
    };

    const toggleActive = async (deal: Deal) => {
        const { error } = await supabase
            .from('deals')
            .update({ is_active: !deal.is_active })
            .eq('id', deal.id);

        if (error) {
            console.error('Error toggling deal:', error);
        } else {
            fetchDeals();
        }
    };

    const toggleLanding = async (deal: Deal) => {
        const { error } = await supabase
            .from('deals')
            .update({ show_on_landing: !deal.show_on_landing })
            .eq('id', deal.id);

        if (error) {
            console.error('Error toggling landing:', error);
        } else {
            fetchDeals();
        }
    };

    const openCreateModal = () => {
        setEditingDeal(null);
        setFormData({
            title: '',
            description: '',
            deal_type: 'flash_sale',
            discount_type: 'percentage',
            discount_value: 10,
            product_id: '',
            start_date: new Date().toISOString().slice(0, 16),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            is_active: true,
            show_on_landing: false,
            priority: 0,
        });
        setShowModal(true);
    };

    const openEditModal = (deal: Deal) => {
        setEditingDeal(deal);
        setFormData({
            title: deal.title,
            description: deal.description || '',
            deal_type: deal.deal_type,
            discount_type: deal.discount_type,
            discount_value: deal.discount_value,
            product_id: deal.product_id || '',
            start_date: new Date(deal.start_date).toISOString().slice(0, 16),
            end_date: new Date(deal.end_date).toISOString().slice(0, 16),
            is_active: deal.is_active,
            show_on_landing: deal.show_on_landing,
            priority: deal.priority,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingDeal(null);
    };

    const filteredDeals = deals.filter(deal => {
        const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || deal.deal_type === filterType;
        return matchesSearch && matchesFilter;
    });

    const getDealTypeInfo = (type: string) => {
        return dealTypeOptions.find(d => d.value === type) || dealTypeOptions[0];
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const isExpired = (endDate: string) => new Date(endDate) < new Date();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Deals Management</h1>
                    <p className="text-mocha-600">Create and manage promotional deals</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Deal
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{deals.length}</p>
                            <p className="text-sm text-mocha-500">Total Deals</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{deals.filter(d => d.is_active).length}</p>
                            <p className="text-sm text-mocha-500">Active</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{deals.filter(d => d.deal_type === 'flash_sale').length}</p>
                            <p className="text-sm text-mocha-500">Flash Sales</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{deals.filter(d => d.show_on_landing).length}</p>
                            <p className="text-sm text-mocha-500">On Landing</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-mocha-400" />
                        <input
                            type="text"
                            placeholder="Search deals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                    >
                        <option value="all">All Types</option>
                        {dealTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Deals Table */}
            <div className="glass-card rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-mocha-400" />
                    </div>
                ) : filteredDeals.length === 0 ? (
                    <div className="text-center py-12">
                        <Tag className="w-12 h-12 text-mocha-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-mocha-900 mb-1">No deals found</h3>
                        <p className="text-mocha-500">Create your first deal to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-mocha-100/50">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-mocha-700">Deal</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-mocha-700">Type</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-mocha-700">Discount</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-mocha-700">Product</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-mocha-700">Duration</th>
                                    <th className="text-center px-4 py-3 text-sm font-semibold text-mocha-700">Status</th>
                                    <th className="text-center px-4 py-3 text-sm font-semibold text-mocha-700">Landing</th>
                                    <th className="text-right px-4 py-3 text-sm font-semibold text-mocha-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-mocha-100">
                                {filteredDeals.map((deal) => {
                                    const typeInfo = getDealTypeInfo(deal.deal_type);
                                    const TypeIcon = typeInfo.icon;
                                    const expired = isExpired(deal.end_date);

                                    return (
                                        <tr key={deal.id} className={`hover:bg-mocha-50/50 ${expired ? 'opacity-50' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-mocha-100 flex items-center justify-center">
                                                        <Tag className="w-6 h-6 text-mocha-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-mocha-900">{deal.title}</p>
                                                        {deal.description && (
                                                            <p className="text-xs text-mocha-500 line-clamp-1">{deal.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                                    <TypeIcon className="w-3.5 h-3.5" />
                                                    {typeInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-mocha-900">
                                                    {deal.discount_type === 'percentage' ? `${deal.discount_value}%` : `₱${deal.discount_value}`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {deal.product ? (
                                                    <div className="flex items-center gap-2">
                                                        {deal.product.images?.[0] && (
                                                            <img
                                                                src={deal.product.images[0]}
                                                                alt={deal.product.name}
                                                                className="w-8 h-8 rounded object-cover"
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-mocha-800 line-clamp-1">{deal.product.name}</p>
                                                            <p className="text-xs text-mocha-500">₱{deal.product.price}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-mocha-400 text-sm">All Products</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm">
                                                    <p className="text-mocha-700">{formatDate(deal.start_date)}</p>
                                                    <p className="text-mocha-500">to {formatDate(deal.end_date)}</p>
                                                    {expired && (
                                                        <span className="text-xs text-red-500 font-medium">Expired</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => toggleActive(deal)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${deal.is_active
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {deal.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => toggleLanding(deal)}
                                                    className={`p-2 rounded-lg transition-colors ${deal.show_on_landing
                                                        ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                        }`}
                                                    title={deal.show_on_landing ? 'Visible on landing page' : 'Hidden from landing page'}
                                                >
                                                    {deal.show_on_landing ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(deal)}
                                                        className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(deal.id)}
                                                        className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-mocha-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-mocha-900">
                                    {editingDeal ? 'Edit Deal' : 'Create New Deal'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-lg hover:bg-mocha-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Title & Description */}
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">
                                        Deal Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                        placeholder="e.g., Flash Sale: 50% Off Electronics"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                        placeholder="Brief description of the deal..."
                                    />
                                </div>
                            </div>

                            {/* Deal Type & Discount */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">
                                        Deal Type
                                    </label>
                                    <select
                                        value={formData.deal_type}
                                        onChange={(e) => setFormData({ ...formData, deal_type: e.target.value as Deal['deal_type'] })}
                                        className="w-full px-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                    >
                                        {dealTypeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">
                                        Discount Type
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={formData.discount_type}
                                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as Deal['discount_type'] })}
                                            className="flex-1 px-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={formData.discount_value}
                                            onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                            min={0}
                                            className="w-24 px-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Product Selection */}
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">
                                    Product (Optional - Leave empty for general deal)
                                </label>
                                <select
                                    value={formData.product_id}
                                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                >
                                    <option value="">All Products (General Deal)</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} - ₱{product.price} ({product.store?.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Range */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">
                                        Start Date *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">
                                        End Date *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                    />
                                </div>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">
                                    Priority (Higher = Shows First)
                                </label>
                                <input
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                                    min={0}
                                    className="w-full px-4 py-2 rounded-lg border border-mocha-200 focus:outline-none focus:ring-2 focus:ring-mocha-300"
                                />
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-wrap gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded border-mocha-300 text-mocha-600 focus:ring-mocha-500"
                                    />
                                    <span className="text-sm text-mocha-700">Active</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_on_landing}
                                        onChange={(e) => setFormData({ ...formData, show_on_landing: e.target.checked })}
                                        className="w-4 h-4 rounded border-mocha-300 text-mocha-600 focus:ring-mocha-500"
                                    />
                                    <span className="text-sm text-mocha-700">Show on Landing Page</span>
                                </label>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-4 border-t border-mocha-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 rounded-lg border border-mocha-200 text-mocha-700 hover:bg-mocha-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            {editingDeal ? 'Update Deal' : 'Create Deal'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
