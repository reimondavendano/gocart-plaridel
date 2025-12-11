'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import SellerRegistrationModal from '@/components/seller/SellerRegistrationModal';
import AuthModal from '@/components/auth/AuthModal';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import { Plan } from '@/types';
import { Check, Store, Zap, Shield, TrendingUp, Loader } from 'lucide-react';

export default function SubscriptionPage() {
    const { isAuthenticated } = useAppSelector((state) => state.user);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlans() {
            try {
                const { data, error } = await supabase
                    .from('plans')
                    .select('*')
                    .eq('is_active', true)
                    .order('price', { ascending: true });

                if (data) {
                    const mappedPlans: Plan[] = data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        currency: p.currency,
                        features: Array.isArray(p.features) ? p.features : [],
                        maxStores: p.max_stores,
                        maxProducts: p.max_products,
                        transactionFee: p.transaction_fee,
                        isActive: p.is_active,
                        createdAt: p.created_at
                    }));
                    setPlans(mappedPlans);
                }
            } catch (err) {
                console.error("Error fetching plans:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPlans();
    }, []);

    const handleSubscribe = (planName: string) => {
        if (!isAuthenticated) {
            setIsAuthModalOpen(true);
            return;
        }
        setSelectedPlan(planName);
        setIsSellerModalOpen(true);
    };

    // Helper to get icon based on name
    const getPlanIcon = (name: string) => {
        if (name.includes('Starter')) return Store;
        if (name.includes('Growth')) return TrendingUp;
        if (name.includes('Pro')) return Zap;
        if (name.includes('Enterprise')) return Shield;
        return Store;
    };

    const getPlanColors = (name: string) => {
        if (name.includes('Starter')) return { color: 'bg-gray-100', text: 'text-gray-900', btn: 'bg-gray-900 text-white hover:bg-gray-800' };
        if (name.includes('Growth')) return { color: 'bg-blue-50', text: 'text-blue-900', btn: 'bg-blue-600 text-white hover:bg-blue-700' };
        if (name.includes('Pro')) return { color: 'bg-mocha-50', text: 'text-mocha-900', btn: 'bg-mocha-600 text-white hover:bg-mocha-700' };
        if (name.includes('Enterprise')) return { color: 'bg-dusk-50', text: 'text-dusk-900', btn: 'bg-dusk-600 text-white hover:bg-dusk-700' };
        return { color: 'bg-gray-100', text: 'text-gray-900', btn: 'bg-gray-900' };
    };

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
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader className="w-10 h-10 text-mocha-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
                            {plans.map((plan) => {
                                const Icon = getPlanIcon(plan.name);
                                const style = getPlanColors(plan.name);
                                const isPopular = plan.name === 'Growth'; // Hardcoded popular logic for now

                                return (
                                    <div
                                        key={plan.id}
                                        className={`relative rounded-3xl p-8 border hover:-translate-y-2 transition-transform duration-300 flex flex-col ${isPopular
                                            ? 'bg-white border-mocha-200 shadow-xl ring-2 ring-mocha-500/20'
                                            : 'bg-white border-gray-100 shadow-lg'
                                            }`}
                                    >
                                        {isPopular && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-mocha-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                                                Most Popular
                                            </div>
                                        )}

                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${style.color}`}>
                                            <Icon className={`w-6 h-6 ${style.text}`} />
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                        <p className="text-sm text-gray-500 mb-6 min-h-[40px] opacity-80">
                                            Limits: {plan.maxStores} Store(s), {plan.maxProducts} Products
                                        </p>

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
                                            {plan.features.map((feature: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                            {/* Transaction Fee */}
                                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                                <Check className="w-5 h-5 text-green-500 shrink-0" />
                                                <span>{plan.transactionFee}% Transaction Fee</span>
                                            </li>
                                        </ul>

                                        <button
                                            onClick={() => handleSubscribe(plan.name)}
                                            className={`w-full py-3 rounded-xl font-semibold transition-colors ${style.btn}`}
                                        >
                                            {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

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
            <SellerRegistrationModal
                isOpen={isSellerModalOpen}
                onClose={() => setIsSellerModalOpen(false)}
                initialPlan={selectedPlan}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
            <SearchModal />
            <ToastContainer />
        </>
    );
}
