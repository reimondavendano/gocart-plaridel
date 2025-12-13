'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    CreditCard, Search, Plus, Edit2, Trash2, Check, X,
    Loader2, Users, DollarSign, Store, Package, Percent, Crown, Sparkles
} from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    features: string[];
    max_stores: number;
    max_products: number;
    transaction_fee: number;
    is_active: boolean;
    created_at: string;
    subscriber_count?: number;
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [saving, setSaving] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        price: '0',
        currency: 'PHP',
        features: '',
        max_stores: '1',
        max_products: '10',
        transaction_fee: '3',
        is_active: true
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('price');

            if (error) throw error;

            // Get subscriber counts
            const plansWithCounts = await Promise.all((data || []).map(async (plan) => {
                const { count } = await supabase
                    .from('user_profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('plan_id', plan.id);

                return {
                    ...plan,
                    features: plan.features || [],
                    subscriber_count: count || 0
                };
            }));

            setPlans(plansWithCounts);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        setSaving(true);

        try {
            const planData = {
                name: formData.name,
                price: parseFloat(formData.price) || 0,
                currency: formData.currency,
                features: formData.features.split('\n').filter(f => f.trim()),
                max_stores: parseInt(formData.max_stores) || 1,
                max_products: parseInt(formData.max_products) || 10,
                transaction_fee: parseFloat(formData.transaction_fee) || 0,
                is_active: formData.is_active
            };

            if (editingPlan) {
                const { error } = await supabase
                    .from('plans')
                    .update(planData)
                    .eq('id', editingPlan.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('plans')
                    .insert([planData]);
                if (error) throw error;
            }

            setShowModal(false);
            setEditingPlan(null);
            resetForm();
            fetchPlans();
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('Failed to save plan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this plan? Users on this plan will retain their current benefits until manually changed.')) return;

        try {
            const { error } = await supabase.from('plans').delete().eq('id', id);
            if (error) throw error;
            fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('Failed to delete plan');
        }
    };

    const toggleActive = async (plan: Plan) => {
        try {
            const { error } = await supabase
                .from('plans')
                .update({ is_active: !plan.is_active })
                .eq('id', plan.id);
            if (error) throw error;
            fetchPlans();
        } catch (error) {
            console.error('Error toggling plan status:', error);
        }
    };

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            price: plan.price.toString(),
            currency: plan.currency,
            features: plan.features.join('\n'),
            max_stores: plan.max_stores.toString(),
            max_products: plan.max_products.toString(),
            transaction_fee: plan.transaction_fee.toString(),
            is_active: plan.is_active
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price: '0',
            currency: 'PHP',
            features: '',
            max_stores: '1',
            max_products: '10',
            transaction_fee: '3',
            is_active: true
        });
    };

    const filteredPlans = plans.filter(plan =>
        plan.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getPlanIcon = (name: string) => {
        switch (name.toLowerCase()) {
            case 'starter': return <CreditCard className="w-6 h-6" />;
            case 'growth': return <Sparkles className="w-6 h-6" />;
            case 'pro': return <Crown className="w-6 h-6" />;
            case 'enterprise': return <Package className="w-6 h-6" />;
            default: return <CreditCard className="w-6 h-6" />;
        }
    };

    const getPlanColor = (name: string) => {
        switch (name.toLowerCase()) {
            case 'starter': return 'from-gray-400 to-gray-600';
            case 'growth': return 'from-green-400 to-green-600';
            case 'pro': return 'from-blue-400 to-blue-600';
            case 'enterprise': return 'from-purple-400 to-purple-600';
            default: return 'from-mocha-400 to-mocha-600';
        }
    };

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
                    <h1 className="text-2xl font-bold text-mocha-900">Plans</h1>
                    <p className="text-mocha-500">Manage subscription plans and pricing</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{plans.length}</p>
                            <p className="text-sm text-mocha-500">Total Plans</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">
                                {plans.filter(p => p.is_active).length}
                            </p>
                            <p className="text-sm text-mocha-500">Active Plans</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">
                                {plans.reduce((sum, p) => sum + (p.subscriber_count || 0), 0)}
                            </p>
                            <p className="text-sm text-mocha-500">Total Subscribers</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">
                                {formatCurrency(plans.filter(p => p.price > 0).reduce((sum, p) => sum + p.price * (p.subscriber_count || 0), 0))}
                            </p>
                            <p className="text-sm text-mocha-500">Monthly Revenue</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Actions */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                    <input
                        type="text"
                        placeholder="Search plans..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 shadow-sm"
                    />
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingPlan(null);
                        setShowModal(true);
                    }}
                    className="px-6 py-3 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add Plan
                </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredPlans.map((plan) => (
                    <div key={plan.id} className={`bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-lg ${!plan.is_active ? 'opacity-60' : ''}`}>
                        {/* Plan Header */}
                        <div className={`p-6 bg-gradient-to-br ${getPlanColor(plan.name)} text-white`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
                                    {getPlanIcon(plan.name)}
                                </div>
                                {!plan.is_active && (
                                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-lg">Inactive</span>
                                )}
                            </div>
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            <div className="mt-2">
                                <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                                <span className="text-white/80 text-sm">/month</span>
                            </div>
                        </div>

                        {/* Plan Details */}
                        <div className="p-6 space-y-4">
                            {/* Limits */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Store className="w-4 h-4 text-mocha-400" />
                                    <span className="text-mocha-600">{plan.max_stores === 9999 ? 'Unlimited' : plan.max_stores} Stores</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Package className="w-4 h-4 text-mocha-400" />
                                    <span className="text-mocha-600">{plan.max_products === 9999 ? 'Unlimited' : plan.max_products} Products</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Percent className="w-4 h-4 text-mocha-400" />
                                    <span className="text-mocha-600">{plan.transaction_fee}% Fee</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-mocha-400" />
                                    <span className="text-mocha-600">{plan.subscriber_count} Users</span>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="border-t border-mocha-100 pt-4">
                                <p className="text-xs font-medium text-mocha-400 uppercase mb-2">Features</p>
                                <ul className="space-y-2">
                                    {plan.features.slice(0, 4).map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-mocha-600">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="line-clamp-1">{feature}</span>
                                        </li>
                                    ))}
                                    {plan.features.length > 4 && (
                                        <li className="text-sm text-mocha-400">+{plan.features.length - 4} more...</li>
                                    )}
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-mocha-100">
                                <button
                                    onClick={() => openEdit(plan)}
                                    className="flex-1 py-2 px-3 bg-mocha-100 hover:bg-mocha-200 text-mocha-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => toggleActive(plan)}
                                    className={`flex-1 py-2 px-3 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1 ${plan.is_active
                                            ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                                        }`}
                                >
                                    {plan.is_active ? (
                                        <><X className="w-4 h-4" /> Deactivate</>
                                    ) : (
                                        <><Check className="w-4 h-4" /> Activate</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredPlans.length === 0 && (
                <div className="bg-white border border-mocha-200 rounded-2xl p-12 text-center shadow-sm">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-mocha-300" />
                    <p className="text-mocha-500 font-medium">No plans found</p>
                </div>
            )}

            {/* Plan Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-mocha-100 bg-mocha-50">
                            <h3 className="font-bold text-mocha-900">
                                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-mocha-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-mocha-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Plan Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Pro"
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Price (PHP)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        min="0"
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Transaction Fee (%)</label>
                                    <input
                                        type="number"
                                        value={formData.transaction_fee}
                                        onChange={(e) => setFormData({ ...formData, transaction_fee: e.target.value })}
                                        min="0"
                                        step="0.5"
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Max Stores</label>
                                    <input
                                        type="number"
                                        value={formData.max_stores}
                                        onChange={(e) => setFormData({ ...formData, max_stores: e.target.value })}
                                        min="1"
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Max Products</label>
                                    <input
                                        type="number"
                                        value={formData.max_products}
                                        onChange={(e) => setFormData({ ...formData, max_products: e.target.value })}
                                        min="1"
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-mocha-700 mb-1">Features (one per line)</label>
                                    <textarea
                                        value={formData.features}
                                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                        rows={5}
                                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400 resize-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-5 h-5 rounded border-mocha-300 text-mocha-600 focus:ring-mocha-500"
                                        />
                                        <span className="text-sm font-medium text-mocha-700">Active (available for new subscriptions)</span>
                                    </label>
                                </div>
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
                                disabled={saving || !formData.name.trim()}
                                className="px-6 py-2 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingPlan ? 'Update Plan' : 'Create Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
