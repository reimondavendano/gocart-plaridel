'use client';

import { useState, useEffect } from 'react';
import {
    Settings, Bell, Shield, Globe, Palette, Mail, Database,
    Save, Loader2, CheckCircle, ToggleLeft, ToggleRight
} from 'lucide-react';

interface SettingsData {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
    emailNotifications: boolean;
    sellerApprovalRequired: boolean;
    maxProductsPerStore: number;
    transactionFee: number;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SettingsData>({
        siteName: 'GoCart Plaridel',
        siteDescription: 'Premium Multi-Vendor E-Commerce Platform',
        contactEmail: 'support@gocart.ph',
        supportPhone: '+63 912 345 6789',
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        sellerApprovalRequired: true,
        maxProductsPerStore: 100,
        transactionFee: 5
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-mocha-600' : 'bg-mocha-300'
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Settings</h1>
                    <p className="text-mocha-500">Configure platform settings</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-mocha-600 hover:bg-mocha-700 text-white font-medium transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><CheckCircle className="w-5 h-5" /> Saved!</>
                    ) : (
                        <><Save className="w-5 h-5" /> Save Changes</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-mocha-100 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-mocha-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-mocha-900">General</h3>
                            <p className="text-sm text-mocha-500">Basic site information</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Site Name</label>
                            <input
                                type="text"
                                value={settings.siteName}
                                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Site Description</label>
                            <textarea
                                value={settings.siteDescription}
                                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400 resize-none"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Settings */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-mocha-900">Contact</h3>
                            <p className="text-sm text-mocha-500">Support contact details</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Contact Email</label>
                            <input
                                type="email"
                                value={settings.contactEmail}
                                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Support Phone</label>
                            <input
                                type="text"
                                value={settings.supportPhone}
                                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Platform Settings */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-mocha-900">Platform</h3>
                            <p className="text-sm text-mocha-500">Platform behavior settings</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-mocha-900">Maintenance Mode</p>
                                <p className="text-sm text-mocha-500">Disable site for maintenance</p>
                            </div>
                            <Toggle
                                enabled={settings.maintenanceMode}
                                onChange={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-mocha-900">Allow Registration</p>
                                <p className="text-sm text-mocha-500">Allow new user signups</p>
                            </div>
                            <Toggle
                                enabled={settings.allowRegistration}
                                onChange={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-mocha-900">Seller Approval Required</p>
                                <p className="text-sm text-mocha-500">Require admin approval for new stores</p>
                            </div>
                            <Toggle
                                enabled={settings.sellerApprovalRequired}
                                onChange={() => setSettings({ ...settings, sellerApprovalRequired: !settings.sellerApprovalRequired })}
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-mocha-900">Notifications</h3>
                            <p className="text-sm text-mocha-500">Email and alert settings</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-mocha-900">Email Notifications</p>
                                <p className="text-sm text-mocha-500">Send email alerts for orders</p>
                            </div>
                            <Toggle
                                enabled={settings.emailNotifications}
                                onChange={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Max Products per Store</label>
                            <input
                                type="number"
                                value={settings.maxProductsPerStore}
                                onChange={(e) => setSettings({ ...settings, maxProductsPerStore: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Transaction Fee (%)</label>
                            <input
                                type="number"
                                value={settings.transactionFee}
                                onChange={(e) => setSettings({ ...settings, transactionFee: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
