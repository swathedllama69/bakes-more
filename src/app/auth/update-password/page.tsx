"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Success! Redirect to dashboard
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-[#E8ECE9] overflow-hidden">
                <div className="p-8 text-center border-b border-[#E8ECE9] bg-gradient-to-b from-white to-pink-50/30">
                    <div className="w-20 h-20 mx-auto mb-4 relative drop-shadow-xl">
                        <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
                    </div>
                    <h1 className="text-2xl font-serif text-[#B03050] font-bold">Set New Password</h1>
                    <p className="text-slate-400 text-sm mt-1">Enter your new password below</p>
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E8ECE9] focus:outline-none focus:border-[#B03050] focus:ring-1 focus:ring-[#B03050] transition-all text-slate-700 font-medium"
                                placeholder="••••••••"
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
                                Updating...
                            </>
                        ) : (
                            "Update Password"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
