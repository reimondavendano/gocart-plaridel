'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Deal {
    id: string;
    title: string;
    description: string;
    deal_type: string; // Changed from literal to string to avoid complex casting if types mismatch at runtime
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    end_date: string;
    start_date: string;
    priority: number;
}

export default function FlashSaleBanner() {
    const [deal, setDeal] = useState<Deal | null>(null);
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const fetchTopDeal = async () => {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('deals')
                .select('*')
                .eq('is_active', true)
                .eq('show_on_landing', true) // Assuming we only show landing page deals here? Or maybe 'flash_sale' specifically?
                .lte('start_date', now)
                .gte('end_date', now)
                .order('priority', { ascending: false })
                .limit(1)
                .single();

            if (!error && data) {
                setDeal(data);
            }
        };

        fetchTopDeal();
    }, []);

    useEffect(() => {
        if (!deal) return;

        const updateTimeLeft = () => {
            const now = new Date();
            const endDate = new Date(deal.end_date);
            const diff = endDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ hours, minutes, seconds });
        };

        updateTimeLeft();
        const timer = setInterval(updateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [deal]);

    const bannerData = useMemo(() => {
        if (!deal) return null;

        const dealTypeLabels: Record<string, string> = {
            flash_sale: 'Flash Sale',
            clearance: 'Clearance Sale',
            seasonal: 'Seasonal Sale',
            bundle: 'Bundle Deal',
            special: 'Special Offer',
        };

        return {
            label: dealTypeLabels[deal.deal_type] || 'Flash Sale',
            title: deal.title,
            description: deal.description || "Grab exclusive deals before they're gone",
        };
    }, [deal]);

    if (!deal || !bannerData) return null;

    return (
        <div className="gradient-premium px-4 md:px-8 lg:px-12 py-4 md:py-5 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span className="text-white/90 font-medium text-sm">{bannerData.label}</span>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-white/20" />
                    <h2 className="text-lg md:text-xl font-bold text-white">
                        {bannerData.title}
                    </h2>
                    <p className="hidden md:block text-white/70 text-sm">
                        {bannerData.description}
                    </p>
                </div>

                {/* Countdown */}
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/60" />
                    <div className="flex gap-1.5">
                        {['hours', 'minutes', 'seconds'].map((unit, i) => (
                            <div key={unit} className="flex items-center gap-1.5">
                                <div className="bg-white/20 backdrop-blur rounded-lg px-2.5 py-1.5">
                                    <span className="text-lg font-bold text-white tabular-nums">
                                        {String(timeLeft[unit as keyof typeof timeLeft]).padStart(2, '0')}
                                    </span>
                                </div>
                                {i < 2 && <span className="text-white/40 font-bold">:</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
