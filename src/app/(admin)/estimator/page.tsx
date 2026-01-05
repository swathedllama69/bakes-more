"use client";

import { useState, useEffect } from "react";
import { Calculator, RefreshCw, DollarSign, Percent, Clock, Briefcase, Printer, ArrowLeft, Wheat, Egg, Milk, Croissant, Cookie, FileText, Save, User } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import QuotePDF from '@/components/pdf/QuotePDF';

const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

export default function EstimatorPage() {
    const router = useRouter();

    // State
    const [customerName, setCustomerName] = useState("");
    const [description, setDescription] = useState("");
    const [materialCost, setMaterialCost] = useState<number>(0);
    const [laborHours, setLaborHours] = useState<number>(0);
    const [hourlyRate, setHourlyRate] = useState<number>(1500); // Default, will fetch from settings
    const [overheadPercent, setOverheadPercent] = useState<number>(20); // Default 20%
    const [profitMargin, setProfitMargin] = useState<number>(30); // Default 30%
    const [loading, setLoading] = useState(false);

    // Results
    const [laborCost, setLaborCost] = useState<number>(0);
    const [overheadCost, setOverheadCost] = useState<number>(0);
    const [totalCost, setTotalCost] = useState<number>(0);
    const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
    const [profit, setProfit] = useState<number>(0);

    // Fetch Settings on Load
    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('settings').select('hourly_labor_rate').single();
            if (data?.hourly_labor_rate) {
                setHourlyRate(data.hourly_labor_rate);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        calculate();
    }, [materialCost, laborHours, hourlyRate, overheadPercent, profitMargin]);

    const calculate = () => {
        const lCost = laborHours * hourlyRate;
        const baseCost = materialCost + lCost;
        const oCost = baseCost * (overheadPercent / 100);
        const tCost = baseCost + oCost;

        // Profit Margin Calculation: Price = Cost / (1 - Margin%)
        let sPrice = 0;
        if (profitMargin < 100) {
            sPrice = tCost / (1 - (profitMargin / 100));
        } else {
            sPrice = tCost * 2; // Fallback if invalid
        }

        const pVal = sPrice - tCost;

        setLaborCost(lCost);
        setOverheadCost(oCost);
        setTotalCost(tCost);
        setSuggestedPrice(sPrice);
        setProfit(pVal);
    };

    const reset = () => {
        setCustomerName("");
        setDescription("");
        setMaterialCost(0);
        setLaborHours(0);
        // Keep rates/percentages as they are likely constant
    };

    const handleSaveQuote = async () => {
        if (!customerName) {
            alert("Please enter a Customer Name to save this quote.");
            return;
        }
        if (suggestedPrice <= 0) {
            alert("Please calculate a valid price before saving.");
            return;
        }

        setLoading(true);

        try {
            // Create Order with 'Quote' status
            const { data: order, error } = await supabase
                .from("orders")
                .insert({
                    customer_name: customerName,
                    created_at: new Date().toISOString(),
                    status: 'Quote',
                    total_price: suggestedPrice,
                    total_cost: totalCost,
                    profit: profit,
                    notes: `${description}\n\n--- Estimate Breakdown ---\nMaterials: ₦${materialCost}\nLabor: ₦${laborCost} (${laborHours}hrs @ ₦${hourlyRate}/hr)\nOverhead: ₦${overheadCost} (${overheadPercent}%)\nTarget Margin: ${profitMargin}%`,
                    // We don't have a specific recipe, so we might skip order_items or add a generic one if needed.
                    // For now, we'll rely on the order record itself.
                })
                .select()
                .single();

            if (error) throw error;

            // Optional: Create a generic order item if your system requires it for stats
            // const { error: itemError } = await supabase.from("order_items").insert({ ... })

            router.push(`/orders/${order.id}`);

        } catch (error: any) {
            alert("Error saving quote: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 bg-[#FDFBF7] print:bg-white print:p-0">

            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 print:hidden">
                <div className="flex flex-col gap-4">
                    <Link href="/Calculator" className="self-start flex items-center gap-2 bg-white text-slate-600 px-5 py-2 rounded-full font-bold shadow-sm border border-[#E8ECE9] hover:bg-[#B03050] hover:text-white hover:border-[#B03050] transition-all group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Quotes
                    </Link>
                    <div>
                        <h1 className="text-3xl font-serif text-[#B03050] flex items-center gap-3">
                            <Calculator className="w-8 h-8" />
                            Custom Estimator
                        </h1>
                        <p className="text-slate-500 font-medium">Calculate pricing for custom orders without a recipe.</p>
                    </div>
                </div>
                <div className="flex gap-3 self-start md:self-center flex-wrap">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 bg-white text-slate-600 px-4 py-3 rounded-xl font-bold shadow-sm border border-[#E8ECE9] hover:bg-[#FAFAFA] transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reset</span>
                    </button>
                    <button
                        onClick={handleSaveQuote}
                        disabled={loading}
                        className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        <span>{loading ? "Saving..." : "Save as Quote"}</span>
                    </button>
                    <PDFDownloadLink
                        document={
                            <QuotePDF
                                customerName={customerName}
                                date={new Date().toISOString()}
                                totalPrice={suggestedPrice}
                                notes={`${description}\n\n--- Estimate Breakdown ---\nMaterials: ₦${materialCost}\nLabor: ₦${laborCost} (${laborHours}hrs @ ₦${hourlyRate}/hr)\nOverhead: ₦${overheadCost} (${overheadPercent}%)\nTarget Margin: ${profitMargin}%`}
                                items={[{
                                    name: description || 'Custom Estimate',
                                    qty: 1,
                                    price: suggestedPrice
                                }]}
                                type="ESTIMATE"
                            />
                        }
                        fileName={`Estimate-${customerName || 'Draft'}.pdf`}
                        className="flex items-center gap-2 bg-[#B03050] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] transition-all"
                    >
                        {({ loading }) => (
                            <>
                                <Printer className="w-5 h-5" />
                                <span>{loading ? "Loading..." : "Print Estimate"}</span>
                            </>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Description & Customer */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-serif text-slate-800">Estimate Details</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Customer Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="e.g. Sarah Johnson"
                                        className="w-full p-4 pl-12 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-lg text-slate-700 transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Description / Item Name</label>
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g. Custom Wedding Cake"
                                    className="w-full p-4 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-lg text-slate-700 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Direct Costs */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-[#B03050]">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-serif text-slate-800">Direct Costs</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Total Material Cost (₦)</label>
                                <input
                                    type="number"
                                    value={materialCost || ''}
                                    onChange={(e) => setMaterialCost(Number(e.target.value))}
                                    placeholder="e.g. 5000"
                                    className="w-full p-4 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-lg text-slate-700 transition-colors"
                                />
                                <p className="text-xs text-slate-400 mt-2">Sum of all ingredients, packaging, and extras.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Labor Hours</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="number"
                                            value={laborHours || ''}
                                            onChange={(e) => setLaborHours(Number(e.target.value))}
                                            placeholder="e.g. 2.5"
                                            className="w-full p-4 pl-12 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Hourly Rate (₦)</label>
                                    <input
                                        type="number"
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                                        className="w-full p-4 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Indirect Costs & Profit */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                <Percent className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-serif text-slate-800">Overhead & Profit</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Overhead Percentage</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        value={overheadPercent}
                                        onChange={(e) => setOverheadPercent(Number(e.target.value))}
                                        className="w-full p-4 pl-12 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Covers utilities, rent, wear & tear.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Target Profit Margin (%)</label>
                                <div className="relative">
                                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        value={profitMargin}
                                        onChange={(e) => setProfitMargin(Number(e.target.value))}
                                        className="w-full p-4 pl-12 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Desired profit on top of costs.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-[#B03050] text-white p-8 rounded-[2rem] shadow-xl shadow-pink-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                        <h2 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Suggested Price</h2>
                        <div className="text-5xl font-serif font-bold mb-8">
                            ₦{suggestedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-white/20 pb-4">
                                <span className="font-medium opacity-90">Total Cost</span>
                                <span className="font-bold text-xl">₦{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/20 pb-4">
                                <span className="font-medium opacity-90">Net Profit</span>
                                <span className="font-bold text-xl">₦{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h3 className="text-sm font-bold uppercase text-slate-400 mb-6 tracking-wider">Cost Breakdown</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-slate-600 font-medium">Materials</span>
                                </div>
                                <span className="font-bold text-slate-800">₦{materialCost.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <span className="text-slate-600 font-medium">Labor</span>
                                </div>
                                <span className="font-bold text-slate-800">₦{laborCost.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    <span className="text-slate-600 font-medium">Overhead</span>
                                </div>
                                <span className="font-bold text-slate-800">₦{overheadCost.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#E8ECE9]">
                            <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">
                                <span>Breakdown</span>
                                <span>% of Total</span>
                            </div>
                            <div className="h-4 bg-[#FAFAFA] rounded-full overflow-hidden flex">
                                <div style={{ width: `${totalCost > 0 ? (materialCost / totalCost) * 100 : 0}%` }} className="bg-blue-500 h-full"></div>
                                <div style={{ width: `${totalCost > 0 ? (laborCost / totalCost) * 100 : 0}%` }} className="bg-yellow-500 h-full"></div>
                                <div style={{ width: `${totalCost > 0 ? (overheadCost / totalCost) * 100 : 0}%` }} className="bg-purple-500 h-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom PDF Print View */}
            <div className="hidden print:block max-w-3xl mx-auto bg-white p-12 rounded-xl relative overflow-hidden">
                {/* Background Design */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#B03050] rounded-bl-[100%] -z-0 opacity-5"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-100 rounded-tr-[100%] -z-0 opacity-20"></div>

                {/* Baking Ingredients Background Pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
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
                            <div className="w-24 h-24 relative">
                                <img src="/logo.png" alt="Bakes & More" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-[#B03050] tracking-tight">Bakes & More</h1>
                                <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">By Hafsaa</p>
                            </div>
                        </div>
                        <div className="text-sm text-slate-500 space-y-1 font-medium">
                            <p>123 Bakery Street</p>
                            <p>Lagos, Nigeria</p>
                            <p>+234 800 BAKERY</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-5xl font-serif font-bold text-slate-100 mb-2">ESTIMATE</h2>
                        <p className="text-slate-400 font-medium">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Estimate Info */}
                <div className="bg-slate-50 p-6 rounded-2xl mb-12 relative z-10">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-2">Estimate For</p>
                            <h3 className="text-xl font-serif font-bold text-slate-800">{customerName || 'Valued Customer'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-2">Description</p>
                            <h3 className="text-xl font-serif font-bold text-slate-800">{description || 'Custom Order'}</h3>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="mb-12 relative z-10">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-slate-100">
                                <th className="py-4 text-xs font-bold uppercase text-slate-400 tracking-widest">Description</th>
                                <th className="py-4 text-xs font-bold uppercase text-slate-400 tracking-widest text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <tr>
                                <td className="py-4 font-medium text-slate-700">Material Costs</td>
                                <td className="py-4 text-right font-medium text-slate-600">₦{materialCost.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-4 font-medium text-slate-700">Labor ({laborHours} hrs @ ₦{hourlyRate}/hr)</td>
                                <td className="py-4 text-right font-medium text-slate-600">₦{laborCost.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-4 font-medium text-slate-700">Overhead ({overheadPercent}%)</td>
                                <td className="py-4 text-right font-medium text-slate-600">₦{overheadCost.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Total */}
                <div className="flex justify-end relative z-10">
                    <div className="w-64 bg-[#B03050] text-white p-8 rounded-2xl shadow-lg shadow-pink-200">
                        <p className="text-xs font-bold uppercase opacity-80 tracking-widest mb-1">Suggested Price</p>
                        <p className="text-4xl font-serif font-bold">₦{suggestedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        <p className="text-xs opacity-60 mt-2">Includes {profitMargin}% Profit Margin</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center text-xs text-slate-400 font-medium relative z-10">
                    <p>Thank you for choosing Bakes & More!</p>
                    <p className="mt-1">This is an estimate, final price may vary based on final design changes.</p>
                </div>
            </div>
        </div>
    );
}
