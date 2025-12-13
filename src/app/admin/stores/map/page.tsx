'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Store, RefreshCw, ChevronDown, Filter, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the Map component to avoid SSR issues
const MapWithNoSSR = dynamic(() => import('@/components/admin/StoreMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[600px] bg-mocha-100 rounded-xl flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )
});

interface StoreLocation {
    id: string;
    name: string;
    slug: string;
    latitude: number;
    longitude: number;
    status: 'pending' | 'approved' | 'rejected';
    city_id: string;
    city_name: string;
    barangay_name: string;
}

interface City {
    id: string;
    name: string;
}

export default function AdminStoreMapPage() {
    const [stores, setStores] = useState<StoreLocation[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchCities();
        fetchStores();
    }, []);

    const fetchCities = async () => {
        const { data } = await supabase
            .from('cities')
            .select('id, name')
            .eq('is_active', true)
            .order('name');
        if (data) setCities(data);
    };

    const fetchStores = async () => {
        try {
            const { data, error } = await supabase
                .from('stores')
                .select(`
                    id, name, slug, latitude, longitude, status,
                    address:addresses(
                        city_id,
                        city:cities(id, name),
                        barangay:barangays(name)
                    )
                `)
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            if (error) throw error;

            const formattedStores = (data || []).map((store: any) => {
                const address = Array.isArray(store.address) ? store.address[0] : store.address;
                const city = address?.city;
                const barangay = address?.barangay;

                return {
                    id: store.id,
                    name: store.name,
                    slug: store.slug,
                    latitude: store.latitude,
                    longitude: store.longitude,
                    status: store.status,
                    city_id: city?.id || '',
                    city_name: city?.name || 'Unknown',
                    barangay_name: barangay?.name || ''
                };
            });

            setStores(formattedStores);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = stores.filter(store => {
        const matchesCity = selectedCity === 'all' || store.city_id === selectedCity;
        const matchesStatus = statusFilter === 'all' || store.status === statusFilter;
        return matchesCity && matchesStatus;
    });

    const storesByStatus = {
        all: stores.length,
        approved: stores.filter(s => s.status === 'approved').length,
        pending: stores.filter(s => s.status === 'pending').length,
        rejected: stores.filter(s => s.status === 'rejected').length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900 flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-mocha-600" />
                        Store Locations Map
                    </h1>
                    <p className="text-mocha-500">View store locations across Plaridel, Bustos, and Pulilan</p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchStores(); }}
                    className="px-4 py-2 bg-mocha-100 hover:bg-mocha-200 text-mocha-700 rounded-xl transition-colors flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats & Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Stats Pills */}
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                        <Store className="w-4 h-4" />
                        {filteredStores.length} on map
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        <MapPin className="w-4 h-4" />
                        {storesByStatus.approved} approved
                    </div>
                    {storesByStatus.pending > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                            {storesByStatus.pending} pending
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                    <div className="relative">
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 bg-white border border-mocha-200 rounded-xl text-mocha-700 focus:outline-none focus:border-mocha-400 cursor-pointer text-sm"
                        >
                            <option value="all">All Cities</option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 bg-white border border-mocha-200 rounded-xl text-mocha-700 focus:outline-none focus:border-mocha-400 cursor-pointer text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="w-full h-[600px] flex items-center justify-center bg-mocha-50">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-mocha-500">Loading map...</p>
                        </div>
                    </div>
                ) : (
                    <MapWithNoSSR stores={filteredStores} />
                )}
            </div>

            {/* Store List */}
            <div className="bg-white border border-mocha-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-mocha-100 bg-mocha-50">
                    <h3 className="font-semibold text-mocha-900">Stores with Location ({filteredStores.length})</h3>
                </div>
                <div className="divide-y divide-mocha-100 max-h-[300px] overflow-y-auto">
                    {filteredStores.length === 0 ? (
                        <div className="p-8 text-center text-mocha-500">
                            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No stores found with location data</p>
                        </div>
                    ) : (
                        filteredStores.map((store) => (
                            <div key={store.id} className="p-4 hover:bg-mocha-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${store.status === 'approved' ? 'bg-green-100' :
                                            store.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                                        }`}>
                                        <Store className={`w-5 h-5 ${store.status === 'approved' ? 'text-green-600' :
                                                store.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                                            }`} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-mocha-900">{store.name}</p>
                                        <p className="text-sm text-mocha-500">
                                            {store.barangay_name && `${store.barangay_name}, `}{store.city_name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-mocha-400 font-mono">
                                        {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                                    </span>
                                    <a
                                        href={`/admin/stores?id=${store.id}`}
                                        className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-600 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
