"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PDFViewer } from "@react-pdf/renderer";

// Dynamically import PDF component to avoid SSR issues with @react-pdf/renderer
const InvoicePDF = dynamic(() => import("@/components/pdf/InvoicePDF"), {
    ssr: false,
    loading: () => <div className="text-slate-400">Loading PDF Generator...</div>,
});

export default function InvoicePage() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [accountDetails, setAccountDetails] = useState<string>("");
    const [allFillings, setAllFillings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            // 1. Fetch Order with Relations
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .select(`
                *,
                order_items (
                    *,
                    recipes (name),
                    desserts (name, description, price, selling_price)
                )
            `)
                .eq("id", id)
                .single();

            if (orderError) throw orderError;

            // 2. Fetch General Settings (Company Info, etc.)
            const { data: settingsData } = await supabase
                .from("settings")
                .select("*")
                .single();

            // 3. Fetch Account Details (Specifically from app_settings like in OrderDetails)
            const { data: accData } = await supabase
                .from("app_settings")
                .select("value")
                .eq("key", "account_details")
                .maybeSingle();

            // 4. Fetch Fillings (Crucial for PDF breakdown)
            const { data: fillingsData, error: fillingsError } = await supabase
                .from("fillings")
                .select("*");

            if (fillingsError) {
                console.error("Error fetching fillings:", fillingsError);
            }

            if (orderData) setOrder(orderData);
            if (settingsData) setSettings(settingsData);
            if (accData) setAccountDetails(accData.value);
            if (fillingsData) setAllFillings(fillingsData);

        } catch (error) {
            console.error("Error loading invoice data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading Invoice...</div>;
    if (!order) return <div className="min-h-screen flex items-center justify-center text-slate-400">Order not found</div>;

    // Inject account details into order object for the PDF
    // We prioritize the fetched `accountDetails` from `app_settings`
    const orderWithDetails = {
        ...order,
        account_details: accountDetails || order.account_details
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col h-screen">
            {/* Toolbar */}
            <div className="max-w-5xl mx-auto w-full mb-6 flex justify-between items-center">
                <Link href={`/orders/${id}`} className="flex items-center gap-2 text-slate-600 font-bold hover:text-[#B03050] transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Order
                </Link>
                <div className="text-sm text-slate-400 font-medium">
                    Invoice #{order.id.slice(0, 8).toUpperCase()}
                </div>
            </div>

            {/* PDF Viewer - Full Screen Experience */}
            <div className="flex-1 max-w-5xl mx-auto w-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
                <PDFViewer style={{ width: "100%", height: "100%", border: "none" }}>
                    <InvoicePDF
                        order={orderWithDetails}
                        settings={settings}
                        allFillings={allFillings}
                    />
                </PDFViewer>
            </div>
        </div>
    );
}