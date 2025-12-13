'use client';

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setUser } from '@/store/slices/userSlice';
import { supabase } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/storage';
import { checkImageContent } from '@/lib/moderation';
import {
    User, Mail, Phone, Camera, Save, Loader2, Shield, Crown
} from 'lucide-react';

export default function SellerProfilePage() {
    const dispatch = useAppDispatch();
    const { currentUser } = useAppSelector((state) => state.user);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [avatar, setAvatar] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || '');
            setEmail(currentUser.email || '');
            setPhone(currentUser.phone || '');
            setAvatar(currentUser.avatar || '');
        }
    }, [currentUser]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check Content
            const moderationError = await checkImageContent(file);
            if (moderationError) {
                alert(moderationError);
                return;
            }

            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.id) return;

        setLoading(true);
        setSuccess(false);

        try {
            let avatarUrl = avatar;

            // Upload Avatar if new file selected
            if (avatarFile) {
                const { url } = await uploadToStorage(avatarFile, {
                    folder: 'avatar',
                    fileName: `avatar_${currentUser.id}_${Date.now()}.png`
                });

                if (url) {
                    avatarUrl = url;
                } else {
                    throw new Error('Failed to upload avatar image');
                }
            }

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    name,
                    phone,
                    avatar: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', currentUser.id);

            if (error) throw error;

            // Update Redux state
            dispatch(setUser({
                ...currentUser,
                name,
                phone,
                avatar: avatarUrl
            }));

            setAvatarFile(null); // Clear file selection

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isPlus = currentUser?.plan?.name === 'Growth' || currentUser?.plan?.name === 'Pro' || currentUser?.plan?.name === 'Enterprise';

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-mocha-900">Profile Settings</h1>
                <p className="text-mocha-500">Manage your account information</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Section */}
                <div className="bg-white rounded-2xl border border-mocha-100 p-6">
                    <h2 className="text-lg font-semibold text-mocha-900 mb-4">Profile Photo</h2>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-mocha-100">
                                {avatar ? (
                                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-10 h-10 text-mocha-400" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-mocha-500 text-white cursor-pointer hover:bg-mocha-600 transition-colors">
                                <Camera className="w-4 h-4" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div>
                            <p className="font-medium text-mocha-900">{name || 'Your Name'}</p>
                            <p className="text-sm text-mocha-500">{email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 rounded-lg bg-mocha-100 text-mocha-600 text-xs font-medium capitalize">
                                    {currentUser?.role || 'Seller'}
                                </span>
                                {isPlus && (
                                    <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-mocha-500 to-dusk-500 text-white text-xs font-medium flex items-center gap-1">
                                        <Crown className="w-3 h-3" />
                                        {currentUser?.plan?.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Info */}
                <div className="bg-white rounded-2xl border border-mocha-100 p-6">
                    <h2 className="text-lg font-semibold text-mocha-900 mb-4">Personal Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full pl-12 pr-4 py-3 bg-mocha-100 border border-mocha-200 rounded-xl text-mocha-500 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-mocha-400 mt-1">Email cannot be changed</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1.5">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                    placeholder="+63 9XX XXX XXXX"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Info */}
                <div className="bg-white rounded-2xl border border-mocha-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-mocha-900">Subscription Plan</h2>
                        <a href="/subscription" className="text-mocha-500 hover:text-mocha-700 text-sm font-medium">
                            Upgrade Plan
                        </a>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-mocha-50 to-dusk-50 border border-mocha-200">
                        <div className="w-12 h-12 rounded-xl bg-mocha-500 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-mocha-900">{currentUser?.plan?.name || 'Free'} Plan</p>
                            <p className="text-sm text-mocha-500">
                                {currentUser?.plan?.maxProducts || 1} products • {currentUser?.plan?.transactionFee || 3}% transaction fee
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between">
                    {success && (
                        <p className="text-green-600 text-sm font-medium">Profile updated successfully!</p>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="ml-auto px-6 py-3 rounded-xl bg-mocha-500 hover:bg-mocha-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
