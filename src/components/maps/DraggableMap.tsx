'use client';

import { useEffect, useState, useRef } from 'react';

// City coordinates and boundaries
// Each city has a center point and a bounding box (approximate)
export const CITY_DATA: Record<string, {
    lat: number;
    lng: number;
    name: string;
    bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    }
}> = {
    'plaridel': {
        lat: 14.8867,
        lng: 120.8572,
        name: 'Plaridel',
        bounds: {
            north: 14.9200,
            south: 14.8500,
            east: 120.8900,
            west: 120.8200
        }
    },
    'bustos': {
        lat: 14.9533,
        lng: 120.9167,
        name: 'Bustos',
        bounds: {
            north: 14.9900,
            south: 14.9200,
            east: 120.9600,
            west: 120.8700
        }
    },
    'pulilan': {
        lat: 14.9019,
        lng: 120.8492,
        name: 'Pulilan',
        bounds: {
            north: 14.9400,
            south: 14.8700,
            east: 120.8800,
            west: 120.8100
        }
    }
};

// For backwards compatibility
export const CITY_COORDINATES = Object.fromEntries(
    Object.entries(CITY_DATA).map(([key, value]) => [key, { lat: value.lat, lng: value.lng, name: value.name }])
);

/**
 * Check if coordinates are within any of the allowed cities
 * Returns the city name if within bounds, null otherwise
 */
export function isWithinAllowedArea(lat: number, lng: number): string | null {
    for (const [key, city] of Object.entries(CITY_DATA)) {
        if (
            lat <= city.bounds.north &&
            lat >= city.bounds.south &&
            lng <= city.bounds.east &&
            lng >= city.bounds.west
        ) {
            return city.name;
        }
    }
    return null;
}

/**
 * Check if coordinates are within a specific city
 */
export function isWithinCity(lat: number, lng: number, cityName: string): boolean {
    const key = cityName.toLowerCase();
    const city = CITY_DATA[key];
    if (!city) return false;

    return (
        lat <= city.bounds.north &&
        lat >= city.bounds.south &&
        lng <= city.bounds.east &&
        lng >= city.bounds.west
    );
}

/**
 * Get the nearest allowed city center for out-of-bounds coordinates
 */
export function getNearestCityCenter(lat: number, lng: number): { lat: number; lng: number; name: string } {
    let nearestCity = CITY_DATA['plaridel'];
    let minDistance = Infinity;

    for (const city of Object.values(CITY_DATA)) {
        const distance = Math.sqrt(
            Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
        }
    }

    return { lat: nearestCity.lat, lng: nearestCity.lng, name: nearestCity.name };
}

// Get coordinates by city ID or name
export function getCityCoordinates(cityIdOrName: string, cities?: { id: string; name: string }[]): { lat: number; lng: number } | null {
    // If cities array is provided, find city name by ID
    if (cities) {
        const city = cities.find(c => c.id === cityIdOrName);
        if (city) {
            const key = city.name.toLowerCase();
            if (CITY_DATA[key]) {
                return { lat: CITY_DATA[key].lat, lng: CITY_DATA[key].lng };
            }
        }
    }

    // Try direct lookup by name
    const key = cityIdOrName.toLowerCase();
    if (CITY_DATA[key]) {
        return { lat: CITY_DATA[key].lat, lng: CITY_DATA[key].lng };
    }

    return null;
}

interface DraggableMapProps {
    latitude: number;
    longitude: number;
    onPositionChange: (lat: number, lng: number) => void;
    onOutOfBounds?: (lat: number, lng: number) => void;
    height?: string;
    zoom?: number;
}

export default function DraggableMap({
    latitude,
    longitude,
    onPositionChange,
    onOutOfBounds,
    height = '200px',
    zoom = 15
}: DraggableMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || !mapContainerRef.current) return;

        // Dynamic import of Leaflet only on client side
        const initMap = async () => {
            if (!mapContainerRef.current) return;
            const L = (await import('leaflet')).default;
            // CSS imported in layout.tsx globally

            // Fix for default marker icon
            const DefaultIcon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            L.Marker.prototype.options.icon = DefaultIcon;

            // Initialize map if not already done
            if (!mapRef.current) {
                mapRef.current = L.map(mapContainerRef.current).setView([latitude, longitude], zoom);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(mapRef.current);

                // Add draggable marker
                markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);

                // Handle marker drag end
                markerRef.current.on('dragend', function (e: any) {
                    const newPos = e.target.getLatLng();
                    const withinArea = isWithinAllowedArea(newPos.lat, newPos.lng);

                    if (withinArea) {
                        onPositionChange(newPos.lat, newPos.lng);
                    } else {
                        // Reset marker to previous position
                        markerRef.current.setLatLng([latitude, longitude]);
                        if (onOutOfBounds) {
                            onOutOfBounds(newPos.lat, newPos.lng);
                        }
                    }
                });

                // Handle map click
                mapRef.current.on('click', function (e: any) {
                    const withinArea = isWithinAllowedArea(e.latlng.lat, e.latlng.lng);

                    if (withinArea) {
                        markerRef.current.setLatLng([e.latlng.lat, e.latlng.lng]);
                        onPositionChange(e.latlng.lat, e.latlng.lng);
                    } else {
                        if (onOutOfBounds) {
                            onOutOfBounds(e.latlng.lat, e.latlng.lng);
                        }
                    }
                });
            }
        };

        initMap();

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [isMounted]);

    // Update marker and map view when position changes from outside
    useEffect(() => {
        if (mapRef.current && markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
            mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
        }
    }, [latitude, longitude]);

    if (!isMounted) {
        return (
            <div
                className="rounded-xl bg-mocha-100 flex items-center justify-center"
                style={{ height }}
            >
                <span className="text-mocha-400 text-sm">Loading map...</span>
            </div>
        );
    }

    return (
        <div
            ref={mapContainerRef}
            className="rounded-xl overflow-hidden border border-mocha-200"
            style={{ height }}
        />
    );
}
