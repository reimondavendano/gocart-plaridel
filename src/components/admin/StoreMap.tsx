'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface StoreLocation {
    id: string;
    name: string;
    slug: string;
    latitude: number;
    longitude: number;
    status: 'pending' | 'approved' | 'rejected';
    city_name: string;
    barangay_name: string;
}

interface StoreMapProps {
    stores: StoreLocation[];
}

// Custom marker icons
const createMarkerIcon = (status: string) => {
    const colors = {
        approved: '#22c55e',
        pending: '#eab308',
        rejected: '#ef4444'
    };
    const color = colors[status as keyof typeof colors] || colors.approved;

    return L.divIcon({
        className: 'custom-store-marker',
        html: `
            <div style="
                width: 36px;
                height: 36px;
                background: ${color};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg style="
                    width: 18px;
                    height: 18px;
                    transform: rotate(45deg);
                    fill: white;
                " viewBox="0 0 24 24">
                    <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
                </svg>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
};

export default function StoreMap({ stores }: StoreMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Center on Plaridel, Bulacan area
        const defaultCenter: [number, number] = [14.8885, 120.8605];
        const defaultZoom = 12;

        // Initialize map if not already initialized
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, defaultZoom);

            // Add OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);
        }

        // Clear existing markers
        mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                mapRef.current?.removeLayer(layer);
            }
        });

        // Add markers for each store
        const markers: L.Marker[] = [];
        stores.forEach((store) => {
            if (store.latitude && store.longitude) {
                const marker = L.marker([store.latitude, store.longitude], {
                    icon: createMarkerIcon(store.status)
                });

                // Create popup content
                const popupContent = `
                    <div style="min-width: 200px; font-family: system-ui, sans-serif;">
                        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1e1e1e;">
                            ${store.name}
                        </div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                            ${store.barangay_name ? store.barangay_name + ', ' : ''}${store.city_name}
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                            <span style="
                                padding: 2px 8px;
                                border-radius: 9999px;
                                font-size: 11px;
                                font-weight: 500;
                                background: ${store.status === 'approved' ? '#dcfce7' : store.status === 'pending' ? '#fef9c3' : '#fee2e2'};
                                color: ${store.status === 'approved' ? '#166534' : store.status === 'pending' ? '#854d0e' : '#991b1b'};
                            ">
                                ${store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                            </span>
                        </div>
                        <div style="font-size: 11px; color: #999; font-family: monospace;">
                            ${store.latitude.toFixed(6)}, ${store.longitude.toFixed(6)}
                        </div>
                        <a href="/store/${store.slug}" target="_blank" style="
                            display: inline-block;
                            margin-top: 8px;
                            padding: 4px 12px;
                            background: #8b5a2b;
                            color: white;
                            border-radius: 6px;
                            font-size: 12px;
                            text-decoration: none;
                            font-weight: 500;
                        ">
                            View Store
                        </a>
                    </div>
                `;

                marker.bindPopup(popupContent);
                marker.addTo(mapRef.current!);
                markers.push(marker);
            }
        });

        // Fit map to show all markers if there are any
        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            mapRef.current.fitBounds(group.getBounds().pad(0.1));
        }

        // Cleanup on unmount
        return () => {
            // Don't destroy map on cleanup to avoid re-initialization issues
        };
    }, [stores]);

    // Cleanup map on component unmount
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={mapContainerRef}
            className="w-full h-[600px]"
            style={{ zIndex: 1 }}
        />
    );
}
