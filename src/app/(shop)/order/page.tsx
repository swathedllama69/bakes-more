"use client";

import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stage, Environment } from "@react-three/drei";
import { supabase } from "@/lib/supabase";
import { Loader2, ShoppingBag, ChevronRight, Check, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import CakeModel from "@/components/cake-builder/CakeModel";
import { NewOrderAdminTemplate, NewOrderCustomerTemplate, CustomOrderAdminTemplate } from "@/lib/email-templates";
import { getAdminEmail } from "@/lib/settings";

export default function OrderPage() {
    // Data State
    const [flavors, setFlavors] = useState<any[]>([]);
    const [fillings, setFillings] = useState<any[]>([]);
    const [toppers, setToppers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection State
    const [step, setStep] = useState(1); // 1: Size/Layers, 2: Flavors/Fillings, 3: Toppers, 4: Review
    const [shape, setShape] = useState<'round' | 'square' | 'heart'>('round');
    const [size, setSize] = useState(8);
    const [layers, setLayers] = useState(2);

    // Layer Configuration
    const [layerFlavors, setLayerFlavors] = useState<{ [key: number]: string }>({}); // layerIndex -> flavorId
    const [layerFillings, setLayerFillings] = useState<{ [key: number]: string }>({}); // layerIndex -> fillingId

    const [selectedToppers, setSelectedToppers] = useState<string[]>([]);

    // Custom Order State
    const [isCustomOrder, setIsCustomOrder] = useState(false);
    const [customOrder, setCustomOrder] = useState({
        name: "",
        phone: "",
        description: "",
        date: "",
        budget: ""
    });

    // Customer Details State
    const [customerDetails, setCustomerDetails] = useState({
        name: "",
        email: "",
        phone: "",
        notes: ""
    });
    const [orderSubmitted, setOrderSubmitted] = useState(false);

    // Pricing
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        calculatePrice();
    }, [size, layers, layerFlavors, layerFillings, selectedToppers, flavors, fillings, toppers]);

    const fetchOptions = async () => {
        setLoading(true);
        const { data: r } = await supabase.from('recipes').select('*').eq('category', 'Cake');
        const { data: f } = await supabase.from('fillings').select('*');
        const { data: t } = await supabase.from('ingredients').select('*').eq('category', 'Topper');

        if (r) setFlavors(r);
        if (f) setFillings(f);
        if (t) setToppers(t);

        // Default selections
        if (r && r.length > 0) {
            const defaultFlavor = r[0].id;
            setLayerFlavors({ 0: defaultFlavor, 1: defaultFlavor });
        }
        setLoading(false);
    };

    const calculatePrice = () => {
        let price = 0;

        // Base Price (Size & Layers)
        // Simplified logic: Base 6" 1 layer = 5000. Scale by volume.
        const baseVolume = Math.PI * 3 * 3 * 2; // 6" round, 2" high
        const currentRadius = size / 2;
        const currentVolume = ((shape === 'round' || shape === 'heart') ? Math.PI * currentRadius * currentRadius : size * size) * (layers * 2);

        const volumeRatio = currentVolume / baseVolume;
        const baseRate = 5000; // Base rate for standard cake batter

        price += baseRate * volumeRatio;

        // Add Flavor Costs (Premium flavors might cost more, but assuming base price covers standard)
        // If we had specific prices per flavor, we'd add them here.

        // Add Fillings
        Object.values(layerFillings).forEach(fillingId => {
            const filling = fillings.find(f => f.id === fillingId);
            if (filling) price += (filling.price || 1000);
        });

        // Add Toppers
        selectedToppers.forEach(topperId => {
            const topper = toppers.find(t => t.id === topperId);
            // Assuming toppers have a purchase_price or we define a selling price. 
            // Using purchase_price * 2 for now as a placeholder if selling_price doesn't exist
            if (topper) price += (topper.purchase_price || 500) * 2;
        });

        setTotalPrice(Math.round(price / 100) * 100);
    };

    const handleLayerFlavorChange = (layerIndex: number, flavorId: string) => {
        setLayerFlavors(prev => ({ ...prev, [layerIndex]: flavorId }));
    };

    const handleLayerFillingChange = (layerIndex: number, fillingId: string) => {
        setLayerFillings(prev => ({ ...prev, [layerIndex]: fillingId }));
    };

    const handleCustomOrderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const adminEmail = await getAdminEmail();

        // Send email to admin
        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: adminEmail,
                    subject: `New Custom Order Request from ${customOrder.name}`,
                    html: CustomOrderAdminTemplate(customOrder)
                })
            });
        } catch (error) {
            console.error("Error sending email:", error);
        }

        alert("Custom order request sent! We will contact you shortly.");
        setIsCustomOrder(false);
        setCustomOrder({ name: "", phone: "", description: "", date: "", budget: "" });
    };

    if (isCustomOrder) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-12 font-sans text-slate-800">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={() => setIsCustomOrder(false)}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-[#B03050] mb-8 font-bold text-sm uppercase tracking-wider"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Standard Order
                    </button>

                    <h1 className="text-4xl font-serif text-[#B03050] mb-2">Custom Order Request</h1>
                    <p className="text-slate-500 mb-8">Tell us exactly what you need, and we'll make it happen.</p>

                    <form onSubmit={handleCustomOrderSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                            <input
                                required
                                type="text"
                                value={customOrder.name}
                                onChange={e => setCustomOrder({ ...customOrder, name: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#B03050]"
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                            <input
                                required
                                type="tel"
                                value={customOrder.phone}
                                onChange={e => setCustomOrder({ ...customOrder, phone: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#B03050]"
                                placeholder="080..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Date Needed</label>
                            <input
                                required
                                type="date"
                                value={customOrder.date}
                                onChange={e => setCustomOrder({ ...customOrder, date: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#B03050]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                            <textarea
                                required
                                value={customOrder.description}
                                onChange={e => setCustomOrder({ ...customOrder, description: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#B03050] min-h-[120px]"
                                placeholder="Describe the design, theme, colors, and any specific requirements..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Budget Range (Optional)</label>
                            <input
                                type="text"
                                value={customOrder.budget}
                                onChange={e => setCustomOrder({ ...customOrder, budget: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#B03050]"
                                placeholder="e.g. 20,000 - 30,000"
                            />
                        </div>

                        <button type="submit" className="w-full py-4 bg-[#B03050] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#902040] transition-all">
                            Submit Request
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const handleOrderSubmit = async () => {
        if (!customerDetails.name || !customerDetails.phone) {
            alert("Please provide your name and phone number.");
            return;
        }

        // Construct detailed notes about layers
        let layerDetails = "";
        for (let i = 0; i < layers; i++) {
            const flavorName = getFlavorName(layerFlavors[i]);
            const fillingName = getFillingName(layerFillings[i]);
            layerDetails += `Layer ${i + 1}: ${flavorName} with ${fillingName} filling. `;
        }

        const fullNotes = (customerDetails.notes || "") + "\n\nCake Details:\n" + layerDetails;

        const orderData = {
            customer_name: customerDetails.name,
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone,
            customer_notes: fullNotes,
            total_price: totalPrice, // Changed from total_amount to match schema
            status: 'Pending',
            source: 'Website',
            // items field removed as it doesn't exist in schema
        };

        // 1. Insert Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) {
            alert("Error placing order: " + orderError.message);
            return;
        }

        // 2. Insert Order Item
        // We treat the whole cake as one item for now, using the bottom layer as the primary recipe
        const orderItemData = {
            order_id: order.id,
            recipe_id: layerFlavors[0], // Primary flavor
            filling_id: layerFillings[0] || null, // Primary filling
            size_inches: size,
            layers: layers,
            quantity: 1,
            item_price: totalPrice,
            custom_extras: selectedToppers // Store toppers as JSON
        };

        const { error: itemError } = await supabase
            .from('order_items')
            .insert(orderItemData);

        if (itemError) {
            console.error("Error creating order item:", itemError);
            // We don't stop here, as the order is created. Admin can see details in notes.
        }

        // 3. Send Emails
        try {
            const adminEmail = await getAdminEmail();
            const itemsSummary = `Shape: ${shape}, Size: ${size} Inch, Layers: ${layers}\n${layerDetails}`;

            // Admin Notification
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: adminEmail,
                    subject: `New Order #${order.id.slice(0, 8)} from ${order.customer_name}`,
                    html: NewOrderAdminTemplate({ ...order, items_summary: itemsSummary })
                })
            });

            // Customer Notification (if email provided)
            if (order.customer_email) {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: order.customer_email,
                        subject: 'We received your order! 🎂',
                        html: NewOrderCustomerTemplate({ ...order, items_summary: itemsSummary })
                    })
                });
            }
        } catch (emailError) {
            console.error("Error sending emails:", emailError);
        }

        setOrderSubmitted(true);
    };

    if (orderSubmitted) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
                    <Check className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-serif text-[#B03050] mb-4">Order Received!</h1>
                <p className="text-slate-600 max-w-md mb-8">
                    Thank you, {customerDetails.name.split(' ')[0]}. We have received your order request.
                    <br /><br />
                    <strong>Payment details will be sent to your email/phone upon confirmation.</strong>
                </p>
                <Link href="/" className="px-8 py-4 bg-[#B03050] text-white rounded-xl font-bold shadow-lg hover:bg-[#902040] transition-all">
                    Return Home
                </Link>
            </div>
        );
    }

    const toggleTopper = (topperId: string) => {
        setSelectedToppers(prev =>
            prev.includes(topperId)
                ? prev.filter(id => id !== topperId)
                : [...prev, topperId]
        );
    };

    const getFlavorName = (id: string) => flavors.find(f => f.id === id)?.name || "Unknown";
    const getFillingName = (id: string) => fillings.find(f => f.id === id)?.name || "None";

    // Get color of the bottom layer for the 3D model
    const bottomLayerFlavorId = layerFlavors[0];
    const bottomFlavor = flavors.find(f => f.id === bottomLayerFlavorId);
    // Simple color mapping based on name
    const getFlavorColor = (name: string) => {
        if (!name) return "#F5E6D3";
        const n = name.toLowerCase();
        if (n.includes("chocolate")) return "#5D4037";
        if (n.includes("red velvet")) return "#9E2A2B";
        if (n.includes("strawberry")) return "#FFB7B2";
        if (n.includes("lemon")) return "#FFF9C4";
        if (n.includes("carrot")) return "#E67E22";
        return "#F5E6D3"; // Vanilla/Default
    };
    const modelColor = getFlavorColor(bottomFlavor?.name || "");

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row font-sans text-slate-800">

            {/* Left: Order Form */}
            <div className="w-full md:w-2/3 p-6 md:p-12 overflow-y-auto h-screen">
                <div className="max-w-2xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#B03050] mb-8 font-bold text-sm uppercase tracking-wider">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>

                    <div className="mb-8 bg-pink-50 border border-pink-100 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-[#B03050]">Want something unique?</h4>
                            <p className="text-sm text-slate-600">Request a custom design tailored to your needs.</p>
                        </div>
                        <button
                            onClick={() => setIsCustomOrder(true)}
                            className="px-4 py-2 bg-white text-[#B03050] font-bold rounded-lg text-sm shadow-sm hover:bg-pink-50 transition-colors"
                        >
                            Custom Order
                        </button>
                    </div>

                    <h1 className="text-4xl font-serif text-[#B03050] mb-2">Build Your Cake</h1>
                    <p className="text-slate-500 mb-8">Customize every layer to your taste.</p>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2 mb-12">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className={`h-2 flex-1 rounded-full transition-all ${s <= step ? 'bg-[#B03050]' : 'bg-slate-200'}`} />
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <section>
                                <h3 className="text-xl font-serif font-bold mb-4">1. Choose Shape & Size</h3>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button
                                        onClick={() => setShape('round')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${shape === 'round' ? 'border-[#B03050] bg-pink-50 text-[#B03050]' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-current opacity-20" />
                                        <span className="font-bold">Round</span>
                                    </button>
                                    <button
                                        onClick={() => setShape('square')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${shape === 'square' ? 'border-[#B03050] bg-pink-50 text-[#B03050]' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-12 h-12 bg-current opacity-20" />
                                        <span className="font-bold">Square</span>
                                    </button>
                                    <button
                                        onClick={() => setShape('heart')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${shape === 'heart' ? 'border-[#B03050] bg-pink-50 text-[#B03050]' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-12 h-12 bg-current opacity-20 clip-path-heart" style={{ clipPath: "path('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z')" }} />
                                        <span className="font-bold">Heart</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <label className="block font-bold text-slate-700">Size (Inches)</label>
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        {[6, 8, 10, 12, 14].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setSize(s)}
                                                className={`px-6 py-3 rounded-xl font-bold border-2 transition-all whitespace-nowrap ${size === s ? 'border-[#B03050] bg-[#B03050] text-white' : 'border-slate-200 text-slate-500 hover:border-[#B03050]'}`}
                                            >
                                                {s} Inch
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-serif font-bold mb-4">2. How many layers?</h3>
                                <div className="flex gap-4">
                                    {[1, 2, 3, 4].map((l) => (
                                        <button
                                            key={l}
                                            onClick={() => setLayers(l)}
                                            className={`w-16 h-16 rounded-xl font-bold border-2 transition-all flex items-center justify-center text-xl ${layers === l ? 'border-[#B03050] bg-[#B03050] text-white' : 'border-slate-200 text-slate-500 hover:border-[#B03050]'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <button onClick={() => setStep(2)} className="w-full py-4 bg-[#B03050] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#902040] transition-all flex items-center justify-center gap-2 mt-8">
                                Next: Flavors <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-serif font-bold mb-4">Choose Flavors & Fillings</h3>

                            {Array.from({ length: layers }).map((_, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-sm mb-4">Layer {i + 1} (Bottom to Top)</h4>

                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Cake Flavor</label>
                                        <select
                                            value={layerFlavors[i] || ""}
                                            onChange={(e) => handleLayerFlavorChange(i, e.target.value)}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:border-[#B03050] focus:ring-4 focus:ring-[#B03050]/10 transition-all shadow-sm"
                                        >
                                            <option value="" disabled>Select Flavor</option>
                                            {flavors.length > 0 ? (
                                                flavors.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))
                                            ) : (
                                                <option disabled>Loading flavors...</option>
                                            )}
                                        </select>
                                    </div>

                                    {i < layers - 1 && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Filling (Optional)</label>
                                            <select
                                                value={layerFillings[i] || ""}
                                                onChange={(e) => handleLayerFillingChange(i, e.target.value)}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:border-[#B03050] focus:ring-4 focus:ring-[#B03050]/10 transition-all shadow-sm"
                                            >
                                                <option value="">No Filling</option>
                                                {fillings.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name} (+₦{f.price || 1000})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                                    Back
                                </button>
                                <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-[#B03050] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#902040] transition-all flex items-center justify-center gap-2">
                                    Next: Toppers <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-serif font-bold mb-4">Add Extras & Toppers</h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {toppers.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => toggleTopper(t.id)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${selectedToppers.includes(t.id) ? 'border-[#B03050] bg-pink-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        {selectedToppers.includes(t.id) && (
                                            <div className="absolute top-2 right-2 text-[#B03050] bg-white rounded-full p-1 shadow-sm z-10">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}

                                        {t.image_url ? (
                                            <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-white border border-slate-100">
                                                <img src={t.image_url} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-32 mb-3 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                                                <ShoppingBag className="w-8 h-8 opacity-20" />
                                            </div>
                                        )}

                                        <span className="font-bold block text-slate-800">{t.name}</span>
                                        <span className="text-xs text-slate-500">+₦{(t.purchase_price || 500) * 2}</span>
                                    </button>
                                ))}
                                {toppers.length === 0 && (
                                    <p className="col-span-3 text-slate-400 italic">No toppers available in stock.</p>
                                )}
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                                    Back
                                </button>
                                <button onClick={() => setStep(4)} className="flex-[2] py-4 bg-[#B03050] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#902040] transition-all flex items-center justify-center gap-2">
                                    Next: Your Details <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-serif font-bold mb-4">Your Details</h3>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={customerDetails.name}
                                            onChange={e => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#B03050] focus:ring-4 focus:ring-[#B03050]/10 transition-all shadow-sm"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={customerDetails.phone}
                                            onChange={e => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#B03050] focus:ring-4 focus:ring-[#B03050]/10 transition-all shadow-sm"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Optional)</label>
                                        <input
                                            type="email"
                                            value={customerDetails.email}
                                            onChange={e => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#B03050] focus:ring-4 focus:ring-[#B03050]/10 transition-all shadow-sm"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Special Instructions / Notes</label>
                                        <textarea
                                            value={customerDetails.notes}
                                            onChange={e => setCustomerDetails({ ...customerDetails, notes: e.target.value })}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#B03050] focus:ring-4 focus:ring-[#B03050]/10 transition-all shadow-sm min-h-[80px]"
                                            placeholder="Any specific requests, allergies, or delivery notes..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setStep(3)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                                    Back
                                </button>
                                <button onClick={() => {
                                    if (!customerDetails.name || !customerDetails.phone) {
                                        alert("Please provide your name and phone number.");
                                        return;
                                    }
                                    setStep(5);
                                }} className="flex-[2] py-4 bg-[#B03050] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#902040] transition-all flex items-center justify-center gap-2">
                                    Review Order <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-serif font-bold mb-4">Review & Confirm</h3>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">Cake Details</h4>
                                <div className="flex justify-between items-center pb-2">
                                    <span className="font-bold text-slate-700">{size}" {shape === 'round' ? 'Round' : 'Square'} Cake ({layers} Layers)</span>
                                    <span className="font-bold text-[#B03050]">₦{totalPrice.toLocaleString()}</span>
                                </div>

                                <div className="space-y-2 text-sm text-slate-600">
                                    {Array.from({ length: layers }).map((_, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span>Layer {i + 1}: {getFlavorName(layerFlavors[i])}</span>
                                            {i < layers - 1 && layerFillings[i] && (
                                                <span className="text-slate-400">+ {getFillingName(layerFillings[i])}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {selectedToppers.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <span className="font-bold text-slate-700 block mb-2">Extras:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedToppers.map(id => {
                                                const t = toppers.find(top => top.id === id);
                                                return t ? (
                                                    <span key={id} className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{t.name}</span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <h4 className="font-bold text-slate-700">Customer Details</h4>
                                    <button onClick={() => setStep(4)} className="text-xs font-bold text-[#B03050] hover:underline">Edit</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-slate-400 text-xs uppercase font-bold">Name</span>
                                        <span className="font-medium text-slate-800">{customerDetails.name}</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-400 text-xs uppercase font-bold">Phone</span>
                                        <span className="font-medium text-slate-800">{customerDetails.phone}</span>
                                    </div>
                                    {customerDetails.email && (
                                        <div className="col-span-2">
                                            <span className="block text-slate-400 text-xs uppercase font-bold">Email</span>
                                            <span className="font-medium text-slate-800">{customerDetails.email}</span>
                                        </div>
                                    )}
                                    {customerDetails.notes && (
                                        <div className="col-span-2">
                                            <span className="block text-slate-400 text-xs uppercase font-bold">Notes</span>
                                            <span className="font-medium text-slate-800">{customerDetails.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setStep(4)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                                    Back
                                </button>
                                <button onClick={handleOrderSubmit} className="flex-[2] py-4 bg-[#B03050] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#902040] transition-all flex items-center justify-center gap-2">
                                    Confirm Order Request <CreditCard className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Right: 3D Preview (Sticky) */}
            <div className="hidden md:block w-1/3 bg-[#E8ECE9] relative border-l border-slate-200">
                <div className="sticky top-0 h-screen">
                    <div className="absolute top-6 left-6 z-10 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Preview</span>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 z-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Total</p>
                                <p className="text-3xl font-serif font-bold text-[#B03050]">₦{totalPrice.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-500">{size}" {shape}</p>
                                <p className="text-xs font-bold text-slate-500">{layers} Layers</p>
                            </div>
                        </div>
                    </div>

                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                        <Canvas shadows camera={{ position: [0, 2, 6], fov: 35 }}>
                            <Environment preset="city" />
                            <Stage intensity={0.5} environment="city" adjustCamera={false}>
                                <CakeModel
                                    shape={shape}
                                    size={size}
                                    layers={layers}
                                    color={modelColor}
                                />
                            </Stage>
                        </Canvas>
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
