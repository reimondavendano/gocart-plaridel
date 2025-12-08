'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import { Check, Star, Store, Zap, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const plans = [
        {
            name: 'Starter',
            price: 0,
            description: 'Perfect for new sellers just getting started.',
            features: [
                'Create 1 Store (Verification Required)',
                'Upload up to 1 Product',
                'Basic Store Analytics',
                'Standard Transaction Fees (3%)',
                'Community Support',
            ],
            icon: Store,
            color: 'bg-gray-100',
            textColor: 'text-gray-900',
            btnColor: 'bg-gray-900 text-white hover:bg-gray-800',
            popular: false,
        },
        {
            name: 'Growth',
            price: 199,
            description: 'Everything you need to grow your business.',
            features: [
                'Create 1 Store (Verification Required)',
                'Upload up to 50 Products',
                'Advanced Analytics Dashboard',
                'Reduced Transaction Fees (2%)',
                '"Verified Seller" Badge',
                'Priority Email Support',
            ],
            icon: TrendingUp,
            color: 'bg-blue-50',
            textColor: 'text-blue-900',
            btnColor: 'bg-blue-600 text-white hover:bg-blue-700',
            popular: true,
        },
        {
            name: 'Pro',
            price: 499,
            description: 'Advanced tools for established businesses.',
            features: [
                'Create up to 2 Stores',
                'Upload up to 500 Products',
                'Professional Analytics & Reports',
                'Low Transaction Fees (1%)',
                'Marketing Tools (Coupons/Deals)',
                '"Pro Seller" Badge',
                '24/7 Priority Support',
            ],
            icon: Zap,
            color: 'bg-mocha-50',
            textColor: 'text-mocha-900',
            btnColor: 'bg-mocha-600 text-white hover:bg-mocha-700',
            popular: false,
        },
        {
            name: 'Enterprise',
            price: 999,
            description: 'Maximum power and scale for your brand.',
            features: [
                'Unlimited Stores',
                'Unlimited Product Uploads',
                'Custom Analytics & API Access',
                'Lowest Transaction Fees (0.5%)',
                'Dedicated Account Manager',
                'Top Search Ranking',
                'Early Access to New Features',
            ],
            icon: Shield,
            color: 'bg-dusk-50',
            textColor: 'text-dusk-900',
            btnColor: 'bg-dusk-600 text-white hover:bg-dusk-700',
            popular: false,
        },
    ];

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-gray-50 via-white to-mocha-50">
                <div className="container-custom">
                    {/* Header Section */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-mocha-600 font-semibold tracking-wide uppercase text-sm mb-2 block">
                            Seller Plans
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                            Choose the Perfect Plan for Your Business
                        </h1>
                        <p className="text-xl text-gray-500 mb-8">
                            Unlock powerful tools to scale your store. All new stores undergo admin verification to ensure quality and trust.
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                                Monthly
                            </span>
                            <button
                                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${billingCycle === 'yearly' ? 'bg-mocha-600' : 'bg-gray-300'
                                    }`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                                Yearly <span className="text-mocha-600 text-xs">(Save 20%)</span>
                            </span>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-3xl p-8 border hover:-translate-y-2 transition-transform duration-300 flex flex-col ${plan.popular
                                    ? 'bg-white border-mocha-200 shadow-xl ring-2 ring-mocha-500/20'
                                    : 'bg-white border-gray-100 shadow-lg'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-mocha-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                                        Most Popular
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.color}`}>
                                    <plan.icon className={`w-6 h-6 ${plan.textColor}`} />
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{plan.description}</p>

                                <div className="mb-8">
                                    <span className="text-4xl font-bold text-gray-900">
                                        ₱{billingCycle === 'yearly' ? (plan.price * 12 * 0.8 / 12).toFixed(0) : plan.price}
                                    </span>
                                    <span className="text-gray-500">/month</span>
                                    {billingCycle === 'yearly' && (
                                        <p className="text-xs text-mocha-600 mt-1">Billed ₱{(plan.price * 12 * 0.8).toFixed(0)} yearly</p>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                            <Check className="w-5 h-5 text-green-500 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button className={`w-full py-3 rounded-xl font-semibold transition-colors ${plan.btnColor}`}>
                                    {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* FAQ or Additional Info */}
                    <div className="mt-20 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left mt-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-2">How does verification work?</h4>
                                <p className="text-gray-500 text-sm">After you create a store, our admin team reviews your application within 24-48 hours. Once verified, your store will go live.</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-2">Can I upgrade my plan later?</h4>
                                <p className="text-gray-500 text-sm">Yes, you can upgrade your plan at any time. The difference will be prorated for the remainder of your billing cycle.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <CartDrawer />
            <SearchModal />
            <ToastContainer />
        </>
    );
}
