"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Save, Building2, Wallet, AlertTriangle, Loader2, Tags, Pencil, Check, X, Lock, Zap, Flame, Clock, User } from "lucide-react";
import Seeder from "@/components/Seeder";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        id: 1,
        company_name: "",
        company_address: "",
        company_phone: "",
        vat_rate: 7.5,
        currency_symbol: "₦",
        account_details: "",
        gas_rate_per_minute: 50,
        electricity_rate_per_minute: 30,
        hourly_labor_rate: 1500 // Default if not in DB
    });

    // Category Management State
    const [categories, setCategories] = useState<string[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Password Reset State
    const [passwordEmail, setPasswordEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);

    // App Settings (Key-Value Store)
    const [adminEmail, setAdminEmail] = useState("");

    useEffect(() => {
        fetchSettings();
        fetchCategories();
        fetchAppSettings();
    }, []);

    const fetchAppSettings = async () => {
        const { data } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'admin_email')
            .single();

        if (data) setAdminEmail(data.value);
    };

    const fetchCategories = async () => {
        const { data } = await supabase
            .from("ingredients")
            .select("category")
            .order("category");

        if (data) {
            const uniqueCats = Array.from(new Set(data.map(i => i.category))).filter(Boolean);
            setCategories(uniqueCats);
        }
        setLoadingCategories(false);
    };

    const handleChange = (field: string, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleRenameCategory = async (oldName: string) => {
        if (!newCategoryName || newCategoryName === oldName) {
            setEditingCategory(null);
            return;
        }

        if (!confirm(`Rename category "${oldName}" to "${newCategoryName}"? This will update all items in this category.`)) return;

        const { error } = await supabase
            .from("ingredients")
            .update({ category: newCategoryName })
            .eq("category", oldName);

        if (error) {
            alert("Error updating category: " + error.message);
        } else {
            fetchCategories(); // Refresh list
            setEditingCategory(null);
            setNewCategoryName("");
        }
    };

    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from("settings")
            .select("*")
            .single();

        if (!error && data) {
            setSettings(prev => ({ ...prev, ...data }));
        } else if (error && error.code === 'PGRST116') {
            // No rows found, insert default
            const { data: newData } = await supabase
                .from("settings")
                .insert([{ company_name: "My Bakery" }])
                .select()
                .single();
            if (newData) setSettings(prev => ({ ...prev, ...newData }));
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);

        // Save Standard Settings
        const { error } = await supabase
            .from("settings")
            .upsert(settings);

        // Save App Settings (Admin Email)
        if (adminEmail) {
            await supabase
                .from('app_settings')
                .upsert({ key: 'admin_email', value: adminEmail }, { onConflict: 'key' });
        }

        if (error) {
            alert("Error saving settings: " + error.message);
        } else {
            // Show success feedback (could be a toast, but alert is fine for now)
            alert("Settings saved successfully!");
        }
        setSaving(false);
    };

    const handlePasswordReset = async () => {
        if (!passwordEmail) return;
        const { error } = await supabase.auth.resetPasswordForEmail(passwordEmail, {
            redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) {
            alert("Error sending reset email: " + error.message);
        } else {
            setResetSent(true);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading Settings...</div>;

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 bg-[#FDFBF7]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-[#B03050] flex items-center gap-3">
                        <Building2 className="w-8 h-8" />
                        Settings
                    </h1>
                    <p className="text-slate-500 font-medium">Manage your bakery profile and preferences.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#B03050] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN */}
                <div className="space-y-8">
                    {/* Business Profile */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-400 mb-6 tracking-wider">
                            <Building2 className="w-4 h-4" /> Business Profile
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Company Name</label>
                                <input
                                    value={settings.company_name || ""}
                                    onChange={e => setSettings({ ...settings, company_name: e.target.value })}
                                    className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#B03050]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                                <textarea
                                    value={settings.company_address || ""}
                                    onChange={e => setSettings({ ...settings, company_address: e.target.value })}
                                    className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#B03050] min-h-[80px]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                <input
                                    value={settings.company_phone || ""}
                                    onChange={e => setSettings({ ...settings, company_phone: e.target.value })}
                                    className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#B03050]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Admin Email (For Notifications)</label>
                                <input
                                    value={adminEmail}
                                    onChange={e => setAdminEmail(e.target.value)}
                                    className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#B03050]"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-400 mb-6 tracking-wider">
                            <Lock className="w-4 h-4" /> Security
                        </h2>
                        <div className="space-y-4">
                            {!resetSent ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Reset Password</label>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={passwordEmail}
                                            onChange={e => setPasswordEmail(e.target.value)}
                                            className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#B03050]"
                                        />
                                    </div>
                                    <button
                                        onClick={handlePasswordReset}
                                        disabled={!passwordEmail}
                                        className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
                                    >
                                        Send Reset Link
                                    </button>
                                </>
                            ) : (
                                <div className="bg-green-50 p-4 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    Reset link sent! Check your email.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MIDDLE COLUMN */}
                <div className="space-y-8">
                    {/* Production Rates */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-400 mb-6 tracking-wider">
                            <Zap className="w-4 h-4" /> Production Rates
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-2">
                                    <Flame className="w-3 h-3 text-orange-500" /> Gas Rate (per minute)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                                    <input
                                        type="number"
                                        value={settings.gas_rate_per_minute}
                                        onChange={e => setSettings({ ...settings, gas_rate_per_minute: Number(e.target.value) })}
                                        className="w-full pl-8 p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-yellow-500" /> Electricity Rate (per minute)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                                    <input
                                        type="number"
                                        value={settings.electricity_rate_per_minute}
                                        onChange={e => setSettings({ ...settings, electricity_rate_per_minute: Number(e.target.value) })}
                                        className="w-full pl-8 p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-blue-500" /> Labor Rate (per hour)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                                    <input
                                        type="number"
                                        value={settings.hourly_labor_rate || 1500}
                                        onChange={e => setSettings({ ...settings, hourly_labor_rate: Number(e.target.value) })}
                                        className="w-full pl-8 p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-400 mb-6 tracking-wider">
                            <Wallet className="w-4 h-4" /> Financials
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">VAT Rate (%)</label>
                                <input
                                    type="number"
                                    value={settings.vat_rate}
                                    onChange={e => setSettings({ ...settings, vat_rate: Number(e.target.value) })}
                                    className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#B03050]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Account Details</label>
                                <textarea
                                    value={settings.account_details || ""}
                                    onChange={e => setSettings({ ...settings, account_details: e.target.value })}
                                    placeholder="Bank Name, Account Number, etc."
                                    className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#B03050] min-h-[80px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">
                    {/* Categories */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-400 mb-6 tracking-wider">
                            <Tags className="w-4 h-4" /> Ingredient Categories
                        </h2>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {categories.map(cat => (
                                <div key={cat} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] group">
                                    {editingCategory === cat ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <input
                                                autoFocus
                                                value={newCategoryName}
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                className="flex-1 p-1 bg-white border border-[#B03050] rounded text-sm font-bold outline-none"
                                            />
                                            <button onClick={() => handleRenameCategory(cat)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check className="w-4 h-4" /></button>
                                            <button onClick={() => setEditingCategory(null)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-bold text-slate-700 text-sm">{cat}</span>
                                            <button
                                                onClick={() => { setEditingCategory(cat); setNewCategoryName(cat); }}
                                                className="text-slate-400 hover:text-[#B03050] opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Database Seeder */}
                    <Seeder />
                </div>

            </div>
        </div>
    );
}
