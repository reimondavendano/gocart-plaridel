'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Ticket, Search, Plus, Edit2, Trash2, Check, X,
    Loader2, Copy, Calendar, Percent, DollarSign, Users,
    Crown, UserPlus, Clock, TrendingUp
} from 'lucide-react';

interface Coupon {
    id: string;
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase: number;
    max_discount: number | null;
    usage_limit: number;
    used_count: number;
    for_plus_only: boolean;
    for_new_users: boolean;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [saving, setSaving] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '10',
        min_purchase: '0',
        max_discount: '',
        usage_limit: '0',
        for_plus_only: false,
        for_new_users: false,
        expires_at: '',
        is_active: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, code });
    };

    const handleSave = async () => {
        if (!formData.code.trim()) return;
        setSaving(true);

        try {
            const couponData = {
                code: formData.code.toUpperCase(),
                description: formData.description,
                discount_type: formData.discount_type,
                discount_value: parseFloat(formData.discount_value) || 0,
                min_purchase: parseFloat(formData.min_purchase) || 0,
                max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
                usage_limit: parseInt(formData.usage_limit) || 0,
                for_plus_only: formData.for_plus_only,
                for_new_users: formData.for_new_users,
                expires_at: formData.expires_at || null,
                is_active: formData.is_active
            };

            if (editingCoupon) {
                const { error } = await supabase
                    .from('coupons')
                    .update(couponData)
                    .eq('id', editingCoupon.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('coupons')
                    .insert([couponData]);
                if (error) throw error;
            }

            setShowModal(false);
            setEditingCoupon(null);
            resetForm();
            fetchCoupons();
        } catch (error: any) {
            console.error('Error saving coupon:', error);
            if (error.code === '23505') {
                alert('Coupon code already exists');
            } else {
                alert('Failed to save coupon');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this coupon?')) return;

        try {
            const { error } = await supabase.from('coupons').delete().eq('id', id);
            if (error) throw error;
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            alert('Failed to delete coupon');
        }
    };

    const toggleActive = async (coupon: Coupon) => {
        try {
            const { error } = await supabase
                .from('coupons')
                .update({ is_active: !coupon.is_active })
                .eq('id', coupon.id);
            if (error) throw error;
            fetchCoupons();
        } catch (error) {
            console.error('Error toggling coupon status:', error);
        }
    };

    const openEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            description: coupon.description || '',
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value.toString(),
            min_purchase: coupon.min_purchase.toString(),
            max_discount: coupon.max_discount?.toString() || '',
            usage_limit: coupon.usage_limit.toString(),
            for_plus_only: coupon.for_plus_only,
            for_new_users: coupon.for_new_users,
            expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
            is_active: coupon.is_active
        });
        setShowModal(true);
    };

    const cloneCoupon = (coupon: Coupon) => {
        setEditingCoupon(null);
        setFormData({
            code: coupon.code + '_COPY',
            description: coupon.description || '',
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value.toString(),
            min_purchase: coupon.min_purchase.toString(),
            max_discount: coupon.max_discount?.toString() || '',
            usage_limit: coupon.usage_limit.toString(),
            for_plus_only: coupon.for_plus_only,
            for_new_users: coupon.for_new_users,
            expires_at: '',
            is_active: true
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            discount_type: 'percentage',
            discount_value: '10',
            min_purchase: '0',
            max_discount: '',
            usage_limit: '0',
            for_plus_only: false,
            for_new_users: false,
            expires_at: '',
            is_active: true
        });
    };

    const isExpired = (coupon: Coupon) => {
        if (!coupon.expires_at) return false;
        return new Date(coupon.expires_at) < new Date();
    };

    const filteredCoupons = coupons.filter(coupon => {
        const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coupon.description?.toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'active') return matchesSearch && coupon.is_active && !isExpired(coupon);
        if (filter === 'expired') return matchesSearch && (isExpired(coupon) || !coupon.is_active);
        return matchesSearch;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Stats
    const activeCoupons = coupons.filter(c => c.is_active && !isExpired(c)).length;
    const totalUsage = coupons.reduce((sum, c) => sum + c.used_count, 0);
    const totalDiscount = coupons.reduce((sum, c) => {
        if (c.discount_type === 'fixed') {
            return sum + (c.discount_value * c.used_count);
        }
        return sum;
    }, 0);

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
                    <h1 className="text-2xl font-bold text-mocha-900">Coupons</h1>
                    <p className="text-mocha-500">Manage discount codes and promotions</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Ticket className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{coupons.length}</p>
                            <p className="text-sm text-mocha-500">Total Coupons</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{activeCoupons}</p>
                            <p className="text-sm text-mocha-500">Active Coupons</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{totalUsage}</p>
                            <p className="text-sm text-mocha-500">Total Redemptions</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{formatCurrency(totalDiscount)}</p>
                            <p className="text-sm text-mocha-500">Total Discounts Given</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                    <input
                        type="text"
                        placeholder="Search coupons..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'active', 'expired'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors border ${filter === status
                                    ? 'bg-mocha-600 text-white border-mocha-600'
                                    : 'bg-white border-mocha-200 text-mocha-600 hover:bg-mocha-50'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingCoupon(null);
                        setShowModal(true);
                    }}
                    className="px-6 py-3 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add Coupon
                </button>
            </div>

            {/* Coupons Table */}
            <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-mocha-100 bg-mocha-50">
                            <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Code</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Discount</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Usage</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Restrictions</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Expires</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Status</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-mocha-100">
                        {filteredCoupons.map((coupon) => (
                            <tr key={coupon.id} className="hover:bg-mocha-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${coupon.discount_type === 'percentage' ? 'bg-purple-100' : 'bg-green-100'
                                            }`}>
                                            {coupon.discount_type === 'percentage' ? (
                                                <Percent className="w-5 h-5 text-purple-600" />
                                            ) : (
                                                <DollarSign className="w-5 h-5 text-green-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-mono font-bold text-mocha-900">{coupon.code}</p>
                                            <p className="text-xs text-mocha-500 line-clamp-1">{coupon.description || 'No description'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-mocha-900">
                                        {coupon.discount_type === 'percentage'
                                            ? `${coupon.discount_value}%`
                                            : formatCurrency(coupon.discount_value)
                                        }
                                    </span>
                                    {coupon.min_purchase > 0 && (
                                        <p className="text-xs text-mocha-500">Min: {formatCurrency(coupon.min_purchase)}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-mocha-900">{coupon.used_count}</span>
                                        <span className="text-mocha-400">/</span>
                                        <span className="text-mocha-500">{coupon.usage_limit || '∞'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {coupon.for_plus_only && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                <Crown className="w-3 h-3" /> Plus
                                            </span>
                                        )}
                                        {coupon.for_new_users && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                <UserPlus className="w-3 h-3" /> New
                                            </span>
                                        )}
                                        {!coupon.for_plus_only && !coupon.for_new_users && (
                                            <span className="text-xs text-mocha-400">None</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {coupon.expires_at ? (
                                        <div className={`flex items-center gap-1 text-sm ${isExpired(coupon) ? 'text-red-600' : 'text-mocha-600'}`}>
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(coupon.expires_at)}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-mocha-400">Never</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {isExpired(coupon) ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                                            <Clock className="w-3.5 h-3.5" /> Expired
                                        </span>
                                    ) : coupon.is_active ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                                            <Check className="w-3.5 h-3.5" /> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                            <X className="w-3.5 h-3.5" /> Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => cloneCoupon(coupon)}
                                            className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors"
                                            title="Clone"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openEdit(coupon)}
                                            className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleActive(coupon)}
                                            className={`p-2 rounded-lg transition-colors ${coupon.is_active
                                                    ? 'hover:bg-yellow-100 text-yellow-600'
                                                    : 'hover:bg-green-100 text-green-600'
                                                }`}
                                            title={coupon.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            {coupon.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coupon.id)}
                                            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCoupons.length === 0 && (
                    <div className="p-12 text-center text-mocha-500">
                        <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No coupons found</p>
                    </div>
                )}
            </div>

            {/* Coupon Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-mocha-100 bg-mocha-50">
                            <h3 className="font-bold text-mocha-900">
                                {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-mocha-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-mocha-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Coupon Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., SUMMER20"
                                        className="flex-1 px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400 font-mono uppercase"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateCode}
                                        className="px-4 py-3 bg-mocha-100 hover:bg-mocha-200 text-mocha-700 rounded-xl transition-colors"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Summer sale discount"
                                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Discount Type</label>
                                    <select
                                        value={formData.discount_type}
                                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₱)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">
                                        Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(₱)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                        min="0"
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Min Purchase (₱)</label>
                                    <input
                                        type="number"
                                        value={formData.min_purchase}
                                        onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                                        min="0"
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Max Discount (₱)</label>
                                    <input
                                        type="number"
                                        value={formData.max_discount}
                                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                                        min="0"
                                        placeholder="Optional"
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Usage Limit</label>
                                    <input
                                        type="number"
                                        value={formData.usage_limit}
                                        onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                        min="0"
                                        placeholder="0 = Unlimited"
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={formData.expires_at}
                                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.for_plus_only}
                                        onChange={(e) => setFormData({ ...formData, for_plus_only: e.target.checked })}
                                        className="w-5 h-5 rounded border-mocha-300 text-mocha-600 focus:ring-mocha-500"
                                    />
                                    <span className="text-sm font-medium text-mocha-700">Plus Members Only</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.for_new_users}
                                        onChange={(e) => setFormData({ ...formData, for_new_users: e.target.checked })}
                                        className="w-5 h-5 rounded border-mocha-300 text-mocha-600 focus:ring-mocha-500"
                                    />
                                    <span className="text-sm font-medium text-mocha-700">New Users Only</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-5 h-5 rounded border-mocha-300 text-mocha-600 focus:ring-mocha-500"
                                    />
                                    <span className="text-sm font-medium text-mocha-700">Active</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-mocha-100 bg-mocha-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-mocha-600 hover:bg-mocha-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.code.trim()}
                                className="px-6 py-2 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
