'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    MapPin, Search, Plus, Edit2, Trash2, Building2, Map,
    ChevronDown, X, Loader2, Store, Users, ShoppingCart, ToggleLeft, ToggleRight
} from 'lucide-react';

interface City {
    id: string;
    name: string;
    province: string;
    is_active: boolean;
    created_at: string;
    barangay_count?: number;
    store_count?: number;
}

interface Barangay {
    id: string;
    city_id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    city?: { name: string };
    store_count?: number;
}

export default function AdminLocationsPage() {
    const [activeTab, setActiveTab] = useState<'cities' | 'barangays'>('cities');
    const [cities, setCities] = useState<City[]>([]);
    const [barangays, setBarangays] = useState<Barangay[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [showInactive, setShowInactive] = useState(false);

    // Modal States
    const [showCityModal, setShowCityModal] = useState(false);
    const [showBarangayModal, setShowBarangayModal] = useState(false);
    const [editingCity, setEditingCity] = useState<City | null>(null);
    const [editingBarangay, setEditingBarangay] = useState<Barangay | null>(null);
    const [saving, setSaving] = useState(false);

    // Form States
    const [cityForm, setCityForm] = useState({ name: '', province: 'Bulacan', is_active: true });
    const [barangayForm, setBarangayForm] = useState({ name: '', city_id: '', is_active: true });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch cities with counts
            const { data: citiesData, error: citiesError } = await supabase
                .from('cities')
                .select('*')
                .order('name');

            if (citiesError) throw citiesError;

            // Get barangay counts per city
            const citiesWithCounts = await Promise.all((citiesData || []).map(async (city) => {
                const { count: barangayCount } = await supabase
                    .from('barangays')
                    .select('*', { count: 'exact', head: true })
                    .eq('city_id', city.id);

                const { count: storeCount } = await supabase
                    .from('addresses')
                    .select('*', { count: 'exact', head: true })
                    .eq('city_id', city.id);

                return {
                    ...city,
                    is_active: city.is_active ?? true,
                    barangay_count: barangayCount || 0,
                    store_count: storeCount || 0
                };
            }));

            setCities(citiesWithCounts);

            // Fetch barangays with city info
            const { data: barangaysData, error: barangaysError } = await supabase
                .from('barangays')
                .select(`
                    *,
                    city:cities(name)
                `)
                .order('name');

            if (barangaysError) throw barangaysError;

            setBarangays((barangaysData || []).map(b => ({ ...b, is_active: b.is_active ?? true })));
        } catch (error) {
            console.error('Error fetching locations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Toggle Active Status
    const toggleCityActive = async (city: City) => {
        try {
            const { error } = await supabase
                .from('cities')
                .update({ is_active: !city.is_active })
                .eq('id', city.id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error toggling city status:', error);
        }
    };

    const toggleBarangayActive = async (barangay: Barangay) => {
        try {
            const { error } = await supabase
                .from('barangays')
                .update({ is_active: !barangay.is_active })
                .eq('id', barangay.id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error toggling barangay status:', error);
        }
    };

    // City CRUD
    const handleSaveCity = async () => {
        if (!cityForm.name.trim()) return;
        setSaving(true);

        try {
            if (editingCity) {
                const { error } = await supabase
                    .from('cities')
                    .update({ name: cityForm.name, province: cityForm.province, is_active: cityForm.is_active })
                    .eq('id', editingCity.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('cities')
                    .insert([{ name: cityForm.name, province: cityForm.province, is_active: cityForm.is_active }]);
                if (error) throw error;
            }

            setShowCityModal(false);
            setEditingCity(null);
            setCityForm({ name: '', province: 'Bulacan', is_active: true });
            fetchData();
        } catch (error) {
            console.error('Error saving city:', error);
            alert('Failed to save city');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCity = async (id: string) => {
        if (!confirm('Delete this city? All associated barangays will also be deleted.')) return;

        try {
            const { error } = await supabase.from('cities').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting city:', error);
            alert('Failed to delete city');
        }
    };

    // Barangay CRUD
    const handleSaveBarangay = async () => {
        if (!barangayForm.name.trim() || !barangayForm.city_id) return;
        setSaving(true);

        try {
            if (editingBarangay) {
                const { error } = await supabase
                    .from('barangays')
                    .update({ name: barangayForm.name, city_id: barangayForm.city_id, is_active: barangayForm.is_active })
                    .eq('id', editingBarangay.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('barangays')
                    .insert([{ name: barangayForm.name, city_id: barangayForm.city_id, is_active: barangayForm.is_active }]);
                if (error) throw error;
            }

            setShowBarangayModal(false);
            setEditingBarangay(null);
            setBarangayForm({ name: '', city_id: '', is_active: true });
            fetchData();
        } catch (error) {
            console.error('Error saving barangay:', error);
            alert('Failed to save barangay');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBarangay = async (id: string) => {
        if (!confirm('Delete this barangay?')) return;

        try {
            const { error } = await supabase.from('barangays').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting barangay:', error);
            alert('Failed to delete barangay');
        }
    };

    const openEditCity = (city: City) => {
        setEditingCity(city);
        setCityForm({ name: city.name, province: city.province, is_active: city.is_active });
        setShowCityModal(true);
    };

    const openEditBarangay = (barangay: Barangay) => {
        setEditingBarangay(barangay);
        setBarangayForm({ name: barangay.name, city_id: barangay.city_id, is_active: barangay.is_active });
        setShowBarangayModal(true);
    };

    // Filter cities - show inactive if showInactive is true
    const filteredCities = cities.filter(city => {
        const matchesSearch = city.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesActive = showInactive || city.is_active;
        return matchesSearch && matchesActive;
    });

    // Filter barangays
    const filteredBarangays = barangays.filter(barangay => {
        const matchesSearch = barangay.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCity = selectedCity === 'all' || barangay.city_id === selectedCity;
        const matchesActive = showInactive || barangay.is_active;
        return matchesSearch && matchesCity && matchesActive;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Stats - only count active
    const activeCities = cities.filter(c => c.is_active).length;
    const activeBarangays = barangays.filter(b => b.is_active).length;

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
                    <h1 className="text-2xl font-bold text-mocha-900">Locations</h1>
                    <p className="text-mocha-500">Manage cities and barangays for the platform</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{activeCities}</p>
                            <p className="text-sm text-mocha-500">Active Cities</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{activeBarangays}</p>
                            <p className="text-sm text-mocha-500">Active Barangays</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">{cities.length - activeCities}</p>
                            <p className="text-sm text-mocha-500">Inactive Cities</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-mocha-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Store className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-mocha-900">
                                {cities.reduce((sum, c) => sum + (c.store_count || 0), 0)}
                            </p>
                            <p className="text-sm text-mocha-500">Registered Addresses</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-mocha-200">
                <button
                    onClick={() => setActiveTab('cities')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'cities'
                        ? 'border-mocha-600 text-mocha-900'
                        : 'border-transparent text-mocha-500 hover:text-mocha-700'
                        }`}
                >
                    <Building2 className="w-4 h-4 inline-block mr-2" />
                    Cities ({activeCities})
                </button>
                <button
                    onClick={() => setActiveTab('barangays')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'barangays'
                        ? 'border-mocha-600 text-mocha-900'
                        : 'border-transparent text-mocha-500 hover:text-mocha-700'
                        }`}
                >
                    <MapPin className="w-4 h-4 inline-block mr-2" />
                    Barangays ({activeBarangays})
                </button>
            </div>

            {/* Search & Actions */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 shadow-sm"
                    />
                </div>
                {activeTab === 'barangays' && (
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="px-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-700 focus:outline-none focus:border-mocha-400 shadow-sm"
                    >
                        <option value="all">All Cities</option>
                        {cities.filter(c => c.is_active).map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                    </select>
                )}
                {/* Show Inactive Toggle */}
                <button
                    onClick={() => setShowInactive(!showInactive)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${showInactive
                            ? 'bg-mocha-600 text-white'
                            : 'bg-white border border-mocha-200 text-mocha-600 hover:bg-mocha-50'
                        }`}
                >
                    {showInactive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    Show Inactive
                </button>
                <button
                    onClick={() => {
                        if (activeTab === 'cities') {
                            setCityForm({ name: '', province: 'Bulacan', is_active: true });
                            setEditingCity(null);
                            setShowCityModal(true);
                        } else {
                            setBarangayForm({ name: '', city_id: cities.find(c => c.is_active)?.id || '', is_active: true });
                            setEditingBarangay(null);
                            setShowBarangayModal(true);
                        }
                    }}
                    className="px-6 py-3 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add {activeTab === 'cities' ? 'City' : 'Barangay'}
                </button>
            </div>

            {/* Cities Table */}
            {activeTab === 'cities' && (
                <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-mocha-100 bg-mocha-50">
                                <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">City Name</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Province</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Barangays</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Created</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-mocha-100">
                            {filteredCities.map((city) => (
                                <tr key={city.id} className={`hover:bg-mocha-50 transition-colors ${!city.is_active ? 'opacity-60' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${city.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                <Building2 className={`w-5 h-5 ${city.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                                            </div>
                                            <span className="font-medium text-mocha-900">{city.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-mocha-600">{city.province}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {city.barangay_count}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleCityActive(city)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${city.is_active
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                        >
                                            {city.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                            {city.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-mocha-500">{formatDate(city.created_at)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditCity(city)}
                                                className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCity(city.id)}
                                                className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCities.length === 0 && (
                        <div className="p-12 text-center text-mocha-500">
                            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No cities found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Barangays Table */}
            {activeTab === 'barangays' && (
                <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-mocha-100 bg-mocha-50">
                                <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Barangay Name</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">City</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-mocha-600">Created</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-mocha-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-mocha-100">
                            {filteredBarangays.map((barangay) => (
                                <tr key={barangay.id} className={`hover:bg-mocha-50 transition-colors ${!barangay.is_active ? 'opacity-60' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${barangay.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <MapPin className={`w-5 h-5 ${barangay.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                                            </div>
                                            <span className="font-medium text-mocha-900">{barangay.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                            <Building2 className="w-3.5 h-3.5" />
                                            {barangay.city?.name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleBarangayActive(barangay)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${barangay.is_active
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                        >
                                            {barangay.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                            {barangay.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-mocha-500">{formatDate(barangay.created_at)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditBarangay(barangay)}
                                                className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBarangay(barangay.id)}
                                                className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredBarangays.length === 0 && (
                        <div className="p-12 text-center text-mocha-500">
                            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No barangays found</p>
                        </div>
                    )}
                </div>
            )}

            {/* City Modal */}
            {showCityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-mocha-100 bg-mocha-50">
                            <h3 className="font-bold text-mocha-900">
                                {editingCity ? 'Edit City' : 'Add New City'}
                            </h3>
                            <button onClick={() => setShowCityModal(false)} className="p-1 hover:bg-mocha-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-mocha-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">City Name</label>
                                <input
                                    type="text"
                                    value={cityForm.name}
                                    onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                                    placeholder="e.g., Plaridel"
                                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Province</label>
                                <input
                                    type="text"
                                    value={cityForm.province}
                                    onChange={(e) => setCityForm({ ...cityForm, province: e.target.value })}
                                    placeholder="e.g., Bulacan"
                                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-mocha-50 rounded-xl">
                                <span className="text-sm font-medium text-mocha-700">Active Status</span>
                                <button
                                    onClick={() => setCityForm({ ...cityForm, is_active: !cityForm.is_active })}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${cityForm.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {cityForm.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    {cityForm.is_active ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowCityModal(false)}
                                    className="px-4 py-2 text-mocha-600 hover:bg-mocha-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCity}
                                    disabled={saving || !cityForm.name.trim()}
                                    className="px-6 py-2 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingCity ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Barangay Modal */}
            {showBarangayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-mocha-100 bg-mocha-50">
                            <h3 className="font-bold text-mocha-900">
                                {editingBarangay ? 'Edit Barangay' : 'Add New Barangay'}
                            </h3>
                            <button onClick={() => setShowBarangayModal(false)} className="p-1 hover:bg-mocha-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-mocha-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">City</label>
                                <select
                                    value={barangayForm.city_id}
                                    onChange={(e) => setBarangayForm({ ...barangayForm, city_id: e.target.value })}
                                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                >
                                    <option value="">Select City</option>
                                    {cities.filter(c => c.is_active).map(city => (
                                        <option key={city.id} value={city.id}>{city.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Barangay Name</label>
                                <input
                                    type="text"
                                    value={barangayForm.name}
                                    onChange={(e) => setBarangayForm({ ...barangayForm, name: e.target.value })}
                                    placeholder="e.g., Poblacion"
                                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-mocha-50 rounded-xl">
                                <span className="text-sm font-medium text-mocha-700">Active Status</span>
                                <button
                                    onClick={() => setBarangayForm({ ...barangayForm, is_active: !barangayForm.is_active })}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${barangayForm.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {barangayForm.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    {barangayForm.is_active ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowBarangayModal(false)}
                                    className="px-4 py-2 text-mocha-600 hover:bg-mocha-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveBarangay}
                                    disabled={saving || !barangayForm.name.trim() || !barangayForm.city_id}
                                    className="px-6 py-2 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingBarangay ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
