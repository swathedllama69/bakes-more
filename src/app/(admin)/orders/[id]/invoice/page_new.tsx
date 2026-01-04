"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function InvoicePage() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        const { data: orderData } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (
                    *,
                    recipes (name),
                    fillings (name)
                )
            `)
            .eq("id", id)
            .single();

        const { data: settingsData } = await supabase
            .from("settings")
            .select("*")
            .single();

        if (orderData) setOrder(orderData);
        if (settingsData) setSettings(settingsData);
        setLoading(false);
    };

    if (loading) return <div className="p-10 text-center">Loading Invoice...</div>;
    if (!order) return <div className="p-10 text-center">Order not found</div>;

    let subTotal = order.total_price + (order.discount || 0) - (order.tip || 0);
    if (order.vat_type === 'exclusive') {
        subTotal -= (order.vat || 0);
    }

    const balance = Math.max(0, (order.total_price || 0) - (order.amount_paid || 0));
    const isPaid = balance === 0;

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
                    <Printer className="w-4 h-4" /> Print Invoice
                </button>
            </div>

            {/* Invoice Paper */}
            <div className="max-w-3xl mx-auto bg-white p-12 rounded-[2rem] shadow-sm border border-[#E8ECE9] print:shadow-none print:border-none print:w-full print:max-w-none relative overflow-hidden">

                {/* Background Design */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FDFBF7] rounded-bl-[100%] -z-0 opacity-50 print:opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E8ECE9] rounded-tr-[100%] -z-0 opacity-50 print:opacity-20"></div>

                {/* Header */}
                <div className="flex justify-between items-start mb-12 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[#B03050] rounded-full flex items-center justify-center text-white font-serif text-xl shadow-lg shadow-pink-200">
                                BH
                            </div>
                            <div>
                                <h1 className="text-2xl font-serif text-[#B03050] tracking-tight">By Hafsaa</h1>
                                <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">Premium Bakery</p>
                            </div>
                        </div>
                        <div className="text-sm text-slate-500 space-y-1 font-medium">
                            <p>{settings?.company_address}</p>
                            <p>{settings?.company_phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-serif text-slate-200 tracking-tight mb-2">INVOICE</h1>
                        <p className="text-slate-400 font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Client & Date Info */}
                <div className="flex justify-between mb-12 relative z-10">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Bill To</p>
                        <h3 className="text-xl font-serif text-slate-800">{order.customer_name}</h3>
                        <p className="text-slate-600">{order.customer_phone}</p>
                        {order.notes && order.notes.includes("Address:") && (
                            <p className="text-slate-600 max-w-xs mt-1 italic">
                                {order.notes.split("Address:")[1].trim()}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="mb-4">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Invoice Date</p>
                            <p className="font-serif text-slate-800">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Due Date</p>
                            <p className="font-serif text-slate-800">
                                {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'On Receipt'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-12">
                    <thead>
                        <tr className="border-b border-[#E8ECE9]">
                            <th className="text-left py-3 text-xs font-bold uppercase text-[#B03050] tracking-wider">Item Description</th>
                            <th className="text-center py-3 text-xs font-bold uppercase text-[#B03050] tracking-wider">Qty</th>
                            <th className="text-right py-3 text-xs font-bold uppercase text-[#B03050] tracking-wider">Price</th>
                            <th className="text-right py-3 text-xs font-bold uppercase text-[#B03050] tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {order.order_items.map((item: any, i: number) => (
                            <tr key={i} className="border-b border-[#E8ECE9]">
                                <td className="py-4">
                                    <p className="font-serif text-slate-800 text-lg">
                                        {item.recipes?.name || 'Custom Cake'}
                                        <span className="font-sans text-sm text-slate-500 ml-2">({item.size_inches}", {item.layers} layers)</span>
                                    </p>
                                    {item.fillings?.name && <p className="text-xs text-slate-500 mt-1">Filling: {item.fillings.name}</p>}
                                    {/* Extras Display */}
                                    {item.custom_extras && Array.isArray(item.custom_extras) && item.custom_extras.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {item.custom_extras.map((ex: any, idx: number) => (
                                                <p key={idx} className="text-xs text-slate-500 bg-[#FDFBF7] inline-block px-2 py-1 rounded border border-[#E8ECE9] mr-2">
                                                    + {ex.name} (₦{ex.price.toLocaleString()})
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 text-center font-medium">{item.quantity}</td>
                                <td className="py-4 text-right font-medium">₦{item.item_price.toLocaleString()}</td>
                                <td className="py-4 text-right font-bold">₦{(item.item_price * item.quantity).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Financial Summary */}
                <div className="flex justify-end mb-12">
                    <div className="w-72 space-y-3">
                        <div className="flex justify-between text-slate-500 text-sm">
                            <span>Subtotal</span>
                            <span>₦{subTotal.toLocaleString()}</span>
                        </div>

                        {order.discount > 0 && (
                            <div className="flex justify-between text-green-600 text-sm">
                                <span>Discount</span>
                                <span>-₦{order.discount.toLocaleString()}</span>
                            </div>
                        )}

                        {order.vat > 0 && (
                            <div className="flex justify-between text-slate-500 text-sm">
                                <span>VAT ({order.vat_type})</span>
                                <span>{order.vat_type === 'exclusive' ? '+' : ''}₦{order.vat.toLocaleString()}</span>
                            </div>
                        )}

                        {order.tip > 0 && (
                            <div className="flex justify-between text-slate-500 text-sm">
                                <span>Tip</span>
                                <span>+₦{order.tip.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-2xl font-serif text-[#B03050] pt-4 border-t border-[#E8ECE9]">
                            <span>Total</span>
                            <span>₦{order.total_price.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between text-slate-500 pt-2 text-sm">
                            <span>Amount Paid</span>
                            <span>₦{order.amount_paid.toLocaleString()}</span>
                        </div>

                        <div className={`flex justify-between font-bold pt-2 border-t border-[#E8ECE9] ${(order.total_price - order.amount_paid) > 0 ? 'text-[#B03050]' : 'text-green-600'
                            }`}>
                            <span>Balance Due</span>
                            <span>₦{Math.max(0, order.total_price - order.amount_paid).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[#E8ECE9] pt-8 text-center relative z-10">
                    {isPaid ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-green-600 font-bold text-xl uppercase tracking-widest border-2 border-green-600 px-6 py-3 rounded-xl transform -rotate-2">
                                <CheckCircle className="w-6 h-6" /> PAID IN FULL
                            </div>
                            <p className="text-slate-800 font-serif italic mt-4">Thank you for your business!</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-800 font-serif italic mb-6">Thank you for your business!</p>
                            <div className="bg-[#FDFBF7] p-6 rounded-2xl inline-block text-left border border-[#E8ECE9]">
                                <p className="text-xs font-bold uppercase text-slate-400 mb-3 text-center tracking-wider">Payment Details</p>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap font-mono">
                                    {settings?.account_details || "Please contact us for payment details."}
                                </p>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
