'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Store, MapPin, CreditCard, CheckCircle, ChevronRight, ChevronLeft, Upload, Camera, FileText, AlertTriangle, Loader2, MapPinned } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser } from '@/store/slices/userSlice';
import { supabase } from '@/lib/supabase';

interface SellerRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan?: string | null;
}

export default function SellerRegistrationModal({ isOpen, onClose, initialPlan }: SellerRegistrationModalProps) {
    const dispatch = useAppDispatch();
    const { currentUser } = useAppSelector((state) => state.user);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    const [formData, setFormData] = useState({
        storeName: '',
        description: '',
        street: '',
        city: '',
        province: '',
        postalCode: '',
        latitude: null as number | null,
        longitude: null as number | null,
        logo: '' as string,
        validIdFront: '' as string,
        validIdBack: '' as string,
        businessPermit: '' as string,
        selfieImage: '' as string,
        selectedPlan: initialPlan || 'Starter',
    });

    useEffect(() => {
        if (initialPlan) {
            setFormData(prev => ({ ...prev, selectedPlan: initialPlan }));
        }
    }, [initialPlan]);

    useEffect(() => {
        if (isOpen) setStep(1);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleImageUpload = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const getCurrentLocation = () => {
        setGettingLocation(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }));
                    setGettingLocation(false);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    alert('Could not get your location. Please enable location services.');
                    setGettingLocation(false);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
            setGettingLocation(false);
        }
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
    };

    const handleSubmit = async () => {
        if (!currentUser?.id) return;

        setLoading(true);
        try {
            // 1. Create address
            const { data: addressData, error: addressError } = await supabase
                .from('addresses')
                .insert([{
                    user_id: currentUser.id,
                    label: 'Store',
                    full_name: currentUser.name,
                    phone: currentUser.phone || '',
                    street: formData.street,
                    city: formData.city,
                    province: formData.province,
                    postal_code: formData.postalCode,
                    country: 'Philippines',
                    is_default: false
                }])
                .select()
                .single();

            if (addressError) throw addressError;

            // 2. Get plan ID
            const { data: planData } = await supabase
                .from('plans')
                .select('id')
                .eq('name', formData.selectedPlan)
                .single();

            const planId = planData?.id || '11111111-1111-1111-1111-111111111111'; // Fallback to Starter

            // 3. Create store
            const { error: storeError } = await supabase
                .from('stores')
                .insert([{
                    seller_id: currentUser.id,
                    address_id: addressData.id,
                    name: formData.storeName,
                    slug: generateSlug(formData.storeName),
                    description: formData.description,
                    logo: formData.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${formData.storeName}`,
                    status: 'pending',
                    valid_id_front: formData.validIdFront || null,
                    valid_id_back: formData.validIdBack || null,
                    business_permit: formData.businessPermit || null,
                    selfie_image: formData.selfieImage || null,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }]);

            if (storeError) throw storeError;

            // 4. Update user role to seller
            const { error: userError } = await supabase
                .from('users')
                .update({
                    role: 'seller',
                    plan_id: planId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentUser.id);

            if (userError) throw userError;

            // 5. Update Redux state
            dispatch(setUser({
                ...currentUser,
                role: 'seller',
                planId: planId
            }));

            onClose();
            alert('Your store application has been submitted! Please wait for admin verification.');
        } catch (error) {
            console.error('Error creating store:', error);
            alert('Failed to create store. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const plans = [
        { name: 'Starter', price: 0 },
        { name: 'Growth', price: 199 },
        { name: 'Pro', price: 499 },
        { name: 'Enterprise', price: 999 },
    ];

    const renderStep1 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-mocha-900 mb-2">Store Information</h3>
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Store Name *</label>
                <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50"
                    placeholder="e.g. My Awesome Shop"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Store Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50 resize-none"
                    rows={3}
                    placeholder="Tell us about what you sell..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Store Logo</label>
                <label className="border-2 border-dashed border-mocha-300 rounded-xl p-4 flex flex-col items-center justify-center text-mocha-500 hover:bg-mocha-50 transition-colors cursor-pointer">
                    {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                        <>
                            <Upload className="w-8 h-8 mb-2" />
                            <span className="text-sm">Click to upload logo</span>
                        </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload('logo')} className="hidden" />
                </label>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-mocha-900 mb-2">Business Address</h3>
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Street Address *</label>
                <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50"
                    placeholder="Unit 123, Building Name, Barangay"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-mocha-700 mb-1">City *</label>
                    <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-mocha-700 mb-1">Province *</label>
                    <input
                        type="text"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Postal Code *</label>
                <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50"
                />
            </div>

            {/* Geolocation */}
            <div className="border-t border-mocha-100 pt-4">
                <label className="block text-sm font-medium text-mocha-700 mb-2">Store Location (GPS)</label>
                {formData.latitude && formData.longitude ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                        <MapPinned className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">Location captured</p>
                            <p className="text-xs text-green-600">
                                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                            </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-mocha-100 hover:bg-mocha-200 border border-mocha-200 rounded-xl text-mocha-700 font-medium transition-colors"
                    >
                        {gettingLocation ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Getting location...</>
                        ) : (
                            <><MapPin className="w-5 h-5" /> Get Current Location</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-mocha-900 mb-2">Verification Documents</h3>
            <p className="text-sm text-mocha-500">Upload your ID and selfie for account verification. This helps us ensure a safe marketplace.</p>

            {/* Valid ID Front */}
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Valid ID (Front) *</label>
                <label className="border-2 border-dashed border-mocha-300 rounded-xl p-4 flex items-center gap-4 hover:bg-mocha-50 transition-colors cursor-pointer">
                    {formData.validIdFront ? (
                        <img src={formData.validIdFront} alt="ID Front" className="w-20 h-14 rounded-lg object-cover" />
                    ) : (
                        <div className="w-20 h-14 rounded-lg bg-mocha-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-mocha-400" />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-mocha-700">{formData.validIdFront ? 'Change ID Front' : 'Upload ID Front'}</p>
                        <p className="text-xs text-mocha-400">Gov ID, Driver's License, etc.</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload('validIdFront')} className="hidden" />
                </label>
            </div>

            {/* Valid ID Back */}
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Valid ID (Back)</label>
                <label className="border-2 border-dashed border-mocha-300 rounded-xl p-4 flex items-center gap-4 hover:bg-mocha-50 transition-colors cursor-pointer">
                    {formData.validIdBack ? (
                        <img src={formData.validIdBack} alt="ID Back" className="w-20 h-14 rounded-lg object-cover" />
                    ) : (
                        <div className="w-20 h-14 rounded-lg bg-mocha-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-mocha-400" />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-mocha-700">{formData.validIdBack ? 'Change ID Back' : 'Upload ID Back'}</p>
                        <p className="text-xs text-mocha-400">Back of your ID (optional)</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload('validIdBack')} className="hidden" />
                </label>
            </div>

            {/* Selfie */}
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Selfie with ID *</label>
                <label className="border-2 border-dashed border-mocha-300 rounded-xl p-4 flex items-center gap-4 hover:bg-mocha-50 transition-colors cursor-pointer">
                    {formData.selfieImage ? (
                        <img src={formData.selfieImage} alt="Selfie" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-mocha-100 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-mocha-400" />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-mocha-700">{formData.selfieImage ? 'Change Selfie' : 'Upload Selfie'}</p>
                        <p className="text-xs text-mocha-400">Hold your ID next to your face</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload('selfieImage')} className="hidden" />
                </label>
            </div>

            {/* Business Permit (Optional) */}
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Business Permit (Optional)</label>
                <label className="border-2 border-dashed border-mocha-300 rounded-xl p-4 flex items-center gap-4 hover:bg-mocha-50 transition-colors cursor-pointer">
                    {formData.businessPermit ? (
                        <img src={formData.businessPermit} alt="Permit" className="w-20 h-14 rounded-lg object-cover" />
                    ) : (
                        <div className="w-20 h-14 rounded-lg bg-mocha-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-mocha-400" />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-mocha-700">{formData.businessPermit ? 'Change Permit' : 'Upload Permit'}</p>
                        <p className="text-xs text-mocha-400">DTI/SEC registration (if available)</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload('businessPermit')} className="hidden" />
                </label>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-mocha-900 mb-2">Select Your Plan</h3>

            {initialPlan ? (
                <div className="bg-mocha-50 border border-mocha-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-mocha-500">Selected Plan</p>
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
                            className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${formData.selectedPlan === p.name
                                ? 'border-mocha-600 bg-mocha-50'
                                : 'border-mocha-200 hover:border-mocha-300'
                                }`}
                        >
                            <p className="font-bold text-mocha-900">{p.name}</p>
                            <p className="text-sm text-mocha-500">₱{p.price}/mo</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-4 border-t border-mocha-100">
                <h4 className="text-sm font-medium text-mocha-900 mb-3">Payment Method</h4>
                <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-6 flex flex-col items-center text-center gap-3">
                    <p className="font-bold text-3xl tracking-tighter text-blue-600">xendit</p>
                    <p className="text-sm text-mocha-600 max-w-xs">
                        Securely pay via GCash, GrabPay, Maya, or Credit/Debit Card.
                    </p>
                    <span className="text-xs font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                        Free for Starter Plan
                    </span>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-mocha-50 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-medium text-mocha-900 mb-3">Application Summary</h4>
                <div className="flex justify-between text-sm">
                    <span className="text-mocha-500">Store Name</span>
                    <span className="font-medium text-mocha-900">{formData.storeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-mocha-500">Location</span>
                    <span className="font-medium text-mocha-900">{formData.city}, {formData.province}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-mocha-500">Documents</span>
                    <span className="font-medium text-mocha-900">
                        {[formData.validIdFront, formData.validIdBack, formData.selfieImage, formData.businessPermit].filter(Boolean).length} uploaded
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-mocha-500">Plan</span>
                    <span className="font-medium text-mocha-900">{formData.selectedPlan}</span>
                </div>
            </div>
        </div>
    );

    const totalSteps = 4;
    const canProceed = () => {
        switch (step) {
            case 1: return !!formData.storeName;
            case 2: return !!formData.street && !!formData.city && !!formData.province && !!formData.postalCode;
            case 3: return !!formData.validIdFront && !!formData.selfieImage;
            case 4: return !!formData.selectedPlan;
            default: return true;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-mocha-100 flex items-center justify-between bg-mocha-50">
                    <div>
                        <h2 className="text-xl font-bold text-mocha-900">Create a Store</h2>
                        <p className="text-xs text-mocha-500">Step {step} of {totalSteps}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-mocha-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-mocha-500" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-mocha-200 h-1">
                    <div
                        className="bg-mocha-600 h-1 transition-all duration-300"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-mocha-100 bg-mocha-50 flex items-center justify-between">
                    <button
                        onClick={step === 1 ? onClose : handleBack}
                        className="px-4 py-2 text-mocha-600 font-medium hover:text-mocha-900 transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    <button
                        onClick={step === totalSteps ? handleSubmit : handleNext}
                        disabled={!canProceed() || loading}
                        className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                        ) : step === totalSteps ? (
                            'Submit Application'
                        ) : (
                            <>Next <ChevronRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
