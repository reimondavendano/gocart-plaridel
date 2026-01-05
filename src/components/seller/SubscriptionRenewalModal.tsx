'use client';

import { useState, useRef } from 'react';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import { uploadVerificationDoc } from '@/lib/storage';
import { X, Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface SubscriptionRenewalModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: string | null;
    planPrice: number;
}

export default function SubscriptionRenewalModal({ isOpen, onClose, planName, planPrice }: SubscriptionRenewalModalProps) {
    const { currentUser } = useAppSelector((state) => state.user);
    const [loading, setLoading] = useState(false);
    const [paymentProof, setPaymentProof] = useState<string>('');
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentProofFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPaymentProof(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!currentUser || !planName || !paymentProofFile) return;

        setLoading(true);
        try {
            // 1. Get Store ID
            const { data: storeData } = await supabase
                .from('stores')
                .select('id, slug')
                .eq('seller_id', currentUser.id)
                .single();

            if (!storeData) throw new Error("Store not found");

            // 2. Get Plan ID
            const { data: planData } = await supabase
                .from('plans')
                .select('id')
                .eq('name', planName)
                .single();

            if (!planData) throw new Error("Plan not found");

            // 3. Upload Proof
            const proofUrl = await uploadVerificationDoc(paymentProofFile, storeData.slug, 'payment_proof');

            // 4. Create Request
            const { error } = await supabase
                .from('subscription_requests')
                .insert({
                    store_id: storeData.id,
                    plan_id: planData.id,
                    payment_proof: proofUrl,
                    status: 'pending'
                });

            if (error) throw error;

            setSuccess(true);
        } catch (error) {
            console.error(error);
            alert('Failed to submit renewal request.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center animate-scale-up">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
                    <p className="text-gray-600 mb-6">
                        Your subscription renewal request for <strong>{planName}</strong> has been submitted.
                        Our team will verify your payment and reactivate your store shortly.
                    </p>
                    <button onClick={onClose} className="btn-primary w-full">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Renew Subscription</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-mocha-50 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-mocha-600">Selected Plan</span>
                            <span className="font-bold text-mocha-900">{planName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-mocha-600">Amount to Pay</span>
                            <span className="text-xl font-bold text-mocha-900">₱{planPrice.toLocaleString()}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Payment Proof</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-mocha-300 transition-colors cursor-pointer"
                        >
                            {paymentProof ? (
                                <img src={paymentProof} alt="Proof" className="max-h-48 rounded-lg object-contain" />
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-sm">Click to upload receipt/screenshot</p>
                                    <p className="text-xs text-gray-400 mt-1">GCash / Bank Transfer Proof</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700">
                            Please ensure the upload is clear. After verification, your store will be reactivated immediately.
                        </p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !paymentProofFile}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Renewal Request'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
