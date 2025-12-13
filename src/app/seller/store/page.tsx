'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/storage';
import { checkImageContent } from '@/lib/moderation';
import {
    Store, MapPin, Phone, Mail, Globe, Save, Loader2, Image as ImageIcon,
    CheckCircle, AlertCircle
} from 'lucide-react';

interface StoreData {
    id: string;
    name: string;
    description: string;
    logo_url: string;
    banner_url: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    province: string;
    // New Fields
    barangay_id: string;
    city_id: string;
    latitude: number;
    longitude: number;
    // Status
    status: string;
    admin_verified: boolean;
    slug: string;
}

export default function SellerStorePage() {
    const { currentUser } = useAppSelector((state) => state.user);
    const [store, setStore] = useState<StoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Image Upload State
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser?.id) {
            fetchStore();
        }
    }, [currentUser?.id]);

    const fetchStore = async () => {
        try {
            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .eq('seller_id', currentUser?.id)
                .single();

            if (error) throw error;
            setStore(data);
        } catch (error) {
            console.error('Error fetching store:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !store) return;

        const moderationError = await checkImageContent(file);
        if (moderationError) {
            alert(moderationError);
            return;
        }

        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !store) return;

        const moderationError = await checkImageContent(file);
        if (moderationError) {
            alert(moderationError);
            return;
        }

        setBannerFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setBannerPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!store) return;

        setSaving(true);
        setMessage(null);

        try {
            let logoUrl = store.logo_url;
            let bannerUrl = store.banner_url;

            // Upload Logo
            if (logoFile) {
                const { url } = await uploadToStorage(logoFile, {
                    folder: 'logo',
                    storeSlug: store.slug,
                    fileName: `logo_${Date.now()}.png`
                });
                if (url) logoUrl = url;
            }

            // Upload Banner
            if (bannerFile) {
                const { url } = await uploadToStorage(bannerFile, {
                    folder: 'banner',
                    storeSlug: store.slug,
                    fileName: `banner_${Date.now()}.png`
                });
                if (url) bannerUrl = url;
            }

            const { error } = await supabase
                .from('stores')
                .update({
                    name: store.name,
                    description: store.description,
                    phone: store.phone,
                    email: store.email,
                    address: store.address,
                    city: store.city,
                    province: store.province,
                    barangay_id: store.barangay_id,
                    city_id: store.city_id,
                    latitude: store.latitude,
                    longitude: store.longitude,
                    logo_url: logoUrl,
                    banner_url: bannerUrl
                })
                .eq('id', store.id);

            if (error) throw error;

            // Update local state with new URLs so subsequent saves work efficiently
            setStore(prev => prev ? ({ ...prev, logo_url: logoUrl, banner_url: bannerUrl }) : null);
            setLogoFile(null); // content moderated and uploaded
            setBannerFile(null);

            setMessage({ type: 'success', text: 'Store details updated successfully' });
        } catch (error) {
            console.error('Error updating store:', error);
            setMessage({ type: 'error', text: 'Failed to update store details' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!store) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <Store className="w-16 h-16 text-mocha-300 mb-4" />
                <h2 className="text-xl font-bold text-mocha-900">No Store Found</h2>
                <p className="text-mocha-500 max-w-md mx-auto mt-2">
                    You haven't created a store yet. Please contact support or go through the registration process.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-mocha-900">My Store</h1>
                <p className="text-mocha-500">Manage your store profile and details</p>
            </div>

            {/* Status Banner */}
            <div className={`p-4 rounded-xl border ${(store.status === 'active' || store.status === 'approved')
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                } flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    {(store.status === 'active' || store.status === 'approved') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <div>
                        <p className="font-medium capitalize">Status: {store.status}</p>
                        {!(store.status === 'active' || store.status === 'approved') && !store.admin_verified && (
                            <p className="text-sm opacity-90">Pending Admin Verification</p>
                        )}
                    </div>
                </div>
                {(store.status === 'active' || store.status === 'approved') && (
                    <a
                        href={`/store/${store.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium underline flex items-center gap-1"
                    >
                        View Public Store <Globe className="w-4 h-4" />
                    </a>
                )}
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    } flex items-center gap-2`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p>{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* Visual Identity */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <h2 className="text-lg font-semibold text-mocha-900">Visual Identity</h2>

                    {/* Banner & Logo */}
                    <div className="relative h-48 bg-mocha-100 rounded-xl overflow-hidden group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerSelect}
                            className="hidden"
                            id="banner-upload"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoSelect}
                            className="hidden"
                            id="logo-upload"
                        />

                        <label htmlFor="banner-upload" className="absolute inset-0 cursor-pointer group-hover:bg-black/10 transition-colors">
                            {bannerPreview || store?.banner_url ? (
                                <img src={bannerPreview || store?.banner_url} alt="Store Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-mocha-400">
                                    <ImageIcon className="w-12 h-12" />
                                    <span className="ml-2 text-sm font-medium">Click to upload banner</span>
                                </div>
                            )}
                        </label>

                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-end pointer-events-none">
                            <label htmlFor="logo-upload" className="relative w-20 h-20 rounded-xl bg-white p-1 border-2 border-white shadow-lg -mb-10 ml-4 group cursor-pointer pointer-events-auto hover:brightness-95 transition-all">
                                {logoPreview || store?.logo_url ? (
                                    <img src={logoPreview || store?.logo_url} alt="Store Logo" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <div className="w-full h-full bg-mocha-50 rounded-lg flex items-center justify-center text-mocha-300">
                                        <Store className="w-8 h-8" />
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                    <p className="text-sm text-mocha-500">
                        Click on the banner or logo placeholder to upload new images.
                        Images are checked for inappropriate content.
                    </p>
                </div>

                {/* Basic Info */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm space-y-4 mt-8">
                    <h2 className="text-lg font-semibold text-mocha-900">Basic Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Store Name</label>
                            <input
                                type="text"
                                value={store.name}
                                onChange={(e) => setStore({ ...store, name: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Description</label>
                            <textarea
                                value={store.description || ''}
                                onChange={(e) => setStore({ ...store, description: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400 resize-none h-24"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Contact Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <input
                                    type="email"
                                    value={store.email || ''}
                                    onChange={(e) => setStore({ ...store, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <input
                                    type="text"
                                    value={store.phone || ''}
                                    onChange={(e) => setStore({ ...store, phone: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-mocha-900">Store Address</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Street Address</label>
                            <input
                                type="text"
                                value={store.address || ''}
                                onChange={(e) => setStore({ ...store, address: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">City</label>
                            <input
                                type="text"
                                value={store.city || ''}
                                onChange={(e) => setStore({ ...store, city: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Province</label>
                            <input
                                type="text"
                                value={store.province || ''}
                                onChange={(e) => setStore({ ...store, province: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Barangay ID</label>
                            <input
                                type="text"
                                value={store.barangay_id || ''}
                                onChange={(e) => setStore({ ...store, barangay_id: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">City ID</label>
                            <input
                                type="text"
                                value={store.city_id || ''}
                                onChange={(e) => setStore({ ...store, city_id: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-mocha-100">
                        <div className="col-span-2">
                            <h3 className="text-md font-medium text-mocha-900 mb-2">Geolocation</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={store.latitude || ''}
                                onChange={(e) => setStore({ ...store, latitude: parseFloat(e.target.value) })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={store.longitude || ''}
                                onChange={(e) => setStore({ ...store, longitude: parseFloat(e.target.value) })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
