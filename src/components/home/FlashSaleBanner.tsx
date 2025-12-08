'use client';

import { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';

export default function FlashSaleBanner() {
    const [timeLeft, setTimeLeft] = useState({
        hours: 23,
        minutes: 45,
        seconds: 59,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="gradient-premium px-4 md:px-8 lg:px-12 py-4 md:py-5 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span className="text-white/90 font-medium text-sm">Flash Sale</span>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-white/20" />
                    <h2 className="text-lg md:text-xl font-bold text-white">
                        Up to 50% Off Today!
                    </h2>
                    <p className="hidden md:block text-white/70 text-sm">
                        Grab exclusive deals before they&apos;re gone
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
