'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import {
    MapPin, Plus, Edit, Trash2, Star, Home, Building, Loader2, X, Save
} from 'lucide-react';

interface Address {
    id: string;
    label: string;
    full_name: string;
    phone: string;
    street: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
    is_default: boolean;
}

const emptyAddress: Omit<Address, 'id'> = {
    label: '',
    full_name: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Philippines',
    is_default: false
};

export default function SellerAddressesPage() {
    const { currentUser } = useAppSelector((state) => state.user);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState(emptyAddress);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentUser?.id) {
            fetchAddresses();
        }
    }, [currentUser?.id]);

    const fetchAddresses = async () => {
        try {
            const { data } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', currentUser?.id)
                .order('is_default', { ascending: false });

            if (data) {
                setAddresses(data);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (address?: Address) => {
        if (address) {
            setEditingAddress(address);
            setFormData(address);
        } else {
            setEditingAddress(null);
            setFormData({ ...emptyAddress, full_name: currentUser?.name || '', phone: currentUser?.phone || '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingAddress(null);
        setFormData(emptyAddress);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.id) return;

        setSaving(true);
        try {
            if (editingAddress) {
                // Update existing address
                const { error } = await supabase
                    .from('addresses')
                    .update({
                        ...formData,
                        is_default: formData.is_default
                    })
                    .eq('id', editingAddress.id);

                if (error) throw error;
            } else {
                // Create new address
                const { error } = await supabase
                    .from('addresses')
                    .insert([{
                        ...formData,
                        user_id: currentUser.id
                    }]);

                if (error) throw error;
            }

            // If setting as default, unset other defaults
            if (formData.is_default) {
                await supabase
                    .from('addresses')
                    .update({ is_default: false })
                    .eq('user_id', currentUser.id)
                    .neq('id', editingAddress?.id || '');
            }

            fetchAddresses();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving address:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (addressId: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        try {
            const { error } = await supabase
                .from('addresses')
                .delete()
                .eq('id', addressId);

            if (!error) {
                setAddresses(addresses.filter(a => a.id !== addressId));
            }
        } catch (error) {
            console.error('Error deleting address:', error);
        }
    };

    const handleSetDefault = async (addressId: string) => {
        try {
            // Unset all defaults first
            await supabase
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', currentUser?.id);

            // Set new default
            await supabase
                .from('addresses')
                .update({ is_default: true })
                .eq('id', addressId);

            fetchAddresses();
        } catch (error) {
            console.error('Error setting default:', error);
        }
    };

    const getLabelIcon = (label: string) => {
        switch (label?.toLowerCase()) {
            case 'home':
                return <Home className="w-4 h-4" />;
            case 'office':
            case 'work':
                return <Building className="w-4 h-4" />;
            default:
                return <MapPin className="w-4 h-4" />;
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
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Addresses</h1>
                    <p className="text-mocha-500">Manage your store and shipping addresses</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mocha-500 hover:bg-mocha-600 text-white font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Address
                </button>
            </div>

            {addresses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-mocha-100 p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-mocha-100 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-mocha-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-mocha-900 mb-2">No addresses yet</h3>
                    <p className="text-mocha-500 mb-6">Add your first address to get started</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mocha-500 hover:bg-mocha-600 text-white font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Address
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className={`bg-white rounded-2xl border p-5 transition-colors ${address.is_default ? 'border-mocha-400 bg-mocha-50/50' : 'border-mocha-100'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${address.is_default ? 'bg-mocha-500 text-white' : 'bg-mocha-100 text-mocha-600'
                                        }`}>
                                        {getLabelIcon(address.label)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-mocha-900">{address.label}</h3>
                                            {address.is_default && (
                                                <span className="px-2 py-0.5 rounded-lg bg-mocha-500 text-white text-xs font-medium flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-mocha-700">{address.full_name}</p>
                                        <p className="text-mocha-500 text-sm">{address.phone}</p>
                                        <p className="text-mocha-500 text-sm mt-1">
                                            {address.street}, {address.city}, {address.province} {address.postal_code}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!address.is_default && (
                                        <button
                                            onClick={() => handleSetDefault(address.id)}
                                            className="px-3 py-1.5 rounded-lg text-mocha-600 hover:bg-mocha-100 text-sm font-medium transition-colors"
                                        >
                                            Set Default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleOpenModal(address)}
                                        className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(address.id)}
                                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-mocha-100">
                            <h2 className="text-xl font-bold text-mocha-900">
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1.5">Label</label>
                                    <input
                                        type="text"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        placeholder="e.g., Home, Office, Store"
                                        className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-mocha-700 mb-1.5">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-mocha-700 mb-1.5">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mocha-700 mb-1.5">Street Address</label>
                                    <input
                                        type="text"
                                        value={formData.street}
                                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                        placeholder="House/Unit No., Street, Barangay"
                                        className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-mocha-700 mb-1.5">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-mocha-700 mb-1.5">Province</label>
                                        <input
                                            type="text"
                                            value={formData.province}
                                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                            className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-mocha-700 mb-1.5">Postal Code</label>
                                        <input
                                            type="text"
                                            value={formData.postal_code}
                                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                            className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-mocha-700 mb-1.5">Country</label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                        />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_default}
                                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                        className="w-5 h-5 rounded border-mocha-300 text-mocha-500 focus:ring-mocha-500"
                                    />
                                    <span className="text-mocha-700">Set as default address</span>
                                </label>
                            </div>
                        </form>

                        <div className="flex items-center justify-end gap-3 p-6 border-t border-mocha-100">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-6 py-2.5 rounded-xl bg-mocha-100 hover:bg-mocha-200 text-mocha-700 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl bg-mocha-500 hover:bg-mocha-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        {editingAddress ? 'Update' : 'Save'} Address
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
