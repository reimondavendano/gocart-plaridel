'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check, X, Eye, Loader2, Calendar, Search,
    Filter, MoreVertical, CreditCard, AlertCircle
} from 'lucide-react';

interface SubscriptionRequest {
    id: string;
    store_id: string;
    plan_id: string;
    payment_proof: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    store: {
        name: string;
        seller: {
            email: string;
        }
    };
    plan: {
        name: string;
        price: number;
    };
}

export default function AdminSubscriptionsPage() {
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('subscription_requests')
                .select(`
                    *,
                    store:stores(name, seller:users(email)),
                    plan:plans(name, price)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching subscription requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: SubscriptionRequest) => {
        if (!confirm('Are you sure you want to approve this subscription? This will update the store status.')) return;

        setProcessingId(request.id);
        try {
            // 1. Calculate new subscription end date
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1); // Default to monthly for now, logic can be enhanced

            // 2. Update Subscription Request
            const { error: reqError } = await supabase
                .from('subscription_requests')
                .update({ status: 'approved', updated_at: new Date().toISOString() })
                .eq('id', request.id);

            if (reqError) throw reqError;

            // 3. Update Store Subscription
            const { error: storeError } = await supabase
                .from('stores')
                .update({
                    is_subscription_active: true,
                    subscription_ends_at: endDate.toISOString()
                })
                .eq('id', request.store_id);

            if (storeError) throw storeError;

            // Refresh list
            fetchRequests();
        } catch (error) {
            console.error('Error approving subscription:', error);
            alert('Failed to approve subscription.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!confirm('Are you sure you want to reject this request?')) return;

        setProcessingId(requestId);
        try {
            const { error } = await supabase
                .from('subscription_requests')
                .update({ status: 'rejected', updated_at: new Date().toISOString() })
                .eq('id', requestId);

            if (error) throw error;
            fetchRequests();
        } catch (error) {
            console.error('Error rejecting subscription:', error);
            alert('Failed to reject subscription.');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription Renewals</h1>
                    <p className="text-gray-500">Manage seller subscription verification requests</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
                    {['all', 'pending', 'approved', 'rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-mocha-100 text-mocha-700'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm mb-1">Pending Requests</p>
                        <p className="text-3xl font-bold text-amber-500">
                            {requests.filter(r => r.status === 'pending').length}
                        </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl">
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm mb-1">Approved Today</p>
                        <p className="text-3xl font-bold text-green-500">
                            {requests.filter(r => r.status === 'approved' && new Date(r.created_at).toDateString() === new Date().toDateString()).length}
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl">
                        <Check className="w-6 h-6 text-green-500" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm mb-1">Total Revenue (Est)</p>
                        <p className="text-3xl font-bold text-mocha-600">
                            ₱{requests.filter(r => r.status === 'approved').reduce((acc, r) => acc + (r.plan?.price || 0), 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="p-3 bg-mocha-50 rounded-xl">
                        <CreditCard className="w-6 h-6 text-mocha-500" />
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">Store / Seller</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">Plan</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">Date</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">Status</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">Proof</th>
                                <th className="text-right py-4 px-6 font-medium text-gray-500 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Loading requests...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        No subscription requests found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <p className="font-bold text-gray-900">{req.store?.name || 'Unknown Store'}</p>
                                            <p className="text-sm text-gray-500">{req.store?.seller?.email}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-mocha-700">{req.plan?.name}</span>
                                                <span className="text-xs text-gray-400">₱{req.plan?.price}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            {new Date(req.created_at).toLocaleDateString()}
                                            <br />
                                            <span className="text-xs text-gray-400">
                                                {new Date(req.created_at).toLocaleTimeString()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                }`}>
                                                {req.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {req.payment_proof && (
                                                <button
                                                    onClick={() => setSelectedProof(req.payment_proof)}
                                                    className="flex items-center gap-1 text-sm text-mocha-600 hover:text-mocha-800"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            {req.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(req)}
                                                        disabled={!!processingId}
                                                        className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                                                        title="Approve"
                                                    >
                                                        {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(req.id)}
                                                        disabled={!!processingId}
                                                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                                                        title="Reject"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Proof Modal */}
            {selectedProof && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProof(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <button
                            className="absolute -top-12 right-0 text-white hover:text-gray-300"
                            onClick={() => setSelectedProof(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img
                            src={selectedProof}
                            alt="Payment Proof"
                            className="w-full h-full object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
