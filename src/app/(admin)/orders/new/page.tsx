"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { SIZE_MULTIPLIERS } from "@/lib/constants/bakery";
import { ArrowLeft, Plus, Trash2, Save, ShoppingBag, Search, X, Receipt, CheckCircle, ArrowRight, User, Calendar, Sparkles, Phone } from "lucide-react";

export default function NewOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

    // --- DATA SOURCES ---
    const [cakeRecipes, setCakeRecipes] = useState<any[]>([]); // Only Cakes from recipes table
    const [dessertItems, setDessertItems] = useState<any[]>([]); // From desserts table
    const [fillings, setFillings] = useState<any[]>([]);
    const [inventoryExtras, setInventoryExtras] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    // --- CUSTOMER STATE ---
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    // --- ORDER DETAILS ---
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(11, 0, 0, 0);
        return tomorrow.toISOString().slice(0, 16);
    });

    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [source, setSource] = useState("Walk-in");

    // --- ORDER ITEMS ---
    const defaultItem = {
        id: Date.now(),
        type: 'Cake',
        recipe_id: "",
        dessert_id: "",
        fillings: [], // Array of filling IDs
        size: 8,
        layers: 1,
        qty: 1,
        price: 0,
        cost: 0,
        filling_prices: [],
        showSearch: false,
        searchText: ""
    };

    const [items, setItems] = useState<any[]>([defaultItem]);

    // --- FINANCIALS ---
    const [extras, setExtras] = useState<any[]>([]);
    const [extraName, setExtraName] = useState("");
    const [extraPrice, setExtraPrice] = useState(0);
    const [extraCost, setExtraCost] = useState(0); // Track cost for custom extras

    const [amountPaid, setAmountPaid] = useState(0);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
    const [vatType, setVatType] = useState<'none' | 'inclusive' | 'exclusive'>('none');
    const [vatRate, setVatRate] = useState(7.5);

    // --- INITIAL FETCH ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch CAKES from Recipes
                const { data: r } = await supabase
                    .from("recipes")
                    .select(`*, recipe_ingredients(amount_grams_ml, ingredients(purchase_price, purchase_quantity))`)
                    .eq('category', 'Cake');

                // 2. Fetch DESSERTS from Desserts Table
                const { data: d } = await supabase
                    .from("desserts")
                    .select("*")
                    .order('name');

                // 3. Fetch Fillings
                const { data: f } = await supabase.from("fillings").select("*");

                // 4. Fetch Customers
                const { data: c } = await supabase.from("customers").select("*").order("full_name");

                // 5. Fetch Inventory Extras
                const { data: e } = await supabase
                    .from("ingredients")
                    .select("*")
                    .in("category", ["Topper", "Decoration", "Balloon", "Extra"])
                    .order("category")
                    .order("name");

                if (r) setCakeRecipes(r);
                if (d) setDessertItems(d);
                if (f) setFillings(f);
                if (c) setCustomers(c);
                if (e) setInventoryExtras(e);
            } catch (err) {
                console.error("Error fetching data", err);
            }
        };
        fetchData();
    }, []);

    // --- HELPER: Reset Form ---
    const resetForm = () => {
        setSuccessOrderId(null);
        setCustomerName("");
        setCustomerPhone("");
        setSelectedCustomerId(null);
        setDeliveryAddress("");
        setNotes("");
        setItems([{ ...defaultItem, id: Date.now() }]);
        setExtras([]);
        setAmountPaid(0);
        setDiscountValue(0);
        setLoading(false);
    };

    // --- HELPER: Customer Selection ---
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

    // --- HELPER: Handle Phone Input Logic ---
    const handlePhoneChange = (phone: string) => {
        setCustomerPhone(phone);
        const match = customers.find(c => c.phone === phone);
        if (match) selectCustomer(match);
    };

    // --- HELPER: Filter Lists ---
    const getOptionsList = (item: any) => {
        if (item.type === 'Cake') {
            return cakeRecipes.filter(r => {
                if (r.size && String(r.size) !== String(item.size)) return false;
                if (item.showSearch && item.searchText) {
                    return r.name.toLowerCase().includes(item.searchText.toLowerCase());
                }
                return true;
            }).sort((a, b) => a.name.localeCompare(b.name));
        } else {
            return dessertItems.filter(d => {
                if (item.showSearch && item.searchText) {
                    return d.name.toLowerCase().includes(item.searchText.toLowerCase());
                }
                return true;
            }).map(d => ({
                ...d,
                price: d.selling_price != null ? Number(d.selling_price) : 0
            })).sort((a, b) => a.name.localeCompare(b.name));
        }
    };

    // --- HELPER: Price & Cost Calculation ---
    const calculateItemPrice = (item: any) => {
        let estimatedPrice = 0;
        let estimatedCost = 0;

        if (item.type === 'Cake') {
            const recipe = cakeRecipes.find(r => r.id === item.recipe_id);
            if (!recipe) return item;

            // 1. Calculate Recipe Ingredient Cost
            let recipeIngredientCost = 0;
            if (recipe.recipe_ingredients) {
                recipeIngredientCost = recipe.recipe_ingredients.reduce((acc: number, curr: any) => {
                    if (!curr.ingredients) return acc;
                    const pricePerUnit = curr.ingredients.purchase_price / curr.ingredients.purchase_quantity;
                    return acc + (curr.amount_grams_ml * pricePerUnit);
                }, 0);
            }

            const sizeMult = SIZE_MULTIPLIERS[item.size] || 1;
            const totalLayers = item.layers || 1;

            // Add Cake Cost (Ingredients * Size * Layers)
            estimatedCost += (recipeIngredientCost * sizeMult * totalLayers);

            // 2. Calculate Fillings Price AND Cost
            let fillingPrices: number[] = [];
            let fillingCosts: number[] = [];

            if (item.fillings && Array.isArray(item.fillings)) {
                item.fillings.forEach((fid: string) => {
                    const filling = fillings.find(f => f.id === fid);
                    if (filling) {
                        fillingPrices.push(Number(filling.price || 0));
                        fillingCosts.push(Number(filling.cost || 0));
                    }
                });

                // Add Filling Price (Flat addition as per business rule, or change to scaled if needed)
                estimatedPrice += fillingPrices.reduce((a, b) => a + b, 0);

                // Add Filling Cost (SCALED by size, as larger cakes use more filling)
                // This ensures filling cost is captured in the item cost
                const totalFillingCost = fillingCosts.reduce((a, b) => a + b, 0);
                estimatedCost += (totalFillingCost * sizeMult);
            }

            // 3. Calculate Base Selling Price
            if (recipe.prices && recipe.prices[totalLayers] > 0) {
                estimatedPrice += recipe.prices[totalLayers] * sizeMult;
            } else if (recipe.selling_price > 0) {
                estimatedPrice += recipe.selling_price * sizeMult * totalLayers;
            } else {
                // Fallback: 3x Cost (Note: This fallback now includes filling cost in the base if used here)
                estimatedPrice += (estimatedCost * 3);
            }

            estimatedPrice = Math.ceil(estimatedPrice / 100) * 100;
            return { ...item, price: estimatedPrice, cost: estimatedCost, filling_prices: fillingPrices };
        } else {
            // DESSERT Logic
            const dessert = dessertItems.find(d => d.id === item.dessert_id);
            if (!dessert) return item;

            estimatedPrice = Number(dessert.selling_price || 0);
            estimatedCost = Number(dessert.cost || 0);

            return { ...item, price: estimatedPrice, cost: estimatedCost };
        }
    };

    // --- HANDLERS ---
    const addItem = (type: 'Cake' | 'Dessert') => {
        setItems([...items, { ...defaultItem, id: Date.now(), type, size: type === 'Cake' ? 8 : 0, layers: type === 'Cake' ? 1 : 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        let item = { ...newItems[index] };

        if (field === 'fillings') {
            item.fillings = value;
        } else {
            item[field] = value;
        }

        if (field === 'type' && value === 'Cake') {
            item.size = 8;
            item.layers = 1;
        }

        if (['recipe_id', 'dessert_id', 'fillings', 'size', 'layers'].includes(field)) {
            item = calculateItemPrice(item);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const toggleSearch = (index: number) => {
        const newItems = [...items];
        newItems[index].showSearch = !newItems[index].showSearch;
        if (!newItems[index].showSearch) newItems[index].searchText = "";
        setItems(newItems);
    };

    // --- EXTRAS HANDLERS ---
    const addExtra = () => {
        if (!extraName) return;
        setExtras([...extras, {
            name: extraName,
            price: Number(extraPrice),
            cost: Number(extraCost), // Custom cost
            inventory_id: null
        }]);
        setExtraName("");
        setExtraPrice(0);
        setExtraCost(0);
    };

    const handleInventoryExtraSelect = (extraId: string) => {
        const item = inventoryExtras.find(t => t.id === extraId);
        if (item) {
            setExtras([...extras, {
                name: item.name,
                price: Number(item.purchase_price || 0),
                cost: Number(item.purchase_price || 0), // Use purchase price as cost
                inventory_id: item.id
            }]);
        }
    };

    const removeExtra = (index: number) => {
        setExtras(extras.filter((_, i) => i !== index));
    };

    // --- CALCULATIONS ---
    const totalItemPrice = items.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);
    const totalExtrasPrice = extras.reduce((acc, ex) => acc + ex.price, 0);

    // Total Cost Calculation (Ingredients + Fillings + Extras)
    const totalItemCost = items.reduce((acc, item) => acc + (Number(item.cost) * item.qty), 0);
    const totalExtrasCost = extras.reduce((acc, ex) => acc + (ex.cost || 0), 0);
    const totalOrderCost = totalItemCost + totalExtrasCost;

    const subTotal = totalItemPrice + totalExtrasPrice;
    const discountAmount = discountType === 'percent' ? (subTotal * (discountValue || 0) / 100) : (discountValue || 0);
    const netBeforeTax = Math.max(0, subTotal - discountAmount);

    let vatAmount = 0;
    let grandTotal = netBeforeTax;

    if (vatType === 'exclusive') {
        vatAmount = netBeforeTax * (vatRate / 100);
        grandTotal = netBeforeTax + vatAmount;
    } else if (vatType === 'inclusive') {
        vatAmount = netBeforeTax - (netBeforeTax / (1 + vatRate / 100));
        grandTotal = netBeforeTax;
    }

    // Profit = Revenue (Net of VAT) - Total Cost
    const estimatedProfit = (grandTotal - vatAmount) - totalOrderCost;

    // --- SAVE LOGIC ---
    const handleSave = async () => {
        if (!customerName || (!customerPhone && !selectedCustomerId) || items.length === 0) {
            alert("Please provide customer name, phone number, and at least one item.");
            return;
        }

        setLoading(true);
        try {
            let finalCustomerId = selectedCustomerId;

            if (!finalCustomerId && customerPhone) {
                const { data: existingCustomer } = await supabase.from("customers").select("id").eq("phone", customerPhone).maybeSingle();
                if (existingCustomer) {
                    finalCustomerId = existingCustomer.id;
                } else {
                    const { data: newCustomer, error: createError } = await supabase.from("customers").insert({ full_name: customerName, phone: customerPhone, address: deliveryAddress }).select().single();
                    if (createError) throw createError;
                    finalCustomerId = newCustomer.id;
                }
            }

            const { data: order, error: orderError } = await supabase.from("orders").insert({
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_id: finalCustomerId,
                created_at: new Date(orderDate).toISOString(),
                delivery_date: new Date(deliveryDate).toISOString(),
                notes: notes + (deliveryAddress ? `\nAddress: ${deliveryAddress}` : ""),
                total_price: grandTotal,
                total_cost: totalOrderCost,
                profit: estimatedProfit,
                amount_paid: amountPaid,
                discount: discountAmount,
                vat: vatAmount,
                vat_type: vatType,
                status: "Pending",
                source: source,
                payment_status: amountPaid >= grandTotal ? "Paid" : amountPaid > 0 ? "Deposit" : "Unpaid"
            }).select().single();

            if (orderError) throw orderError;

            // Prepare Items
            const orderItemsData = items.map((item, idx) => ({
                order_id: order.id,
                recipe_id: item.type === 'Cake' ? item.recipe_id : null,
                dessert_id: item.type === 'Dessert' ? item.dessert_id : null,
                size_inches: item.type === 'Cake' ? item.size : 0,
                layers: item.type === 'Cake' ? item.layers : 1,
                quantity: item.qty,
                item_price: item.price,
                item_cost: item.cost, // <--- CRITICAL FIX: Save the calculated item cost (includes filling cost)
                fillings: item.fillings,
                // Attach extras to the first item only
                custom_extras: (idx === 0 && extras.length > 0) ? { addons: extras } : null
            }));

            const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData);
            if (itemsError) throw itemsError;

            setSuccessOrderId(order.id);

        } catch (error: any) {
            alert("Error saving order: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const groupedExtras = {
        'Topper': inventoryExtras.filter(e => e.category === 'Topper'),
        'Decoration': inventoryExtras.filter(e => e.category === 'Decoration'),
        'Balloon': inventoryExtras.filter(e => e.category === 'Balloon'),
        'Extra': inventoryExtras.filter(e => e.category === 'Extra'),
    };

    // --- SUCCESS VIEW ---
    if (successOrderId) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
                <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-[#E8ECE9] text-center max-w-lg w-full animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-serif text-slate-800 mb-2">Order Created!</h1>
                    <p className="text-slate-500 mb-8">The order has been successfully saved to the database.</p>

                    <div className="space-y-3">
                        <button
                            onClick={() => router.push(`/orders/${successOrderId}`)}
                            className="w-full py-4 bg-[#B03050] text-white rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] transition-all flex items-center justify-center gap-2"
                        >
                            View Order Details <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={resetForm}
                            className="w-full py-4 bg-white text-slate-600 border-2 border-slate-100 rounded-xl font-bold hover:bg-slate-50 transition-all"
                        >
                            Create Another Order
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- FORM VIEW ---
    return (
        <div className="min-h-screen bg-[#FDFBF7] p-4 sm:p-6 md:p-8 font-sans">
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
                    className="flex items-center gap-1 bg-[#B03050] text-white px-4 py-2 rounded-lg font-bold shadow-md shadow-pink-100 hover:bg-[#902040] transition-all text-sm disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : "Save Order"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {/* LEFT COLUMN: Customer & Details */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-6 tracking-wider">
                            <User className="w-4 h-4" /> Customer Details
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Source</label>
                                <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 outline-none text-sm">
                                    <option>Walk-in</option><option>Phone</option><option>WhatsApp</option><option>Instagram</option><option>Website</option>
                                </select>
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={e => { setCustomerName(e.target.value); setIsCustomerSearchOpen(true); }}
                                    onFocus={() => setIsCustomerSearchOpen(true)}
                                    className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 outline-none focus:border-[#B03050] text-sm"
                                    placeholder="Search Name or Phone..."
                                />
                                {isCustomerSearchOpen && customerName.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8ECE9] rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                        {customers.filter(c =>
                                            c.full_name.toLowerCase().includes(customerName.toLowerCase()) ||
                                            (c.phone && c.phone.includes(customerName))
                                        ).map(c => (
                                            <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left px-4 py-3 hover:bg-[#FDFBF7] border-b border-[#E8ECE9]">
                                                <div className="font-bold text-slate-800 text-sm">{c.full_name}</div>
                                                <div className="text-xs text-slate-400">{c.phone}</div>
                                            </button>
                                        ))}
                                        <button onClick={() => setIsCustomerSearchOpen(false)} className="w-full text-left px-4 py-2 text-xs font-bold text-[#B03050] hover:bg-pink-50">
                                            + Use "{customerName}"
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={e => handlePhoneChange(e.target.value)}
                                    className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 outline-none text-sm"
                                    placeholder="080..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-6 tracking-wider">
                            <Calendar className="w-4 h-4" /> Delivery Info
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Order Date (For Record)</label>
                                <input
                                    type="date"
                                    value={orderDate}
                                    onChange={e => setOrderDate(e.target.value)}
                                    className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 outline-none focus:border-[#B03050] transition-colors text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Due Date & Time</label>
                                <input type="datetime-local" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                                <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 outline-none min-h-[80px] text-sm" placeholder="Pickup or Address..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-[#FDFBF7] border border-[#E8ECE9] rounded-xl font-medium text-slate-800 outline-none min-h-[80px] text-sm" placeholder="Flavor notes, allergies..." />
                            </div>
                        </div>
                    </div>
                </div>

                {/* MIDDLE & RIGHT: Order Items & Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 tracking-wider">
                                <ShoppingBag className="w-4 h-4" /> Order Items
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => addItem('Dessert')} className="text-xs font-bold bg-pink-50 border border-pink-100 hover:bg-pink-100 text-[#B03050] px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Dessert
                                </button>
                                <button onClick={() => addItem('Cake')} className="text-xs font-bold bg-[#B03050] text-white hover:bg-[#902040] px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Cake
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, idx) => (
                                <div key={item.id} className="p-4 border border-[#E8ECE9] rounded-2xl bg-[#FDFBF7] relative group transition-all hover:shadow-sm">
                                    <button onClick={() => removeItem(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors z-10">
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="mb-2 flex items-center justify-between pr-8">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${item.type === 'Cake' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {item.type}
                                        </span>
                                    </div>

                                    {/* SEARCH BAR */}
                                    {item.showSearch && (
                                        <div className="mb-3 animate-in fade-in slide-in-from-top-1">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={item.searchText || ''}
                                                    onChange={e => {
                                                        const newItems = [...items];
                                                        newItems[idx].searchText = e.target.value;
                                                        setItems(newItems);
                                                    }}
                                                    placeholder="Filter list..."
                                                    className="flex-1 p-2 bg-white rounded-lg border border-[#B03050] text-sm font-medium outline-none ring-2 ring-pink-100"
                                                />
                                                <button onClick={() => toggleSearch(idx)} className="p-2 bg-slate-200 rounded-lg hover:bg-slate-300 text-slate-600">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                                        {/* PRODUCT SELECTOR */}
                                        <div className="md:col-span-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-xs font-bold uppercase text-slate-400">
                                                    {item.type === 'Cake' ? 'Cake Flavor' : 'Dessert Item'}
                                                </label>
                                                <button onClick={() => toggleSearch(idx)} className="text-[10px] font-bold text-[#B03050] flex items-center gap-1 hover:underline">
                                                    <Search className="w-3 h-3" /> {item.showSearch ? "Close" : "Filter"}
                                                </button>
                                            </div>
                                            <select
                                                value={item.type === 'Cake' ? item.recipe_id : item.dessert_id}
                                                onChange={e => updateItem(idx, item.type === 'Cake' ? 'recipe_id' : 'dessert_id', e.target.value)}
                                                className="w-full p-2 bg-white rounded-lg border border-[#E8ECE9] text-sm font-medium outline-none focus:border-[#B03050]"
                                            >
                                                <option value="">Select...</option>
                                                {getOptionsList(item).map(opt => (
                                                    <option key={opt.id} value={opt.id}>
                                                        {opt.name} {item.type === 'Cake' ? `(${opt.size}")` : `(₦${opt.price?.toLocaleString?.() ?? 0})`}
                                                    </option>
                                                ))}
                                                {getOptionsList(item).length === 0 && <option disabled>No matching items found</option>}
                                            </select>
                                        </div>

                                        {/* CAKE SPECIFIC: FILLING (CHECKBOX LIST) */}
                                        {item.type === 'Cake' && (
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Fillings</label>
                                                <div className="max-h-24 overflow-y-auto border border-[#E8ECE9] rounded-lg p-2 bg-white">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {fillings.map(f => {
                                                            const checked = item.fillings?.includes(f.id);
                                                            return (
                                                                <label key={f.id} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${checked ? 'bg-green-50 text-green-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        className="rounded border-slate-300 text-[#B03050] focus:ring-[#B03050]"
                                                                        onChange={e => {
                                                                            let newFillings = Array.isArray(item.fillings) ? [...item.fillings] : [];
                                                                            if (e.target.checked) {
                                                                                newFillings.push(f.id);
                                                                            } else {
                                                                                newFillings = newFillings.filter(fid => fid !== f.id);
                                                                            }
                                                                            updateItem(idx, 'fillings', newFillings);
                                                                        }}
                                                                    />
                                                                    <span className="truncate">{f.name}</span>
                                                                    {f.price > 0 && <span className="text-[10px] text-green-600 ml-auto">+₦{f.price}</span>}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* CAKE SPECIFIC: SIZE & LAYERS */}
                                        {item.type === 'Cake' ? (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Size (Inches)</label>
                                                    <select
                                                        value={item.size}
                                                        onChange={e => updateItem(idx, 'size', Number(e.target.value))}
                                                        className="w-full p-2 bg-white rounded-lg border border-[#E8ECE9] text-sm font-medium outline-none"
                                                    >
                                                        {[4, 5, 6, 7, 8, 9, 10, 12, 14].map(s => <option key={s} value={s}>{s}"</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Layers</label>
                                                    <select value={item.layers} onChange={e => updateItem(idx, 'layers', Number(e.target.value))} className="w-full p-2 bg-white rounded-lg border border-[#E8ECE9] text-sm font-medium outline-none">
                                                        {[1, 2, 3, 4].map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="col-span-2 hidden md:block"></div>
                                        )}

                                        {/* COMMON: QUANTITY & PRICE */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                                                min={1}
                                                className="w-full p-2 bg-white rounded-lg border border-[#E8ECE9] text-sm font-medium outline-none focus:border-[#B03050]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-green-600 mb-1">Price (Each)</label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-2 text-green-600 font-bold text-xs">₦</span>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                                                    className="w-full p-2 pl-6 bg-green-50 border border-green-100 rounded-lg text-sm font-bold text-green-700 outline-none focus:border-green-300"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Extras */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                            <h2 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-wider">Add-ons & Extras</h2>

                            {/* Inventory Extras Dropdown */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Select from Inventory</label>
                                <select
                                    className="w-full p-2 bg-[#FDFBF7] border border-[#E8ECE9] rounded-lg text-sm font-medium outline-none focus:border-[#B03050]"
                                    onChange={(e) => {
                                        if (e.target.value) handleInventoryExtraSelect(e.target.value);
                                        e.target.value = "";
                                    }}
                                >
                                    <option value="">+ Add Topper, Balloon, etc...</option>
                                    {Object.keys(groupedExtras).map(key => {
                                        const group = groupedExtras[key as keyof typeof groupedExtras];
                                        if (group.length === 0) return null;
                                        return (
                                            <optgroup key={key} label={`--- ${key}s ---`}>
                                                {group.map(t => <option key={t.id} value={t.id}>{t.name} (₦{t.purchase_price})</option>)}
                                            </optgroup>
                                        )
                                    })}
                                </select>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <input placeholder="Custom Extra (e.g. Delivery)" value={extraName} onChange={e => setExtraName(e.target.value)} className="flex-1 p-2 bg-[#FDFBF7] border border-[#E8ECE9] rounded-lg text-sm font-medium outline-none focus:border-[#B03050]" />
                                <input type="number" placeholder="Price" value={extraPrice || ''} onChange={e => setExtraPrice(Number(e.target.value))} className="w-20 p-2 bg-[#FDFBF7] border border-[#E8ECE9] rounded-lg text-sm font-medium outline-none focus:border-[#B03050]" />
                                <button onClick={addExtra} className="bg-slate-800 text-white px-3 rounded-lg text-lg font-bold hover:bg-slate-700">+</button>
                            </div>
                            <div className="space-y-2">
                                {extras.map((ex, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-[#FDFBF7] rounded-lg border border-[#E8ECE9]">
                                        <span>{ex.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold">₦{ex.price.toLocaleString()}</span>
                                            <button onClick={() => removeExtra(i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grand Total */}
                        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-between shadow-xl">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Total Order Value</p>
                                <h3 className="text-4xl font-serif text-[#D4AF37]">₦{grandTotal.toLocaleString()}</h3>
                                {/* Discrete Profit Margin Indicator */}
                                <div className="text-[10px] text-slate-600 mt-1 font-mono">
                                    PM: ₦{estimatedProfit.toLocaleString()}
                                </div>
                            </div>

                            {/* Itemized Breakdown (Receipt Style) */}
                            <div className="mt-4 bg-slate-800/50 rounded-lg p-3 max-h-40 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-1 text-[10px] uppercase text-slate-500 font-bold mb-2">
                                    <Receipt className="w-3 h-3" /> Breakdown
                                </div>
                                <div className="space-y-2">
                                    {[...items.filter(i => i.type === 'Dessert'), ...items.filter(i => i.type === 'Cake')].map((item, idx) => {
                                        let name = "Unknown";
                                        let desc = "";
                                        if (item.type === 'Cake') {
                                            name = cakeRecipes.find(r => r.id === item.recipe_id)?.name || 'Cake';
                                            desc = `(${item.size}" · ${item.layers} Layers)`;
                                        } else {
                                            name = dessertItems.find(d => d.id === item.dessert_id)?.name || 'Dessert';
                                        }
                                        return (
                                            <div key={item.id} className="text-xs text-slate-300 border-b border-slate-700/50 pb-2 last:border-0 last:pb-0">
                                                <div className="flex justify-between">
                                                    <span className="truncate pr-2 font-bold text-white">{item.qty}x {name} {desc}</span>
                                                    <span>₦{(item.price * item.qty).toLocaleString()}</span>
                                                </div>
                                                {/* Fillings Display in Breakdown */}
                                                {item.type === 'Cake' && item.fillings && item.fillings.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1 pl-2">
                                                        {item.fillings.map((fid: string) => {
                                                            const f = fillings.find(fil => fil.id === fid);
                                                            if (!f) return null;
                                                            return (
                                                                <span key={fid} className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded">
                                                                    + {f.name}
                                                                </span>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {extras.map((ex, idx) => (
                                        <div key={`ex-${idx}`} className="flex justify-between text-xs text-slate-300 border-b border-slate-700/50 pb-2 last:border-0 last:pb-0">
                                            <span className="truncate pr-2">+ {ex.name}</span>
                                            <span>₦{ex.price.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-400">
                                <div className="flex justify-between border-t border-slate-700 pt-2">
                                    <span>Subtotal</span><span>₦{subTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span>Discount</span>
                                        <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
                                            <button onClick={() => setDiscountType('fixed')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${discountType === 'fixed' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>₦</button>
                                            <button onClick={() => setDiscountType('percent')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${discountType === 'percent' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>%</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-slate-500">-</span>
                                        <input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className="w-16 p-1 bg-slate-800 border border-slate-700 rounded text-right text-white text-xs outline-none" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span>VAT</span>
                                        <select value={vatType} onChange={e => setVatType(e.target.value as any)} className="bg-slate-800 text-[10px] p-1 rounded border border-slate-700 text-slate-300 outline-none">
                                            <option value="none">None</option><option value="inclusive">Inclusive</option><option value="exclusive">Exclusive</option>
                                        </select>
                                    </div>
                                    {vatType !== 'none' && <div className="text-right text-[10px] text-slate-500">₦{vatAmount.toLocaleString()}</div>}
                                </div>
                                <div className="pt-4 mt-2 border-t border-slate-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold uppercase text-slate-400">Amount Paid</label>
                                        <input type="number" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} className="w-24 p-1 bg-slate-800 border border-slate-700 rounded text-right text-white text-xs outline-none focus:border-slate-500" />
                                    </div>
                                    <div className="flex justify-end text-xs font-bold text-[#D4AF37]">
                                        {amountPaid > 0 && <span>Balance: ₦{Math.max(0, grandTotal - amountPaid).toLocaleString()}</span>}
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