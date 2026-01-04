"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-[#E8ECE9] overflow-hidden">
                <div className="p-8 text-center border-b border-[#E8ECE9] bg-gradient-to-b from-white to-pink-50/30">
                    <div className="w-20 h-20 mx-auto mb-4 relative drop-shadow-xl">
                        <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
                    </div>
                    <h1 className="text-2xl font-serif text-[#B03050] font-bold">Reset Password</h1>
                    <p className="text-slate-400 text-sm mt-1">Enter your email to receive a reset link</p>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Check your email</h3>
                            <p className="text-slate-500 text-sm">
                                We've sent a password reset link to <strong>{email}</strong>.
                            </p>
                            <Link href="/login" className="inline-block text-[#B03050] font-bold text-sm hover:underline mt-4">
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E8ECE9] focus:outline-none focus:border-[#B03050] focus:ring-1 focus:ring-[#B03050] transition-all text-slate-700 font-medium"
                                        placeholder="bakery@example.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#B03050] text-white py-4 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </button>

                            <div className="text-center">
                                <Link href="/login" className="text-slate-400 text-sm font-bold hover:text-[#B03050] flex items-center justify-center gap-2 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
