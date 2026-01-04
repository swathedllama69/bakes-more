"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft, CheckCircle, Wheat, Egg, Milk, Croissant, Cookie } from "lucide-react";
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
        <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">
            {/* Toolbar - Hidden when printing */}
            <div className="max-w-3xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <Link href={`/orders/${id}`} className="flex items-center gap-2 bg-white text-slate-600 px-6 py-3 rounded-full font-bold shadow-md border border-slate-200 hover:bg-[#B03050] hover:text-white hover:border-[#B03050] transition-all group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Order
                </Link>
                <button
                    onClick={() => window.print()}
                    className="bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-2 font-bold hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all"
                >
                    <Printer className="w-5 h-5" /> Print Invoice
                </button>
            </div>

            {/* Invoice Paper */}
            <div className="max-w-3xl mx-auto bg-white p-12 rounded-xl shadow-sm print:shadow-none print:w-full print:max-w-none relative overflow-hidden">

                {/* Background Design */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#B03050] rounded-bl-[100%] -z-0 opacity-5 print:opacity-5"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-100 rounded-tr-[100%] -z-0 opacity-20 print:opacity-20"></div>

                {/* Baking Ingredients Background Pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 print:opacity-10">
                    <Wheat className="absolute top-64 left-10 w-24 h-24 text-slate-900 transform -rotate-12" />
                    <Egg className="absolute top-40 right-20 w-16 h-16 text-slate-900 transform rotate-12" />
                    <Milk className="absolute bottom-20 left-20 w-20 h-20 text-slate-900 transform -rotate-6" />
                    <Croissant className="absolute bottom-40 right-10 w-24 h-24 text-slate-900 transform rotate-45" />
                    <Cookie className="absolute top-1/2 left-1/2 w-32 h-32 text-slate-900 transform -translate-x-1/2 -translate-y-1/2 opacity-50" />
                </div>

                {/* Header */}
                <div className="flex justify-between items-start mb-12 relative z-10">
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            {/* Logo */}
                            <div className="w-32 h-32 relative">
                                <img src="/logo.png" alt="Bakes & More" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-[#B03050] tracking-tight">Bakes & More</h1>
                                <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">By Hafsaa</p>
                            </div>
                        </div>
                        <div className="text-sm text-slate-500 space-y-1 font-medium">
                            <p>{settings?.company_address}</p>
                            <p>{settings?.company_phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-5xl font-serif text-slate-100 tracking-tight mb-2">INVOICE</h1>
                        <p className="text-slate-400 font-bold tracking-wider">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Client & Date Info */}
                <div className="flex justify-between mb-12 relative z-10">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400 mb-1">Bill To</p>
                        <h3 className="text-xl font-bold text-slate-900">{order.customer_name}</h3>
                        <p className="text-slate-600">{order.customer_phone}</p>
                        {order.notes && order.notes.includes("Address:") && (
                            <p className="text-slate-600 max-w-xs mt-1">
                                {order.notes.split("Address:")[1].trim()}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="mb-4">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Invoice Date</p>
                            <p className="font-bold text-slate-900">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Due Date</p>
                            <p className="font-bold text-slate-900">
                                {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'On Receipt'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-12">
                    <thead>
                        <tr className="border-b-2 border-slate-100">
                            <th className="text-left py-3 text-xs font-bold uppercase text-slate-400">Item Description</th>
                            <th className="text-center py-3 text-xs font-bold uppercase text-slate-400">Qty</th>
                            <th className="text-right py-3 text-xs font-bold uppercase text-slate-400">Price</th>
                            <th className="text-right py-3 text-xs font-bold uppercase text-slate-400">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {order.order_items.map((item: any, i: number) => (
                            <tr key={i} className="border-b border-slate-50">
                                <td className="py-4">
                                    <p className="font-bold text-slate-900">
                                        {item.recipes?.name || 'Custom Cake'}
                                        <span className="font-normal text-slate-500"> ({item.size_inches}", {item.layers} layers)</span>
                                    </p>
                                    {item.fillings?.name && <p className="text-xs text-slate-500">Filling: {item.fillings.name}</p>}
                                    {/* Extras Display */}
                                    {item.custom_extras && Array.isArray(item.custom_extras) && item.custom_extras.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                            {item.custom_extras.map((ex: any, idx: number) => (
                                                <p key={idx} className="text-xs text-slate-500">+ {ex.name} (₦{ex.price.toLocaleString()})</p>
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
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>₦{subTotal.toLocaleString()}</span>
                        </div>

                        {order.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-₦{order.discount.toLocaleString()}</span>
                            </div>
                        )}

                        {order.vat > 0 && (
                            <div className="flex justify-between text-slate-500">
                                <span>VAT ({order.vat_type})</span>
                                <span>{order.vat_type === 'exclusive' ? '+' : ''}₦{order.vat.toLocaleString()}</span>
                            </div>
                        )}

                        {order.tip > 0 && (
                            <div className="flex justify-between text-slate-500">
                                <span>Tip</span>
                                <span>+₦{order.tip.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-xl font-black text-slate-900 pt-4 border-t-2 border-slate-100">
                            <span>Total</span>
                            <span>₦{order.total_price.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between text-slate-500 pt-2">
                            <span>Amount Paid</span>
                            <span>₦{order.amount_paid.toLocaleString()}</span>
                        </div>

                        <div className={`flex justify-between font-bold pt-2 border-t border-slate-100 ${(order.total_price - order.amount_paid) > 0 ? 'text-[#B03050]' : 'text-green-600'
                            }`}>
                            <span>Balance Due</span>
                            <span>₦{Math.max(0, order.total_price - order.amount_paid).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 pt-8 text-center relative z-10">
                    {isPaid ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-[#B03050] font-black text-2xl uppercase tracking-widest border-4 border-[#B03050] px-8 py-3 rounded-xl transform -rotate-6 opacity-80">
                                <CheckCircle className="w-8 h-8" /> PAID
                            </div>
                            <p className="text-slate-600 font-serif italic mt-6">Thank you for choosing Bakes & More!</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-900 font-bold mb-4">Thank you for your business!</p>
                            <div className="bg-slate-50 p-4 rounded-xl inline-block text-left border border-slate-100">
                                <p className="text-xs font-bold uppercase text-slate-400 mb-2 text-center">Payment Details</p>
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
