'use client';

import Link from 'next/link';
import { Store, TrendingUp, Zap, Shield, Check, ArrowRight } from 'lucide-react';

export default function SubscriptionSection() {
    const plans = [
        {
            name: 'Starter',
            price: 0,
            features: ['1 Store', '1 Product', 'Basic Analytics'],
            icon: Store,
            color: 'bg-gray-100',
            textColor: 'text-gray-900',
        },
        {
            name: 'Growth',
            price: 199,
            features: ['1 Store', '50 Products', 'Verified Badge'],
            icon: TrendingUp,
            color: 'bg-blue-50',
            textColor: 'text-blue-900',
            popular: true,
        },
        {
            name: 'Pro',
            price: 499,
            features: ['2 Stores', '500 Products', 'Priority Support'],
            icon: Zap,
            color: 'bg-mocha-50',
            textColor: 'text-mocha-900',
        },
        {
            name: 'Enterprise',
            price: 999,
            features: ['Unlimited', 'API Access', 'Dedicated Manager'],
            icon: Shield,
            color: 'bg-dusk-50',
            textColor: 'text-dusk-900',
        },
    ];

    return (
        <section className="py-20 relative overflow-hidden bg-white">
            <div className="container-custom relative z-10">
                <div className="text-center mb-12">
                    <span className="text-mocha-600 font-semibold tracking-wide uppercase text-sm mb-2 block">
                        Partner with Us
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Become a <span className="gradient-text">GoCart Seller</span>
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Start your journey today. Choose a plan that fits your business needs and scale with our powerful tools.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`rounded-2xl p-6 border transition-all hover:shadow-lg ${plan.popular ? 'border-mocha-200 bg-white ring-2 ring-mocha-100' : 'border-gray-100 bg-gray-50/50'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.color}`}>
                                <plan.icon className={`w-5 h-5 ${plan.textColor}`} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-2xl font-bold text-gray-900">₱{plan.price}</span>
                                <span className="text-gray-500 text-sm">/mo</span>
                            </div>
                            <ul className="space-y-2 mb-6">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <Link
                        href="/subscription"
                        className="btn-primary inline-flex items-center gap-2 !px-8 !py-3"
                    >
                        View Full Plan Details
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
