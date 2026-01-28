'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import { useAppSelector, useAppDispatch } from '@/store';
import { setUser } from '@/store/slices/userSlice';
import { addToast } from '@/store/slices/uiSlice';
import { supabase } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/storage';
import { checkImageContent } from '@/lib/moderation';
import {
    User as UserIcon, Mail, Phone, Camera, Save, Loader2,
    ArrowLeft, Lock
} from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { currentUser, isAuthenticated } = useAppSelector((state) => state.user);

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Password change
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || '');
            setPhone(currentUser.phone || '');
            setAvatarPreview(currentUser.avatar || null);
        }
    }, [currentUser]);

    const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const moderationError = await checkImageContent(file);
        if (moderationError) {
            dispatch(addToast({
                type: 'error',
                title: 'Invalid Image',
                message: moderationError
            }));
            return;
        }

        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (!name.trim()) {
            dispatch(addToast({
                type: 'error',
                title: 'Validation Error',
                message: 'Name is required'
            }));
            return;
        }

        setLoading(true);

        try {
            let avatarUrl = currentUser.avatar;

            if (avatarFile) {
                const { url, error } = await uploadToStorage(avatarFile, {
                    folder: 'avatar',
                    storeSlug: currentUser.id,
                    fileName: `avatar_${Date.now()}.png`
                });

                if (error) throw new Error('Failed to upload avatar');
                if (url) avatarUrl = url;
            }

            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({
                    name: name.trim(),
                    phone: phone.trim() || null,
                    avatar: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', currentUser.id);

            if (profileError) throw profileError;

            dispatch(setUser({
                ...currentUser,
                name: name.trim(),
                phone: phone.trim() || undefined,
                avatar: avatarUrl
            }));

            dispatch(addToast({
                type: 'success',
                title: 'Profile Updated',
                message: 'Your profile has been updated successfully'
            }));

            router.push('/profile');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            dispatch(addToast({
                type: 'error',
                title: 'Update Failed',
                message: error.message || 'Failed to update profile'
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            dispatch(addToast({
                type: 'error',
                title: 'Validation Error',
                message: 'Please fill in all password fields'
            }));
            return;
        }

        if (newPassword !== confirmPassword) {
            dispatch(addToast({
                type: 'error',
                title: 'Validation Error',
                message: 'Passwords do not match'
            }));
            return;
        }

        if (newPassword.length < 6) {
            dispatch(addToast({
                type: 'error',
                title: 'Validation Error',
                message: 'Password must be at least 6 characters'
            }));
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            dispatch(addToast({
                type: 'success',
                title: 'Password Changed',
                message: 'Your password has been updated successfully'
            }));

            setShowPasswordSection(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error changing password:', error);
            dispatch(addToast({
                type: 'error',
                title: 'Password Change Failed',
                message: error.message || 'Failed to change password'
            }));
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated || !currentUser) {
        return (
            <>
                <Header />
                <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
                        <p className="text-gray-500 mb-4">You need to be logged in to edit your profile.</p>
                        <Link href="/" className="text-mocha-600 hover:underline">
                            Return Home
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                <div className="container-custom max-w-2xl">
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 text-mocha-600 hover:text-mocha-800 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Link>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <img
                                        src={avatarPreview || currentUser.avatar}
                                        alt={name}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-mocha-100"
                                    />
                                    <label
                                        htmlFor="avatar-upload"
                                        className="absolute bottom-0 right-0 p-2 bg-mocha-600 hover:bg-mocha-700 rounded-full cursor-pointer transition-colors"
                                    >
                                        <Camera className="w-4 h-4 text-white" />
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarSelect}
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-sm text-gray-500">Click camera icon to change avatar</p>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha-500"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            </div>

                            {/* Email (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={currentUser.email}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha-500"
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
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
                        </form>

                        {/* Password Section */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <button
                                onClick={() => setShowPasswordSection(!showPasswordSection)}
                                className="flex items-center gap-2 text-mocha-600 hover:text-mocha-800 font-medium"
                            >
                                <Lock className="w-5 h-5" />
                                Change Password
                            </button>

                            {showPasswordSection && (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha-500"
                                            placeholder="Enter new password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha-500"
                                            placeholder="Confirm new password"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleChangePassword}
                                        disabled={loading}
                                        className="w-full btn-accent py-3 disabled:opacity-50"
                                    >
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            )}
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
