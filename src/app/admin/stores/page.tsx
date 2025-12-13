'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Store, Search, Filter, Eye, CheckCircle, XCircle,
    MapPin, FileText, Camera, User, Clock, ChevronDown,
    X, ExternalLink, AlertTriangle, Image as ImageIcon
} from 'lucide-react';

interface StoreData {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo: string;
    banner: string;
    status: 'pending' | 'approved' | 'rejected';
    valid_id_front: string | null;
    valid_id_back: string | null;
    business_permit: string | null;
    selfie_image: string | null;
    latitude: number | null;
    longitude: number | null;
    verification_notes: string | null;
    verified_at: string | null;
    created_at: string;
    seller: {
        id: string;
        name: string;
        email: string;
        avatar: string;
    } | null;
    address: {
        id: string;
        complete_address: string | null;
        city: { name: string } | null;
        barangay: { name: string } | null;
    } | null;
}

export default function AdminStoresPage() {
    const [stores, setStores] = useState<StoreData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [verificationNotes, setVerificationNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchStores();
    }, []); // Only fetch on mount

    const fetchStores = async () => {
        try {
            // First get stores with addresses and join to barangays/cities
            let query = supabase
                .from('stores')
                .select(`
                    *,
                    address:addresses(
                        id,
                        complete_address,
                        city:cities(name),
                        barangay:barangays(name)
                    )
                `)
                .order('created_at', { ascending: false });

            // Removed server-side filtering to keep accurate counts
            // if (filter !== 'all') {
            //     query = query.eq('status', filter);
            // }

            const { data, error } = await query;

            if (error) throw error;

            // Fetch seller info for each store
            const storesWithSellers = await Promise.all((data || []).map(async (store: any) => {
                // Get user profile for seller info
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('name, avatar, user:users(email)')
                    .eq('user_id', store.seller_id)
                    .single();

                // Handle potentially array result from join
                const userObj = (profileData?.user) as any;
                const userEmail = userObj
                    ? (Array.isArray(userObj) ? userObj[0]?.email : userObj?.email)
                    : '';

                return {
                    ...store,
                    seller: profileData ? {
                        id: store.seller_id,
                        name: profileData.name,
                        email: userEmail || '',
                        avatar: profileData.avatar
                    } : null
                };
            }));

            setStores(storesWithSellers);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (storeId: string, status: 'approved' | 'rejected') => {
        setProcessing(true);
        try {
            const adminData = localStorage.getItem('gocart_admin');
            const admin = adminData ? JSON.parse(adminData) : null;

            // 1. Update store status
            const { error: storeError } = await supabase
                .from('stores')
                .update({
                    status,
                    verification_notes: verificationNotes || null,
                    verified_at: new Date().toISOString(),
                    verified_by: admin?.id || null
                })
                .eq('id', storeId);

            if (storeError) throw storeError;

            // 2. If approved, update the seller's role from 'customer' to 'seller'
            if (status === 'approved' && selectedStore?.seller?.id) {
                const { error: roleError } = await supabase
                    .from('users')
                    .update({
                        role: 'seller',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedStore.seller.id);

                if (roleError) {
                    console.error('Error updating seller role:', roleError);
                } else {
                    console.log(`User ${selectedStore.seller.id} role updated to 'seller'`);
                }
            }

            // Refresh stores
            fetchStores();
            setShowModal(false);
            setSelectedStore(null);
            setVerificationNotes('');
        } catch (error) {
            console.error('Error verifying store:', error);
        } finally {
            setProcessing(false);
        }
    };

    const filteredStores = stores.filter(store => {
        // Filter by status tab
        if (filter !== 'all' && store.status !== filter) return false;

        // Filter by search query
        return (
            store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.seller?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
            approved: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
        };
        const style = styles[status] || styles.pending;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${style.bg} ${style.text}`}>
                {style.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusCounts = {
        all: stores.length,
        pending: stores.filter(s => s.status === 'pending').length,
        approved: stores.filter(s => s.status === 'approved').length,
        rejected: stores.filter(s => s.status === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Store Management</h1>
                    <p className="text-mocha-500">Review and verify seller store applications</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Store className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{statusCounts.all}</p>
                            <p className="text-sm text-mocha-500">Total Stores</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{statusCounts.pending}</p>
                            <p className="text-sm text-mocha-500">Pending Review</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{statusCounts.approved}</p>
                            <p className="text-sm text-mocha-500">Approved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{statusCounts.rejected}</p>
                            <p className="text-sm text-mocha-500">Rejected</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                    <input
                        type="text"
                        placeholder="Search stores or sellers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === status
                                ? 'bg-mocha-600 text-white'
                                : 'bg-white border border-mocha-200 text-mocha-600 hover:bg-mocha-50'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs ${filter === status ? 'bg-mocha-500' : 'bg-mocha-100'}`}>
                                {statusCounts[status]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stores Table */}
            <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-mocha-500">
                        <Store className="w-12 h-12 mb-3 opacity-50" />
                        <p className="font-medium">No stores found</p>
                        <p className="text-sm">Try adjusting your search or filter</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-mocha-100 bg-mocha-50">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Store</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Seller</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Location</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Documents</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Applied</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-mocha-100">
                                {filteredStores.map((store) => (
                                    <tr key={store.id} className="hover:bg-mocha-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-mocha-100 overflow-hidden flex-shrink-0">
                                                    {store.logo ? (
                                                        <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Store className="w-5 h-5 text-mocha-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-mocha-900">{store.name}</p>
                                                    <p className="text-sm text-mocha-500">/{store.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={store.seller?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller'}
                                                    alt={store.seller?.name}
                                                    className="w-8 h-8 rounded-lg object-cover"
                                                />
                                                <div>
                                                    <p className="text-sm text-mocha-900">{store.seller?.name}</p>
                                                    <p className="text-xs text-mocha-500">{store.seller?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {store.address ? (
                                                <div className="flex items-start gap-1.5">
                                                    <MapPin className="w-4 h-4 text-mocha-400 mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm text-mocha-700">
                                                        {store.address.barangay?.name && `${store.address.barangay.name}, `}
                                                        {store.address.city?.name || 'Unknown'}
                                                        {store.latitude && store.longitude && (
                                                            <span className="block text-xs text-mocha-400">
                                                                {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-mocha-400 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center ${store.valid_id_front ? 'bg-green-100' : 'bg-mocha-100'}`}>
                                                    <FileText className={`w-3.5 h-3.5 ${store.valid_id_front ? 'text-green-600' : 'text-mocha-400'}`} />
                                                </div>
                                                <div className={`w-6 h-6 rounded flex items-center justify-center ${store.business_permit ? 'bg-green-100' : 'bg-mocha-100'}`}>
                                                    <FileText className={`w-3.5 h-3.5 ${store.business_permit ? 'text-green-600' : 'text-mocha-400'}`} />
                                                </div>
                                                <div className={`w-6 h-6 rounded flex items-center justify-center ${store.selfie_image ? 'bg-green-100' : 'bg-mocha-100'}`}>
                                                    <Camera className={`w-3.5 h-3.5 ${store.selfie_image ? 'text-green-600' : 'text-mocha-400'}`} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(store.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-mocha-400">{formatDate(store.created_at)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedStore(store);
                                                    setShowModal(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mocha-100 hover:bg-mocha-200 text-mocha-700 text-sm font-medium transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Store Review Modal */}
            {showModal && selectedStore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-mocha-900 border border-mocha-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-mocha-800">
                            <div>
                                <h2 className="text-xl font-bold text-white">Store Verification</h2>
                                <p className="text-mocha-400 text-sm mt-0.5">{selectedStore.name}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedStore(null);
                                }}
                                className="p-2 rounded-lg hover:bg-mocha-800 text-mocha-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Store Info */}
                                <div className="space-y-6">
                                    {/* Store Banner & Logo */}
                                    <div className="relative h-32 rounded-xl overflow-hidden bg-mocha-800">
                                        {selectedStore.banner && (
                                            <img src={selectedStore.banner} alt="Banner" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                                            <div className="w-16 h-16 rounded-xl bg-mocha-900 border-4 border-mocha-900 overflow-hidden">
                                                {selectedStore.logo ? (
                                                    <img src={selectedStore.logo} alt={selectedStore.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-mocha-800">
                                                        <Store className="w-6 h-6 text-mocha-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <h3 className="text-lg font-semibold text-white">{selectedStore.name}</h3>
                                        <p className="text-mocha-400 text-sm mt-1">{selectedStore.description || 'No description provided'}</p>
                                    </div>

                                    {/* Seller Info */}
                                    <div className="bg-mocha-800/50 rounded-xl p-4">
                                        <h4 className="text-sm font-medium text-mocha-400 mb-3">Seller Information</h4>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={selectedStore.seller?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller'}
                                                alt={selectedStore.seller?.name}
                                                className="w-12 h-12 rounded-xl object-cover"
                                            />
                                            <div>
                                                <p className="font-medium text-white">{selectedStore.seller?.name}</p>
                                                <p className="text-sm text-mocha-400">{selectedStore.seller?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="bg-mocha-800/50 rounded-xl p-4">
                                        <h4 className="text-sm font-medium text-mocha-400 mb-3">Store Location</h4>
                                        {selectedStore.address ? (
                                            <div className="space-y-2 text-mocha-300">
                                                {selectedStore.address.complete_address && (
                                                    <p className="text-white">{selectedStore.address.complete_address}</p>
                                                )}
                                                <p>
                                                    {selectedStore.address.barangay?.name && `${selectedStore.address.barangay.name}, `}
                                                    {selectedStore.address.city?.name || 'Unknown City'}, Bulacan
                                                </p>
                                                {selectedStore.latitude && selectedStore.longitude && (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${selectedStore.latitude},${selectedStore.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-mocha-400 hover:text-mocha-200 text-sm mt-2"
                                                    >
                                                        <MapPin className="w-4 h-4" />
                                                        View on Google Maps
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-mocha-500">No address provided</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column - Documents */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-medium text-mocha-400">Verification Documents</h4>

                                    {/* Valid ID Front */}
                                    <div className="bg-mocha-800/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-white">Valid ID (Front)</span>
                                            {selectedStore.valid_id_front ? (
                                                <span className="text-xs text-green-400">Uploaded</span>
                                            ) : (
                                                <span className="text-xs text-yellow-400">Missing</span>
                                            )}
                                        </div>
                                        {selectedStore.valid_id_front ? (
                                            <img src={selectedStore.valid_id_front} alt="ID Front" className="w-full h-40 object-cover rounded-lg" />
                                        ) : (
                                            <div className="w-full h-40 bg-mocha-800 rounded-lg flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-mocha-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Valid ID Back */}
                                    <div className="bg-mocha-800/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-white">Valid ID (Back)</span>
                                            {selectedStore.valid_id_back ? (
                                                <span className="text-xs text-green-400">Uploaded</span>
                                            ) : (
                                                <span className="text-xs text-yellow-400">Missing</span>
                                            )}
                                        </div>
                                        {selectedStore.valid_id_back ? (
                                            <img src={selectedStore.valid_id_back} alt="ID Back" className="w-full h-40 object-cover rounded-lg" />
                                        ) : (
                                            <div className="w-full h-40 bg-mocha-800 rounded-lg flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-mocha-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Business Permit */}
                                    <div className="bg-mocha-800/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-white">Business Permit</span>
                                            {selectedStore.business_permit ? (
                                                <span className="text-xs text-green-400">Uploaded</span>
                                            ) : (
                                                <span className="text-xs text-mocha-500">Optional</span>
                                            )}
                                        </div>
                                        {selectedStore.business_permit ? (
                                            <img src={selectedStore.business_permit} alt="Business Permit" className="w-full h-40 object-cover rounded-lg" />
                                        ) : (
                                            <div className="w-full h-40 bg-mocha-800 rounded-lg flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-mocha-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Selfie Verification */}
                                    <div className="bg-mocha-800/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-white">Selfie Verification</span>
                                            {selectedStore.selfie_image ? (
                                                <span className="text-xs text-green-400">Uploaded</span>
                                            ) : (
                                                <span className="text-xs text-yellow-400">Missing</span>
                                            )}
                                        </div>
                                        {selectedStore.selfie_image ? (
                                            <img src={selectedStore.selfie_image} alt="Selfie" className="w-full h-40 object-cover rounded-lg" />
                                        ) : (
                                            <div className="w-full h-40 bg-mocha-800 rounded-lg flex items-center justify-center">
                                                <Camera className="w-8 h-8 text-mocha-600" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Verification Notes */}
                            {selectedStore.status === 'pending' && (
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-mocha-400 mb-2">
                                        Verification Notes (Optional)
                                    </label>
                                    <textarea
                                        value={verificationNotes}
                                        onChange={(e) => setVerificationNotes(e.target.value)}
                                        placeholder="Add notes about this verification decision..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-mocha-800/50 border border-mocha-700 rounded-xl text-white placeholder:text-mocha-500 focus:outline-none focus:border-mocha-500 resize-none"
                                    />
                                </div>
                            )}

                            {/* Existing Verification Notes */}
                            {selectedStore.verification_notes && (
                                <div className="mt-6 p-4 bg-mocha-800/30 rounded-xl">
                                    <h4 className="text-sm font-medium text-mocha-400 mb-2">Previous Notes</h4>
                                    <p className="text-mocha-300">{selectedStore.verification_notes}</p>
                                    {selectedStore.verified_at && (
                                        <p className="text-xs text-mocha-500 mt-2">Verified on {formatDate(selectedStore.verified_at)}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {selectedStore.status === 'pending' && (
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-mocha-800">
                                <button
                                    onClick={() => handleVerify(selectedStore.id, 'rejected')}
                                    disabled={processing}
                                    className="px-6 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleVerify(selectedStore.id, 'approved')}
                                    disabled={processing}
                                    className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5" />
                                    )}
                                    Approve Store
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
