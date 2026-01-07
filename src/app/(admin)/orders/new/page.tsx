"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { SIZE_MULTIPLIERS } from "@/lib/constants/bakery";
import { ArrowLeft, Plus, Trash2, Save, Calculator, Calendar, User, MapPin, Search, Check } from "lucide-react";

export default function NewOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Data Sources
    const [recipes, setRecipes] = useState<any[]>([]);
    const [fillings, setFillings] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    // Customer Selection
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    // Order Details
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(11, 0, 0, 0);
        return tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    });
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [source, setSource] = useState("Walk-in");

    // Order Items (The Cakes)
    const [items, setItems] = useState<any[]>([
        { id: 1, recipe_id: "", filling_id: "", size: 6, layers: [], qty: 1, price: 0, cost: 0 }
    ]);
    const [recipeSearch, setRecipeSearch] = useState("");

    // Financials
    const [extras, setExtras] = useState<any[]>([]); // { name, cost, price }
    const [extraName, setExtraName] = useState("");
    const [extraCost, setExtraCost] = useState(0);
    const [extraPrice, setExtraPrice] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
    const [vatType, setVatType] = useState<'none' | 'inclusive' | 'exclusive'>('none');
    const [vatRate, setVatRate] = useState(7.5);
    const [allowTip, setAllowTip] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: r, error: rErr } = await supabase.from("recipes").select("*");
                const { data: f, error: fErr } = await supabase.from("fillings").select("*");
                const { data: c, error: cErr } = await supabase.from("customers").select("*").order("full_name");
                if (rErr || fErr || cErr) throw rErr || fErr || cErr;
                setRecipes(r || []);
                setFillings(f || []);
                setCustomers(c || []);
            } catch (err) {
                setRecipes([]);
                setFillings([]);
                setCustomers([]);
            }
        };
        fetchData();
    }, []);

    const selectCustomer = (customer: any) => {
        setSelectedCustomerId(customer.id);
        setCustomerName(customer.full_name);
        setCustomerPhone(customer.phone || "");
        setDeliveryAddress(customer.address || "");
        if (customer.notes) {
            setNotes(prev => prev ? `${prev}\nCustomer Note: ${customer.notes}` : `Customer Note: ${customer.notes}`);
        }
        setIsCustomerSearchOpen(false);
    };

    // --- LOGIC: Calculate Estimated Cost for an Item ---
    const calculateItemCost = async (index: number, recipeId: string, fillingId: string, size: number, layers: number) => {
        if (!recipeId) return 0;

        // 1. Fetch Recipe Ingredients Cost
        const { data: recipeData } = await supabase
            .from("recipe_ingredients")
            .select(`amount_grams_ml, ingredients(purchase_price, purchase_quantity)`)
            .eq("recipe_id", recipeId);

        let baseCost = 0;
        if (recipeData) {
            baseCost = recipeData.reduce((acc: number, curr: any) => {
                const pricePerUnit = curr.ingredients.purchase_price / curr.ingredients.purchase_quantity;
                return acc + (curr.amount_grams_ml * pricePerUnit);
            }, 0);
        }

        // 2. Fetch Filling Ingredients Cost (if selected)
        let fillingBaseCost = 0;
        if (fillingId) {
            const { data: fillingData } = await supabase
                .from("filling_ingredients")
                .select(`amount_grams_ml, ingredients(purchase_price, purchase_quantity)`)
                .eq("filling_id", fillingId);

            if (fillingData) {
                fillingBaseCost = fillingData.reduce((acc: number, curr: any) => {
                    const pricePerUnit = curr.ingredients.purchase_price / curr.ingredients.purchase_quantity;
                    return acc + (curr.amount_grams_ml * pricePerUnit);
                }, 0);
            }
        }

        // 3. Scale by Size & Layers
        const scale = (SIZE_MULTIPLIERS[size] || 1);

        // Cake Cost: Base * Scale * Layers
        const cakeCost = baseCost * scale * layers;

        // Filling Cost: Base * Scale * (Layers - 1)
        // If 1 layer, 0 filling. If 2 layers, 1 filling.
        const fillingLayers = Math.max(0, layers - 1);
        const fillingCost = fillingBaseCost * scale * fillingLayers;

        const totalCost = cakeCost + fillingCost;

        // 4. Suggest Price
        // Priority: Recipe Selling Price > Cost * 3
        let suggestedPrice = 0;
        const recipe = recipes.find(r => r.id === recipeId);

        if (recipe && recipe.selling_price > 0) {
            // If recipe has a set price, scale it by size/layers
            // Assuming selling_price is for the base size (usually 8" or scale 1)
            // Note: selling_price usually includes filling if it's a standard cake, 
            // but if filling is extra, we might want to add it?
            // For now, let's assume selling_price covers the cake structure.
            // But wait, if I add a premium filling, the price should go up?
            // If the user selected a filling, maybe we should add a markup for it?
            // The current logic just uses recipe.selling_price * scale * layers (implicitly or explicitly?)

            // Previous logic was: suggestedPrice = recipe.selling_price * scale (where scale included layers)
            // Wait, previous scale was: const scale = (SIZE_MULTIPLIERS[size] || 1) * layers;
            // So yes, it scaled by layers.

            // Let's keep the price logic consistent with previous version for the Cake part.
            // But what about Filling Price?
            // If we have a cost for filling, we should probably add a markup for it if we are using Cost * 3 fallback.
            // If we are using Set Price, does the Set Price include filling?
            // Usually "Vanilla Cake" price includes "Vanilla Buttercream".
            // If they choose "Strawberry Filling" (premium), maybe we should add extra?
            // For now, let's just stick to the base price logic, but ensure COST is accurate.

            suggestedPrice = recipe.selling_price * scale * layers;
        } else {
            // Fallback: Cost * 3
            suggestedPrice = Math.ceil((totalCost * 3) / 100) * 100;
        }

        // Update State
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            recipe_id: recipeId,
            filling_id: fillingId,
            size,
            layers,
            cost: totalCost, // Store the calculated cost
            price: suggestedPrice // Always update price when parameters change
        };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), recipe_id: "", filling_id: "", size: 6, layers: [], qty: 1, price: 0, cost: 0 }]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        const item = newItems[index];
        let newValue = value;
        if (field === 'layers') {
            newValue = Array.isArray(value) ? value : value ? [value] : [];
        }
        // If critical fields change, recalculate cost
        if (["recipe_id", "filling_id", "size", "layers"].includes(field)) {
            const updatedItem = { ...item, [field]: newValue };
            calculateItemCost(index, updatedItem.recipe_id, updatedItem.filling_id, updatedItem.size, updatedItem.layers);
        } else {
            newItems[index] = { ...item, [field]: newValue };
            setItems(newItems);
        }
    };

    const addExtra = () => {
        if (!extraName) return;
        setExtras([...extras, { name: extraName, cost: Number(extraCost), price: Number(extraPrice) }]);
        setExtraName("");
        setExtraCost(0);
        setExtraPrice(0);
    };

    const removeExtra = (index: number) => {
        setExtras(extras.filter((_, i) => i !== index));
    };

    // Totals
    const totalItemPrice = items.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);
    const totalItemCost = items.reduce((acc, item) => acc + (Number(item.cost || 0) * item.qty), 0);
    const totalExtrasPrice = extras.reduce((acc, ex) => acc + ex.price, 0);
    const totalExtrasCost = extras.reduce((acc, ex) => acc + ex.cost, 0);

    const subTotal = totalItemPrice + totalExtrasPrice;

    // Discount Logic
    const discountAmount = discountType === 'percent'
        ? (subTotal * (discountValue || 0) / 100)
        : (discountValue || 0);

    const netBeforeTax = Math.max(0, subTotal - discountAmount);

    // VAT Logic
    let vatAmount = 0;
    let grandTotal = netBeforeTax;

    if (vatType === 'exclusive') {
        vatAmount = netBeforeTax * (vatRate / 100);
        grandTotal = netBeforeTax + vatAmount;
    } else if (vatType === 'inclusive') {
        vatAmount = netBeforeTax - (netBeforeTax / (1 + vatRate / 100));
        grandTotal = netBeforeTax; // Total doesn't change, but we record VAT
    }

    const totalCost = totalItemCost + totalExtrasCost;
    const estimatedProfit = (grandTotal - vatAmount) - totalCost; // Profit excludes VAT

    // Tip Logic
    const tip = allowTip ? Math.max(0, amountPaid - grandTotal) : 0;
    const balance = Math.max(0, grandTotal - amountPaid); // Balance is 0 if overpaid (tip)

    const handleSave = async () => {
        if (!customerName || items.length === 0) {
            alert("Please fill in customer name and at least one item.");
            return;
        }

        if (!allowTip && amountPaid > grandTotal) {
            alert("Amount paid cannot exceed total. Enable 'Allow Tip' to override.");
            return;
        }

        setLoading(true);

        try {
            let finalCustomerId = selectedCustomerId;

            // 0. Auto-create Customer if not selected
            if (!finalCustomerId && customerName) {
                // Check if exists first (optional, but good practice to avoid duplicates if they just typed it)
                // For now, let's just create it if they didn't select from the dropdown.
                // Or better: Try to find one with exact name match?
                // Let's just create a new one to be safe, or the user would have selected it.

                const { data: newCustomer, error: createError } = await supabase
                    .from("customers")
                    .insert({
                        full_name: customerName,
                        phone: customerPhone,
                        address: deliveryAddress,
                        // We don't save order notes to customer notes automatically to keep it clean
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error("Error creating customer:", createError);
                    // We continue without linking if it fails, or throw?
                    // Let's continue but warn? Or just fail?
                    // If we fail, the order isn't saved.
                    // Let's throw to be safe.
                    throw new Error("Failed to save new customer details: " + createError.message);
                }

                if (newCustomer) {
                    finalCustomerId = newCustomer.id;
                }
            }

            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    customer_id: finalCustomerId, // Link to customer (existing or new)
                    created_at: new Date(orderDate).toISOString(),
                    delivery_date: new Date(deliveryDate).toISOString(),
                    notes: notes + (deliveryAddress ? `\nAddress: ${deliveryAddress}` : ""),
                    total_price: grandTotal,
                    total_cost: totalCost, // Save the estimated cost
                    profit: estimatedProfit + tip, // Profit includes tip!
                    amount_paid: amountPaid, // Save full amount paid
                    discount: discountAmount, // Save calculated discount
                    tip: tip, // Save tip
                    vat: vatAmount,
                    vat_type: vatType,
                    status: "Pending",
                    source: source,
                    payment_status: balance <= 0 ? "Paid" : amountPaid > 0 ? "Deposit" : "Unpaid"
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: order.id,
                recipe_id: item.recipe_id,
                filling_id: item.filling_id || null,
                size_inches: item.size,
                layers: item.layers,
                quantity: item.qty,
                item_price: item.price,
                custom_extras: extras // We attach the global extras to the first item or handle differently? 
                // Ideally, extras should be their own table or attached to the order.
                // For now, let's just save them in the first item's JSON or a separate field if schema allowed.
                // The schema has 'custom_extras' on order_items. We'll attach to the first one or split them.
                // Let's attach to the first item for simplicity of this version.
            }));

            // Hack: Attach all extras to the first item for now, or spread them if they are per-cake.
            // The user requirement says "extras/details". 
            // Let's just put the extras in the first item's jsonb for now.
            if (orderItems.length > 0) {
                orderItems[0].custom_extras = extras;
            }

            const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
            if (itemsError) throw itemsError;

            router.push(`/orders/${order.id}`);

        } catch (error: any) {
            alert("Error saving order: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-12 font-sans text-slate-800">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-[#E8ECE9] rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif text-[#B03050]">New Order</h1>
                        <p className="text-slate-400 font-medium">Create a new job ticket</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#B03050] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] transition-all disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {loading ? "Saving..." : "Save Order"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Customer & Details */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-400 mb-6 tracking-wider">
                            <User className="w-4 h-4" /> Customer Details
                        </h2>
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Order Source</label>
                                <select
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#B03050] transition-colors"
                                >
                                    <option value="Walk-in">Walk-in</option>
                                    <option value="Phone">Phone</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Website">Website</option>
                                </select>
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={e => {
                                        setCustomerName(e.target.value);
                                        setIsCustomerSearchOpen(true);
                                        setSelectedCustomerId(null); // Reset if typing manually
                                    }}
                                    onFocus={() => setIsCustomerSearchOpen(true)}
                                    className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#B03050] transition-colors placeholder:text-slate-300"
                                    placeholder="e.g. Chioma Adebayo"
                                />
                                {isCustomerSearchOpen && customerName.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8ECE9] rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                        {customers
                                            .filter(c => c.full_name.toLowerCase().includes(customerName.toLowerCase()))
                                            .map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => selectCustomer(c)}
                                                    className="w-full text-left px-4 py-3 hover:bg-[#FDFBF7] border-b border-[#E8ECE9] last:border-none transition-colors"
                                                >
                                                    <div className="font-bold text-slate-800">{c.full_name}</div>
                                                    <div className="text-xs text-slate-400">{c.phone}</div>
                                                </button>
                                            ))}
                                        <button
                                            onClick={() => setIsCustomerSearchOpen(false)}
                                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#B03050] hover:bg-pink-50 transition-colors"
                                        >
                                            + Use "{customerName}" (New)
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#B03050] transition-colors placeholder:text-slate-300"
                                    placeholder="080..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-400 mb-6 tracking-wider">
                            <Calendar className="w-4 h-4" /> Delivery Info
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Order Date (For Records)</label>
                                <input
                                    type="date"
                                    value={orderDate}
                                    onChange={e => setOrderDate(e.target.value)}
                                    className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#B03050] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Delivery Date & Time <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={deliveryDate}
                                    onChange={e => setDeliveryDate(e.target.value)}
                                    required
                                    className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#B03050] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Delivery Address</label>
                                <textarea
                                    value={deliveryAddress}
                                    onChange={e => setDeliveryAddress(e.target.value)}
                                    className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#B03050] transition-colors min-h-[80px] placeholder:text-slate-300"
                                    placeholder="Enter full address..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Notes / Special Instructions</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#B03050] transition-colors min-h-[80px] placeholder:text-slate-300"
                                    placeholder="Allergies, gate code, etc."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* MIDDLE & RIGHT: Order Items & Summary */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Items List */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-400 tracking-wider">
                                <Calculator className="w-4 h-4" /> Order Items
                            </h2>
                            <button onClick={addItem} className="text-xs font-bold bg-[#FDFBF7] border border-[#E8ECE9] hover:bg-[#E8ECE9] px-3 py-2 rounded-lg transition-colors flex items-center gap-1 text-slate-600">
                                <Plus className="w-3 h-3" /> Add Cake
                            </button>
                        </div>

                        {/* Recipe Search State */}
                        {items.map((item, idx) => (
                            <div key={item.id + '-search'}>
                                {item.showRecipeSearch && (
                                    <input
                                        autoFocus
                                        type="text"
                                        value={item.recipeSearch || ''}
                                        onChange={e => {
                                            const newItems = [...items];
                                            newItems[idx].recipeSearch = e.target.value;
                                            setItems(newItems);
                                        }}
                                        placeholder="Search recipes..."
                                        className="w-full mb-2 p-2 bg-white rounded-lg border border-[#E8ECE9] text-sm font-bold outline-none focus:border-[#B03050]"
                                        onBlur={() => {
                                            setTimeout(() => {
                                                const newItems = [...items];
                                                newItems[idx].showRecipeSearch = false;
                                                setItems(newItems);
                                            }, 200);
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                        <div className="space-y-6">
                            {items.map((item, idx) => (
                                <div key={item.id} className="p-4 border border-[#E8ECE9] rounded-2xl bg-[#FDFBF7] relative group transition-all hover:shadow-sm">
                                    <button
                                        onClick={() => removeItem(idx)}
                                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Flavor (Recipe)</label>
                                            <div className="relative">
                                                <select
                                                    value={item.recipe_id}
                                                    onChange={e => updateItem(idx, 'recipe_id', e.target.value)}
                                                    className="w-full p-2 bg-white rounded-lg border border-[#E8ECE9] text-sm font-bold outline-none focus:border-[#B03050]"
                                                    onFocus={() => {
                                                        const newItems = [...items];
                                                        newItems[idx].showRecipeSearch = true;
                                                        setItems(newItems);
                                                    }}
                                                >
                                                    <option value="">{recipes.length === 0 ? 'No recipes found' : 'Select Recipe...'}</option>
                                                    {(() => {
                                                        // Filter recipes by size and search
                                                        const sizeStr = String(item.size);
                                                        const sizePatterns = [
                                                            new RegExp(`\\b${sizeStr}\\b`),
                                                            new RegExp(`\\b${sizeStr}\\"`),
                                                            new RegExp(`\\b${sizeStr} ?(in|inch|inches)\\b`, 'i')
                                                        ];
                                                        let filtered = recipes.filter(r => {
                                                            if (typeof r.size !== 'undefined' && r.size === item.size) return true;
                                                            if (typeof r.name === 'string') {
                                                                return sizePatterns.some(pat => pat.test(r.name));
                                                            }
                                                            return false;
                                                        });
                                                        if (filtered.length === 0) filtered = recipes;
                                                        // Apply search filter if present
                                                        const search = item.recipeSearch ? item.recipeSearch.toLowerCase() : '';
                                                        if (search) {
                                                            filtered = filtered.filter(r => r.name && r.name.toLowerCase().includes(search));
                                                        }
                                                        return filtered
                                                            .sort((a, b) => a.name.localeCompare(b.name))
                                                            .map(r => <option key={r.id} value={r.id}>{r.name}</option>);
                                                    })()}
                                                    {recipes.length === 0 && <option disabled>No recipes available</option>}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Filling</label>
                                            <select
                                                value={item.filling_id}
                                                onChange={e => updateItem(idx, 'filling_id', e.target.value)}
                                                className="w-full p-2 bg-white rounded-lg border border-[#E8ECE9] text-sm font-bold outline-none focus:border-[#B03050]"
                                            >
                                                <option value="">{fillings.length === 0 ? 'No fillings found' : 'None'}</option>
                                                {fillings.sort((a, b) => a.name.localeCompare(b.name)).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                {fillings.length === 0 && <option disabled>No fillings available</option>}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Size (Inches)</label>
                                            <select
                                                value={item.size}
                                                onChange={e => updateItem(idx, 'size', Number(e.target.value))}
                                                className="w-full p-2 bg-white rounded-lg border border-[#E8ECE9] text-sm font-bold outline-none focus:border-[#B03050]"
                                            >
                                                {[4, 5, 6, 7, 8, 9, 10, 12, 14].map(s => (
                                                    <option key={s} value={s}>{s}"</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Layers</label>
                                            <select
                                                value={item.layers[0] || ""}
                                                onChange={e => updateItem(idx, 'layers', [e.target.value])}
                                                className="w-full p-2 bg-white rounded-lg border border-[#E8ECE9] text-sm font-bold outline-none focus:border-[#B03050]"
                                            >
                                                <option value="">Select Layer...</option>
                                                {(() => {
                                                    const recipe = recipes.find(r => r.id === item.recipe_id);
                                                    if (recipe && recipe.prices && typeof recipe.prices === 'object') {
                                                        return Object.keys(recipe.prices).map(l => (
                                                            <option key={l} value={l}>{l} Layer ({recipe.prices[l]}₦)</option>
                                                        ));
                                                    }
                                                    return [1,2,3,4].map(l => <option key={l} value={l}>{l} Layer</option>);
                                                })()}
                                                {recipes.length === 0 && <option disabled>No layers available</option>}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                                                className="w-full p-2 bg-white rounded-lg border border-[#E8ECE9] text-sm font-bold outline-none focus:border-[#B03050]"
                                                min={1}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-green-600 mb-1">Price (Each)</label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-2 text-green-600 font-bold text-xs">₦</span>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                                                    className="w-full p-2 pl-6 bg-green-50 border border-green-100 rounded-lg text-sm font-black text-green-700 outline-none focus:border-green-300"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Extras & Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Extras */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                            <h2 className="text-sm font-bold uppercase text-slate-400 mb-4 tracking-wider">Add-ons & Extras</h2>

                            <div className="flex gap-2 mb-4">
                                <input
                                    placeholder="Item (e.g. Topper)"
                                    className="flex-1 p-2 bg-[#FDFBF7] border border-[#E8ECE9] rounded-lg text-xs font-medium outline-none focus:border-[#B03050]"
                                    value={extraName}
                                    onChange={e => setExtraName(e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Price"
                                    className="w-20 p-2 bg-[#FDFBF7] border border-[#E8ECE9] rounded-lg text-xs font-medium outline-none focus:border-[#B03050]"
                                    value={extraPrice || ''}
                                    onChange={e => setExtraPrice(Number(e.target.value))}
                                />
                                <button onClick={addExtra} className="bg-slate-800 text-white px-3 rounded-lg text-lg font-bold hover:bg-slate-700 transition-colors">+</button>
                            </div>

                            <div className="space-y-2">
                                {extras.map((ex, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-[#FDFBF7] rounded-lg group border border-[#E8ECE9]">
                                        <span>{ex.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold">₦{ex.price.toLocaleString()}</span>
                                            <button onClick={() => removeExtra(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {extras.length === 0 && <p className="text-xs text-slate-300 italic text-center py-2">No extras added</p>}
                            </div>
                        </div>

                        {/* Grand Total */}
                        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-between shadow-xl">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Total Order Value</p>
                                <h3 className="text-4xl font-serif text-[#D4AF37]">₦{grandTotal.toLocaleString()}</h3>
                            </div>

                            <div className="mt-6 space-y-2 text-sm text-slate-400">
                                <div className="flex justify-between">
                                    <span>Items Subtotal</span>
                                    <span>₦{subTotal.toLocaleString()}</span>
                                </div>

                                {/* Discount Input */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span>Discount</span>
                                        <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
                                            <button
                                                onClick={() => setDiscountType('fixed')}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${discountType === 'fixed' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                ₦
                                            </button>
                                            <button
                                                onClick={() => setDiscountType('percent')}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${discountType === 'percent' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                %
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-slate-500">-{discountType === 'fixed' ? '₦' : ''}</span>
                                        <input
                                            type="number"
                                            value={discountValue || ''}
                                            onChange={e => setDiscountValue(Number(e.target.value))}
                                            className="w-20 p-1 bg-slate-800 border border-slate-700 rounded text-right text-white text-xs outline-none focus:border-slate-500"
                                            placeholder="0"
                                        />
                                        {discountType === 'percent' && <span className="text-slate-500">%</span>}
                                    </div>
                                </div>
                                {discountType === 'percent' && discountValue > 0 && (
                                    <div className="flex justify-end text-[10px] text-slate-500 -mt-1 mb-1">
                                        (-₦{discountAmount.toLocaleString()})
                                    </div>
                                )}

                                {/* VAT Input */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span>VAT</span>
                                        <select
                                            value={vatType}
                                            onChange={e => setVatType(e.target.value as any)}
                                            className="bg-slate-800 text-[10px] p-1 rounded border border-slate-700 text-slate-300 outline-none focus:border-slate-500"
                                        >
                                            <option value="none">None</option>
                                            <option value="inclusive">Inclusive (Subtract)</option>
                                            <option value="exclusive">Exclusive (Add)</option>
                                        </select>
                                    </div>
                                    {vatType !== 'none' && (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={vatRate}
                                                onChange={e => setVatRate(Number(e.target.value))}
                                                className="w-10 p-1 bg-slate-800 border border-slate-700 rounded text-right text-white text-xs outline-none focus:border-slate-500"
                                            />
                                            <span className="text-slate-500 text-[10px]">%</span>
                                        </div>
                                    )}
                                </div>
                                {vatType !== 'none' && (
                                    <div className="flex justify-end text-[10px] text-slate-500 -mt-1 mb-1">
                                        {vatType === 'exclusive' ? '+' : ''}₦{vatAmount.toLocaleString()}
                                    </div>
                                )}

                                {/* Payment Input */}
                                <div className="pt-4 mt-2 border-t border-slate-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold uppercase text-slate-400">Amount Paid</label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={allowTip}
                                                onChange={e => setAllowTip(e.target.checked)}
                                                className="w-3 h-3 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500 focus:ring-offset-slate-900"
                                            />
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Allow Tip</span>
                                        </label>
                                    </div>
                                    <input
                                        type="number"
                                        value={amountPaid || ''}
                                        onChange={e => setAmountPaid(Number(e.target.value))}
                                        className={`w-full p-2 bg-slate-800 border rounded-lg text-white font-bold outline-none ${amountPaid > grandTotal
                                            ? (allowTip ? 'border-green-500 focus:ring-green-500' : 'border-red-500 focus:ring-red-500')
                                            : 'border-slate-700 focus:border-slate-500'
                                            }`}
                                    />
                                    {amountPaid > grandTotal && (
                                        allowTip ? (
                                            <div className="flex justify-between items-center mt-1 text-green-400 text-xs font-bold">
                                                <span>Tip Added:</span>
                                                <span>+₦{(amountPaid - grandTotal).toLocaleString()}</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-red-400 mt-1 font-bold">Error: Amount exceeds total. Enable tip to allow.</p>
                                        )
                                    )}
                                </div>
                                <div className="flex justify-between text-[#B03050] font-bold pt-2">
                                    <span>Balance Due</span>
                                    <span>₦{balance.toLocaleString()}</span>
                                </div>

                                {/* Live Profit Indicator (Admin Only) */}
                                <div className="pt-4 mt-2 border-t border-slate-700 text-xs">
                                    <div className="flex justify-between">
                                        <span>Est. Cost</span>
                                        <span>₦{totalCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-green-400 font-bold">
                                        <span>Est. Profit</span>
                                        <span>₦{estimatedProfit.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Margin</span>
                                        <span>{grandTotal - vatAmount > 0 ? ((estimatedProfit / (grandTotal - vatAmount)) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
