"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getPackagingSize } from "@/lib/constants/bakery";
import { calculateJobCost, ProductionSummary, ProductionItem } from "@/lib/calculations/production";
import { Printer, Save, RefreshCw, Plus, Trash2, AlertTriangle, CheckCircle, Edit, Calculator as CalcIcon, Banknote, Wheat, Egg, Milk, Croissant, Cookie, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import dynamic from "next/dynamic";
import QuotePDF from '@/components/pdf/QuotePDF';

const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

export default function QuoteCalculator() {
    const router = useRouter();

    // --- Data Sources ---
    const [recipes, setRecipes] = useState<any[]>([]);
    const [fillings, setFillings] = useState<any[]>([]);

    // --- Inputs ---
    const [selectedRecipe, setSelectedRecipe] = useState("");
    const [selectedFilling, setSelectedFilling] = useState("");
    const [size, setSize] = useState(8);
    const [layers, setLayers] = useState(2);
    const [qty, setQty] = useState(1);
    const [salePrice, setSalePrice] = useState(0);
    const [customerName, setCustomerName] = useState("");
    const [notes, setNotes] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

    // --- Custom Adjustments (Pre-Calculation) ---
    const [customName, setCustomName] = useState("");
    const [customCost, setCustomCost] = useState(0);
    const [customItems, setCustomItems] = useState<any[]>([]);

    // --- Results & State ---
    const [summary, setSummary] = useState<ProductionSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditingMaterials, setIsEditingMaterials] = useState(false);
    const [editedItems, setEditedItems] = useState<ProductionItem[]>([]);

    // --- Modals ---
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'success' | 'info';
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } });

    useEffect(() => {
        const fetchData = async () => {
            const { data: r } = await supabase.from("recipes").select("*").order('name');
            const { data: f } = await supabase.from("fillings").select("*").order('name');
            setRecipes(r || []);
            setFillings(f || []);
        };
        fetchData();
    }, []);

    // --- Auto-Calculate Effect ---
    useEffect(() => {
        if (selectedRecipe) {
            // Auto-set price if available and not manually set (or if 0)
            const recipe = recipes.find(r => r.id === selectedRecipe);
            if (recipe && recipe.selling_price > 0 && salePrice === 0) {
                setSalePrice(recipe.selling_price);
            }
            handleCalculate();
        } else {
            setSummary(null);
        }
    }, [selectedRecipe, selectedFilling, size, layers, qty, salePrice, customItems]);

    const handleCalculate = async () => {
        if (!selectedRecipe) return;
        setLoading(true);

        try {
            const pkgSize = getPackagingSize(size);

            // 1. Fetch Recipe Ingredients
            const { data: cakeData } = await supabase
                .from("recipe_ingredients")
                .select(`amount_grams_ml, ingredients(id, name, unit, current_stock, purchase_price, purchase_quantity)`)
                .eq("recipe_id", selectedRecipe);

            // 2. Fetch Filling Ingredients
            let fillingData: any[] = [];
            if (selectedFilling) {
                const { data } = await supabase
                    .from("filling_ingredients")
                    .select(`amount_grams_ml, ingredients(id, name, unit, current_stock, purchase_price, purchase_quantity)`)
                    .eq("filling_id", selectedFilling);
                fillingData = data || [];
            }

            // 3. Fetch Packaging
            const { data: pkgData } = await supabase
                .from("ingredients")
                .select("*")
                .or(`name.ilike.%box (${pkgSize} inch)%,name.ilike.%board (${pkgSize} inch)%`);

            // 4. Fetch Settings
            const { data: settings } = await supabase.from("settings").select("gas_rate_per_minute, electricity_rate_per_minute").single();
            const overheadRates = {
                gas: settings?.gas_rate_per_minute || 50,
                electricity: settings?.electricity_rate_per_minute || 30
            };

            // 5. Calculate
            if (cakeData) {
                // Get baking duration from recipe list
                const recipe = recipes.find(r => r.id === selectedRecipe);
                const duration = recipe?.baking_duration_minutes || 45;

                const result = calculateJobCost(
                    { ingredients: cakeData, baking_duration_minutes: duration },
                    { ingredients: fillingData },
                    pkgData || [],
                    customItems,
                    { size, layers, qty, salePrice },
                    overheadRates
                );
                setSummary(result);

                // Reset editing state when inputs change (re-calculation overrides edits)
                if (isEditingMaterials) {
                    setIsEditingMaterials(false);
                    setEditedItems([]);
                }
            }
        } catch (error) {
            console.error("Calculation error:", error);
        } finally {
            setLoading(false);
        }
    };

    const addCustomItem = () => {
        if (!customName || customCost <= 0) return;
        setCustomItems([...customItems, { name: customName, cost: Number(customCost), qty: 1, type: 'Adjustment' }]);
        setCustomName("");
        setCustomCost(0);
    };

    const removeCustomItem = (index: number) => {
        const newItems = [...customItems];
        newItems.splice(index, 1);
        setCustomItems(newItems);
    };

    // --- Editable Materials Logic ---
    const startEditingMaterials = () => {
        if (summary) {
            setEditedItems(JSON.parse(JSON.stringify(summary.items)));
            setIsEditingMaterials(true);
        }
    };

    const saveEditedMaterials = () => {
        if (!summary) return;

        // Recalculate totals based on edited items
        const newTotalCost = editedItems.reduce((acc, item) => acc + (item.costToBake || 0), 0);
        const newProfit = (salePrice - (summary.vat || 0)) - newTotalCost; // Simple profit recalc

        const newSummary: ProductionSummary = {
            ...summary,
            items: editedItems,
            totalCostToBake: newTotalCost,
            totalProfit: newProfit
        };

        setSummary(newSummary);
        setIsEditingMaterials(false);
    };

    const updateEditedItem = (index: number, field: keyof ProductionItem, value: any) => {
        const newItems = [...editedItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditedItems(newItems);
    };

    // --- Save as Quote ---
    const handleSaveQuote = async () => {
        if (!summary || !customerName) {
            alert("Please enter a Customer Name to save.");
            return;
        }

        setLoading(true);

        // Create Order with 'Quote' status
        const { data: order, error } = await supabase
            .from("orders")
            .insert({
                customer_name: customerName,
                delivery_date: new Date(orderDate).toISOString(),
                created_at: new Date(orderDate).toISOString(), // Allow backdating
                status: 'Quote', // You might need to add 'Quote' to your status enum or check constraint
                total_price: salePrice,
                total_cost: summary.totalCostToBake,
                profit: summary.totalProfit,
                notes: notes,
                production_snapshot: summary // Save the calculated/edited snapshot!
            })
            .select()
            .single();

        if (error) {
            alert("Error saving quote: " + error.message);
        } else {
            // Create Order Item
            const { error: itemError } = await supabase
                .from("order_items")
                .insert({
                    order_id: order.id,
                    recipe_id: selectedRecipe,
                    filling_id: selectedFilling || null,
                    size_inches: size,
                    layers: layers,
                    quantity: qty,
                    item_price: salePrice,
                    custom_extras: customItems
                });

            if (itemError) {
                alert("Quote saved but items failed: " + itemError.message);
            } else {
                setModalConfig({
                    isOpen: true,
                    title: "Quote Saved",
                    message: "This calculation has been saved as a Quote. You can find it in the Orders list.",
                    type: "success",
                    onConfirm: () => {
                        setModalConfig(prev => ({ ...prev, isOpen: false }));
                        router.push(`/orders/${order.id}`);
                    }
                });
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 bg-[#FDFBF7] print:bg-white print:p-0">

            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-serif text-[#B03050] flex items-center gap-3">
                        <CalcIcon className="w-8 h-8" />
                        Quote & Production
                    </h1>
                    <p className="text-slate-500 font-medium">Estimate costs, check stock, and generate quotes.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/quotes" className="flex items-center gap-2 bg-white text-slate-600 px-4 py-3 rounded-xl font-bold shadow-sm border border-[#E8ECE9] hover:bg-[#FAFAFA] transition-colors">
                        <FileText className="w-5 h-5" />
                        <span className="hidden md:inline">Saved Quotes</span>
                    </Link>
                    <Link href="/estimator" className="flex items-center gap-2 bg-white text-slate-600 px-4 py-3 rounded-xl font-bold shadow-sm border border-[#E8ECE9] hover:bg-[#FAFAFA] transition-colors">
                        <Banknote className="w-5 h-5" />
                        <span className="hidden md:inline">Custom Estimates</span>
                    </Link>
                    <PDFDownloadLink
                        document={
                            <QuotePDF
                                customerName={customerName}
                                date={orderDate}
                                totalPrice={salePrice}
                                notes={notes}
                                items={[{
                                    name: `${recipes.find(r => r.id === selectedRecipe)?.name || 'Custom Cake'} (${size}" ${layers} Layers)`,
                                    qty: qty,
                                    price: salePrice
                                }]}
                            />
                        }
                        fileName={`Quote-${customerName || 'Draft'}.pdf`}
                        className="p-3 bg-white border border-[#E8ECE9] rounded-xl text-slate-400 hover:text-[#B03050] hover:border-[#B03050] transition-all shadow-sm flex items-center justify-center"
                        title="Download Quote"
                    >
                        {({ loading }) => (
                            loading ? '...' : <Printer className="w-5 h-5" />
                        )}
                    </PDFDownloadLink>
                    <button
                        onClick={handleSaveQuote}
                        disabled={!summary}
                        className="flex items-center gap-2 bg-[#B03050] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5 text-white" />
                        Save as Quote
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">

                {/* LEFT: Inputs (Hidden on Print if desired, or styled differently) */}
                <div className="lg:col-span-4 space-y-6 print:hidden">

                    {/* 1. Product Config */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9] space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-[#B03050]">
                                <Wheat className="w-4 h-4" />
                            </div>
                            <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Product Configuration</h2>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Recipe</label>
                            <select
                                value={selectedRecipe}
                                onChange={e => setSelectedRecipe(e.target.value)}
                                className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                            >
                                <option value="">-- Select Recipe --</option>
                                {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Size (Inches)</label>
                                <input
                                    type="number"
                                    value={size}
                                    onChange={e => setSize(Number(e.target.value))}
                                    className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Layers</label>
                                <input
                                    type="number"
                                    value={layers}
                                    onChange={e => setLayers(Number(e.target.value))}
                                    className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Filling (Optional)</label>
                            <select
                                value={selectedFilling}
                                onChange={e => setSelectedFilling(e.target.value)}
                                className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                            >
                                <option value="">-- No Filling --</option>
                                {fillings.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    value={qty}
                                    onChange={e => setQty(Number(e.target.value))}
                                    className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sale Price (₦)</label>
                                <input
                                    type="number"
                                    value={salePrice}
                                    onChange={e => setSalePrice(Number(e.target.value))}
                                    className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Custom Extras */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9] space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                <Plus className="w-4 h-4" />
                            </div>
                            <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Custom Add-ons</h2>
                        </div>
                        <div className="flex gap-2">
                            <input
                                placeholder="Item Name"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                className="flex-1 p-3 bg-[#FAFAFA] rounded-xl text-sm border border-[#E8ECE9] outline-none focus:border-[#B03050]"
                            />
                            <input
                                type="number"
                                placeholder="Cost"
                                value={customCost || ''}
                                onChange={e => setCustomCost(Number(e.target.value))}
                                className="w-20 p-3 bg-[#FAFAFA] rounded-xl text-sm border border-[#E8ECE9] outline-none focus:border-[#B03050]"
                            />
                            <button onClick={addCustomItem} className="bg-[#B03050] text-white p-3 rounded-xl hover:bg-[#902040] transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {customItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9]">
                                    <span className="font-medium text-slate-700">{item.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-900">₦{item.cost}</span>
                                        <button onClick={() => removeCustomItem(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Customer Info (For Saving) */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9] space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Quote Details</h2>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Customer Name</label>
                            <input
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="Enter name to save quote..."
                                className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Order Date</label>
                            <input
                                type="date"
                                value={orderDate}
                                onChange={e => setOrderDate(e.target.value)}
                                className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] font-bold text-slate-700 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none focus:border-[#B03050] text-sm h-24 resize-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Results (The Printable Part) */}
                <div className="lg:col-span-8 print:col-span-12">
                    {summary ? (
                        <div className="space-y-6 print:space-y-4">

                            {/* Print Header (Visible only when printing) */}
                            <div className="hidden print:block mb-8 border-b pb-4">
                                <div className="flex items-center gap-4 mb-4">
                                    {/* Logo for Print */}
                                    <img src="/logo.png" alt="Bakes & More" className="w-16 h-16 object-contain" />
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-900">Bakes & More</h1>
                                        <p className="text-sm text-slate-500">Production Quote</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Generated On</p>
                                        <p className="font-medium">{new Date().toLocaleDateString()}</p>
                                    </div>
                                    {customerName && (
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 uppercase font-bold">Customer</p>
                                            <p className="font-bold text-lg">{customerName}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Financials */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                                <div className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm print:border-2 print:shadow-none">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Est. Cost</p>
                                    <p className="text-2xl font-serif text-slate-800">₦{(summary.totalCostToBake || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm print:border-2 print:shadow-none">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Profit Margin</p>
                                    <p className={`text-2xl font-serif ${(summary.totalProfit || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₦{(summary.totalProfit || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-[#FDFBF7] p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm print:border-2 print:border-pink-200 print:shadow-none">
                                    <p className="text-[10px] uppercase font-bold text-[#B03050] tracking-wider mb-1">Restock Needed</p>
                                    <p className="text-2xl font-serif text-[#B03050]">₦{(summary.totalRestockCost || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Materials Table */}
                            <div className="bg-white rounded-[2rem] shadow-sm border border-[#E8ECE9] overflow-hidden print:border-2 print:shadow-none print:rounded-none">
                                <div className="p-6 border-b border-[#E8ECE9] flex justify-between items-center print:p-4">
                                    <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Required Materials</h2>
                                    <div className="flex gap-2 print:hidden">
                                        {isEditingMaterials ? (
                                            <>
                                                <button onClick={() => setIsEditingMaterials(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-1">Cancel</button>
                                                <button onClick={saveEditedMaterials} className="text-xs font-bold bg-[#B03050] text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                    <Save className="w-3 h-3" /> Save Edits
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={startEditingMaterials} className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full hover:bg-slate-200 transition-colors flex items-center gap-1">
                                                <Edit className="w-3 h-3" /> Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#FAFAFA] text-[10px] uppercase font-bold text-slate-500 print:bg-slate-100">
                                        <tr>
                                            <th className="p-4 print:p-2">Item</th>
                                            <th className="p-4 print:p-2">Type</th>
                                            <th className="p-4 print:p-2">Qty Needed</th>
                                            <th className="p-4 text-right print:p-2">Stock Status</th>
                                            <th className="p-4 text-right print:p-2">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8ECE9]">
                                        {(isEditingMaterials ? editedItems : summary.items).map((item, idx) => (
                                            <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors print:hover:bg-transparent">
                                                <td className="p-4 font-medium text-slate-700 print:p-2">
                                                    {isEditingMaterials ? (
                                                        <input
                                                            value={item.name}
                                                            onChange={(e) => updateEditedItem(idx, 'name', e.target.value)}
                                                            className="w-full p-1 border rounded text-xs"
                                                        />
                                                    ) : item.name}
                                                </td>
                                                <td className="p-4 text-xs print:p-2">
                                                    <span className={`px-2 py-1 rounded-full font-bold print:border print:bg-transparent ${item.type === 'Overhead' ? 'bg-yellow-100 text-yellow-700' :
                                                        item.type === 'Packaging' ? 'bg-indigo-100 text-indigo-700' :
                                                            item.type === 'Adjustment' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-600 print:p-2">
                                                    {isEditingMaterials ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={item.requiredAmount}
                                                                onChange={(e) => updateEditedItem(idx, 'requiredAmount', Number(e.target.value))}
                                                                className="w-20 p-1 border rounded text-xs"
                                                            />
                                                            <span className="text-xs text-slate-400">{item.unit}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span>{(item.requiredAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                            <span className="text-xs text-slate-400">{item.unit}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right print:p-2">
                                                    {item.shortfall > 0 ? (
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center gap-1 text-red-600 font-bold text-xs">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                <span>Short: {item.shortfall.toFixed(1)}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">Stock: {(item.requiredAmount - item.shortfall).toFixed(1)}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                                                <CheckCircle className="w-3 h-3" />
                                                                <span>OK</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">Stock: {(item.requiredAmount + (item.stock || 0)).toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right font-mono text-slate-600 print:p-2">
                                                    {isEditingMaterials ? (
                                                        <input
                                                            type="number"
                                                            value={item.costToBake}
                                                            onChange={(e) => updateEditedItem(idx, 'costToBake', Number(e.target.value))}
                                                            className="w-24 p-1 border rounded text-xs text-right"
                                                        />
                                                    ) : (
                                                        <span>{(item.costToBake || 0).toLocaleString()}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-[#E8ECE9] rounded-[2rem] min-h-[400px] print:hidden">
                            <CalcIcon className="w-12 h-12 mb-4 text-slate-200" />
                            <p>Select a recipe to start calculating.</p>
                        </div>
                    )}
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
                        <h2 className="text-5xl font-serif font-bold text-slate-100 mb-2">QUOTE</h2>
                        <p className="text-slate-400 font-medium">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="bg-slate-50 p-6 rounded-2xl mb-12 relative z-10">
                    <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-2">Quote For</p>
                    <h3 className="text-xl font-serif font-bold text-slate-800">{customerName || 'Valued Customer'}</h3>
                    {notes && <p className="text-sm text-slate-500 mt-2 italic">"{notes}"</p>}
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
                            {/* Main Item */}
                            {selectedRecipe && (
                                <tr>
                                    <td className="py-6">
                                        <p className="font-bold text-slate-800 text-lg mb-1">
                                            {recipes.find(r => r.id === selectedRecipe)?.name}
                                        </p>
                                        <div className="text-sm text-slate-500 space-y-1">
                                            <p>{size} inches, {layers} Layers</p>
                                            {selectedFilling && <p>Filling: {fillings.find(f => f.id === selectedFilling)?.name}</p>}
                                        </div>
                                    </td>
                                    <td className="py-6 text-right font-bold text-slate-800">
                                        -
                                    </td>
                                </tr>
                            )}

                            {/* Custom Extras */}
                            {customItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-4">
                                        <p className="font-medium text-slate-700">{item.name}</p>
                                        <p className="text-xs text-slate-400">Custom Addition</p>
                                    </td>
                                    <td className="py-4 text-right font-medium text-slate-600">
                                        ₦{item.cost.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Total */}
                <div className="flex justify-end relative z-10">
                    <div className="w-64 bg-[#B03050] text-white p-8 rounded-2xl shadow-lg shadow-pink-200">
                        <p className="text-xs font-bold uppercase opacity-80 tracking-widest mb-1">Total Estimate</p>
                        <p className="text-4xl font-serif font-bold">₦{salePrice.toLocaleString()}</p>
                        <p className="text-xs opacity-60 mt-2">Valid for 7 days</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center text-xs text-slate-400 font-medium relative z-10">
                    <p>Thank you for choosing Bakes & More!</p>
                    <p className="mt-1">This is an estimate, final price may vary based on final design changes.</p>
                </div>
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />
        </div>
    );
}