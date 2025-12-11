'use client';

import { useState } from 'react';
import {
    Bell, Lock, CreditCard, Shield, Save, Loader2, CheckCircle
} from 'lucide-react';

export default function SellerSettingsPage() {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1000);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Settings</h1>
                    <p className="text-mocha-500">Manage your account preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-mocha-600 hover:bg-mocha-700 text-white font-medium transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saved ? 'Saved' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notifications */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-mocha-900">Notifications</h3>
                    </div>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-mocha-50 transition-colors cursor-pointer">
                            <span className="text-mocha-700 font-medium">New Order Alerts</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-mocha-600 focus:ring-mocha-500 border-gray-300" />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-mocha-50 transition-colors cursor-pointer">
                            <span className="text-mocha-700 font-medium">Low Stock Warnings</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-mocha-600 focus:ring-mocha-500 border-gray-300" />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-mocha-50 transition-colors cursor-pointer">
                            <span className="text-mocha-700 font-medium">Marketing Updates</span>
                            <input type="checkbox" className="w-5 h-5 rounded text-mocha-600 focus:ring-mocha-500 border-gray-300" />
                        </label>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-mocha-900">Security</h3>
                    </div>
                    <div className="space-y-4">
                        <button className="w-full text-left p-3 rounded-xl border border-mocha-200 hover:bg-mocha-50 transition-colors text-mocha-700 font-medium">
                            Change Password
                        </button>
                        <button className="w-full text-left p-3 rounded-xl border border-mocha-200 hover:bg-mocha-50 transition-colors text-mocha-700 font-medium">
                            Enable Two-Factor Authentication
                        </button>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-mocha-900">Payout Settings</h3>
                    </div>
                    <p className="text-sm text-mocha-500">Configure how you receive your earnings.</p>
                    <button className="w-full py-2.5 rounded-xl bg-mocha-100 text-mocha-700 font-medium hover:bg-mocha-200 transition-colors">
                        Manage Payout Methods
                    </button>
                </div>
            </div>
        </div>
    );
}
