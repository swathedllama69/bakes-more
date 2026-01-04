"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft, ChefHat, Clock } from "lucide-react";
import Link from "next/link";

export default function BakingListPage() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        const { data, error } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (
                    *,
                    recipes (name, instructions, baking_duration_minutes),
                    fillings (name)
                )
            `)
            .eq("id", id)
            .single();

        if (!error) setOrder(data);
        setLoading(false);
    };

    if (loading) return <div className="p-10 text-center">Loading Baking List...</div>;
    if (!order) return <div className="p-10 text-center">Order not found</div>;

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-8 print:p-0 print:bg-white font-sans">
            {/* Toolbar - Hidden when printing */}
            <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Link href={`/orders/${id}`} className="flex items-center gap-2 text-slate-500 hover:text-[#B03050] transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Order
                </Link>
                <button
                    onClick={() => window.print()}
                    className="bg-[#B03050] text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-[#902040] shadow-lg shadow-pink-200 transition-all"
                >
                    <Printer className="w-4 h-4" /> Print List
                </button>
            </div>

            {/* Paper */}
            <div className="max-w-3xl mx-auto bg-white p-12 rounded-[2rem] shadow-sm border border-[#E8ECE9] print:shadow-none print:border-none print:w-full print:max-w-none">

                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b border-[#E8ECE9] pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <ChefHat className="w-8 h-8 text-[#B03050]" />
                            <h1 className="text-3xl font-serif text-[#B03050]">BAKING LIST</h1>
                        </div>
                        <p className="text-slate-400 font-medium">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <div className="mb-2">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Due Date</p>
                            <p className="text-xl font-serif text-slate-800">
                                {new Date(order.delivery_date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[#B03050] font-bold">
                                {new Date(order.delivery_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customer Note */}
                <div className="mb-8 bg-[#FDFBF7] p-6 rounded-2xl border border-[#E8ECE9]">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Customer</p>
                    <p className="font-serif text-slate-800 text-xl">{order.customer_name}</p>
                    {order.notes && (
                        <div className="mt-4 pt-4 border-t border-[#E8ECE9]">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Notes</p>
                            <p className="text-slate-600 whitespace-pre-wrap italic">{order.notes}</p>
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider border-b border-[#E8ECE9] pb-2">Items to Bake</h2>

                    {order.order_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-6 p-6 border border-[#E8ECE9] rounded-2xl break-inside-avoid bg-white">
                            <div className="w-16 h-16 bg-[#FDFBF7] rounded-xl flex items-center justify-center text-2xl font-serif text-[#B03050] border border-[#E8ECE9]">
                                {item.quantity}x
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-serif text-slate-800 mb-1">
                                    {item.recipes?.name || "Custom Cake"}
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="px-3 py-1 bg-[#FDFBF7] text-slate-600 text-xs font-bold rounded-full border border-[#E8ECE9]">
                                        Size: {item.size_inches}"
                                    </span>
                                    <span className="px-3 py-1 bg-[#FDFBF7] text-slate-600 text-xs font-bold rounded-full border border-[#E8ECE9]">
                                        Layers: {item.layers}
                                    </span>
                                    {item.fillings?.name && (
                                        <span className="px-3 py-1 bg-[#FDFBF7] text-slate-600 text-xs font-bold rounded-full border border-[#E8ECE9]">
                                            Filling: {item.fillings.name}
                                        </span>
                                    )}
                                </div>

                                {item.design_notes && (
                                    <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#E8ECE9] text-slate-600 text-sm mb-3">
                                        <span className="font-bold uppercase text-xs block mb-1 text-[#B03050] tracking-wider">Design Notes:</span>
                                        {item.design_notes}
                                    </div>
                                )}

                                {item.message_on_cake && (
                                    <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#E8ECE9] text-[#B03050] text-lg font-serif italic text-center">
                                        "{item.message_on_cake}"
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-[#E8ECE9] text-center text-slate-400 text-sm">
                    <p>Printed on {new Date().toLocaleString()}</p>
                </div>

            </div>
        </div>
    );
}
