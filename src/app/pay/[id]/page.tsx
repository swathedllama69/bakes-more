"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";

export default function PaymentUploadPage() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error(error);
        } else {
            setOrder(data);
        }
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !order) return;

        setUploading(true);
        try {
            // 1. Upload file to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${order.id}-receipt.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('payment-proofs')
                .getPublicUrl(filePath);

            // 3. Update Order Record
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    receipt_url: publicUrl,
                    // Optional: You could allow updating status here, but usually admin verifies first
                    // status: 'Payment Review' 
                })
                .eq('id', order.id);

            if (updateError) throw updateError;

            setSuccess(true);

        } catch (error: any) {
            setErrorMessage(error.message || "Error uploading receipt");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
    if (!order) return <div className="min-h-screen flex items-center justify-center text-red-400">Order not found.</div>;

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-6 flex flex-col items-center justify-center">

            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E8ECE9] overflow-hidden">
                <div className="bg-[#B03050] p-6 text-center">
                    <h1 className="text-2xl font-serif text-white mb-2">Payment Proof</h1>
                    <p className="text-pink-100 text-sm">Upload your transfer receipt for Order #{order.id.slice(0, 8)}</p>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Successful!</h3>
                            <p className="text-slate-500 text-sm">Thank you. We have received your receipt and will confirm your order shortly.</p>
                        </div>
                    ) : (
                        <>
                            {errorMessage && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-red-600">{errorMessage}</p>
                                </div>
                            )}

                            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Total Amount</span>
                                    <span className="font-serif text-lg text-slate-800">₦{(order.total_price).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Amount Paid</span>
                                    <span className="font-serif text-lg text-green-600">₦{(order.amount_paid || 0).toLocaleString()}</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Balance Due</span>
                                        <span className="font-bold text-red-500">₦{(order.total_price - (order.amount_paid || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-[#B03050] hover:bg-pink-50'}`}>
                                    <input
                                        type="file"
                                        id="receipt"
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="receipt" className="cursor-pointer flex flex-col items-center">
                                        {file ? (
                                            <>
                                                <FileText className="w-10 h-10 text-green-600 mb-2" />
                                                <span className="text-sm font-bold text-green-700">{file.name}</span>
                                                <span className="text-xs text-green-500 mt-1">Click to change</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                                                <span className="text-sm font-bold text-slate-600">Click to upload Receipt</span>
                                                <span className="text-xs text-slate-400 mt-1">Images or PDF (Max 5MB)</span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                                        ${!file || uploading ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-[#B03050] hover:bg-[#902040] shadow-pink-200'}
                                    `}
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Submit Payment Proof
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
                &copy; All rights reserved.
            </p>
        </div>
    );
}
