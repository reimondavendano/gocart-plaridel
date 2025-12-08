'use client';

import Link from 'next/link';
import { Crown, Check, Sparkles, ArrowRight } from 'lucide-react';
import { subscriptionPlans } from '@/data/mockup';

export default function SubscriptionSection() {
    return (
        <section className="py-20 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 gradient-premium opacity-10" />
            <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-dusk-500/10 blur-3xl" />
            <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-mocha-500/10 blur-3xl" />

            <div className="container-custom relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dusk-100 border border-dusk-200 mb-4">
                        <Crown className="w-4 h-4 text-dusk-500" />
                        <span className="text-sm font-medium text-dusk-700">Premium Membership</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-mocha-900 mb-4">
                        Upgrade to <span className="gradient-text">GoCart Plus</span>
                    </h2>
                    <p className="text-mocha-600 max-w-2xl mx-auto">
                        Unlock exclusive benefits, enjoy free shipping on all orders, and get access to members-only deals.
                    </p>
                </div>

                {/* Plans */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <div className="glass-card rounded-3xl p-8">
                        <h3 className="text-2xl font-bold text-mocha-900 mb-2">{subscriptionPlans.free.name}</h3>
                        <p className="text-mocha-500 mb-6">Basic shopping experience</p>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-4xl font-bold text-mocha-800">₱0</span>
                            <span className="text-mocha-500">/month</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            {subscriptionPlans.free.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-mocha-700">
                                    <Check className="w-5 h-5 text-mocha-400" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-xl border-2 border-mocha-300 text-mocha-700 font-semibold hover:bg-mocha-50 transition-colors">
                            Current Plan
                        </button>
                    </div>

                    {/* Plus Plan */}
                    <div className="relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-dusk-500 to-mocha-600 text-white text-sm font-semibold">
                            RECOMMENDED
                        </div>
                        <div className="glass-card rounded-3xl p-8 border-2 border-dusk-300 bg-gradient-to-br from-dusk-50/50 to-mocha-50/50">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-2xl font-bold text-mocha-900">{subscriptionPlans.plus.name}</h3>
                                <Crown className="w-6 h-6 text-dusk-500" />
                            </div>
                            <p className="text-mocha-500 mb-6">Premium shopping experience</p>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-bold text-mocha-800">₱{subscriptionPlans.plus.price}</span>
                                <span className="text-mocha-500">/month</span>
                            </div>
                            <p className="text-sm text-dusk-600 mb-8">
                                <Sparkles className="w-4 h-4 inline mr-1" />
                                7-day free trial included
                            </p>
                            <ul className="space-y-4 mb-8">
                                {subscriptionPlans.plus.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-mocha-700">
                                        <div className="w-5 h-5 rounded-full bg-dusk-500 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/subscription"
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-dusk-500 to-mocha-600 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
