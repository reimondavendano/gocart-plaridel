'use client';

import { useState, useEffect } from 'react';
import { X, Store, MapPin, CreditCard, CheckCircle, ChevronRight, ChevronLeft, Upload } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateProfile, updateSubscription } from '@/store/slices/userSlice';

interface SellerRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan?: string | null; // 'Starter', 'Growth', etc.
}

export default function SellerRegistrationModal({ isOpen, onClose, initialPlan }: SellerRegistrationModalProps) {
    const dispatch = useAppDispatch();
    const { currentUser } = useAppSelector((state) => state.user);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        storeName: '',
        description: '',
        street: '',
        city: '',
        province: '',
        postalCode: '',
        idImage: null as File | null,
        selectedPlan: initialPlan || '',
    });

    useEffect(() => {
        if (initialPlan) {
            setFormData(prev => ({ ...prev, selectedPlan: initialPlan }));
        }
    }, [initialPlan]);

    // Reset step when opened
    useEffect(() => {
        if (isOpen) setStep(1);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        // Mock API Call simulation
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update user role to seller locally
        dispatch(updateProfile({ role: 'seller' }));
        // If plan is 'Starter' (Free), set subscription to free, others plus? 
        // Logic: app uses 'free' | 'plus'. Map Starter->free, others->plus
        const subType = formData.selectedPlan === 'Starter' ? 'free' : 'plus';

        // Update subscription locally (mock)
        // Note: In real app, this would happen after webhook confirmation
        // dispatch(updateSubscription(subType)); 

        onClose();
        alert('Application Submitted! Please wait for admin verification.');
    };

    const plans = [
        { name: 'Starter', price: 0 },
        { name: 'Growth', price: 199 },
        { name: 'Pro', price: 499 },
        { name: 'Enterprise', price: 999 },
    ];

    const renderStep1 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Store Information</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mocha-500 focus:outline-none"
                    placeholder="e.g. My Awesome Shop"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mocha-500 focus:outline-none"
                    rows={3}
                    placeholder="Tell us about what you sell..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Logo (Mock)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm">Click to upload image</span>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Address</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mocha-500 focus:outline-none"
                    placeholder="Unit 123, Building Name"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mocha-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <input
                        type="text"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mocha-500 focus:outline-none"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mocha-500 focus:outline-none"
                />
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Your Plan</h3>

            {initialPlan ? (
                <div className="bg-mocha-50 border border-mocha-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Selected Plan</p>
                        <p className="text-xl font-bold text-mocha-900">{initialPlan}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-mocha-600" />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {plans.map((p) => (
                        <div
                            key={p.name}
                            onClick={() => setFormData({ ...formData, selectedPlan: p.name })}
                            className={`cursor-pointer rounded-xl p-3 border-2 transition-all ${formData.selectedPlan === p.name
                                ? 'border-mocha-600 bg-mocha-50'
                                : 'border-gray-200 hover:border-mocha-300'
                                }`}
                        >
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-sm text-gray-500">₱{p.price}/mo</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Billing Information</h4>
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg mb-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Card Number"
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="text"
                        placeholder="MM/YY"
                        className="p-3 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    />
                    <input
                        type="text"
                        placeholder="CVC"
                        className="p-3 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Create a Store</h2>
                        <p className="text-xs text-gray-500">Step {step} of 3</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 h-1">
                    <div
                        className="bg-mocha-600 h-1 transition-all duration-300"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <button
                        onClick={step === 1 ? onClose : handleBack}
                        className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    <button
                        onClick={step === 3 ? handleSubmit : handleNext}
                        disabled={step === 1 && !formData.storeName}
                        className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {step === 3 ? 'Submit Application' : 'Next'}
                        {step !== 3 && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
