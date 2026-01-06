"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Clock, ShoppingBag, AlertTriangle, Flame, DollarSign, Trash2, Edit, Plus, Printer, Save, X, ChevronDown, FileText, ChefHat, Mail, CheckCircle } from "lucide-react";
import { calculateJobCost, ProductionSummary, ProductionItem } from "@/lib/calculations/production";
import { getPackagingSize } from "@/lib/constants/bakery";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import dynamic from "next/dynamic";
import InvoicePDF from '@/components/pdf/InvoicePDF';
import { OrderConfirmationTemplate, PaymentReceivedTemplate } from "@/lib/email-templates";

const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

export default function OrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [productionData, setProductionData] = useState<ProductionSummary | null>(null);
    const [baking, setBaking] = useState(false);

    // Editing Materials State
    const [isEditingMaterials, setIsEditingMaterials] = useState(false);
    const [editedItems, setEditedItems] = useState<ProductionItem[]>([]);

    // Modals
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'success' | 'info';
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } });

    // Custom Adjustment State
    const [customAdjName, setCustomAdjName] = useState("");
    const [customAdjCost, setCustomAdjCost] = useState(0);

    useEffect(() => {
        if (id) fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        // 1. Get Order & Items
        const { data: orderData, error } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (
                    *,
                    recipes (name, baking_duration_minutes, instructions),
                    fillings (name)
                )
            `)
            .eq("id", id)
            .single();

        if (error) {
            alert("Error fetching order");
            return;
        }

        setOrder(orderData);

        // 2. Check for Production Snapshot OR Calculate
        if (orderData.production_snapshot) {
            setProductionData(orderData.production_snapshot);
        } else if (orderData.order_items.length > 0) {
            // ... Calculation Logic ...
            const item = orderData.order_items[0];

            // Fetch Recipe Ingredients
            const { data: cakeData } = await supabase
                .from("recipe_ingredients")
                .select(`amount_grams_ml, ingredients(id, name, unit, current_stock, purchase_price, purchase_quantity)`)
                .eq("recipe_id", item.recipe_id);

            // Fetch Filling Ingredients
            let fillingData: any[] = [];
            if (item.filling_id) {
                const { data } = await supabase
                    .from("filling_ingredients")
                    .select(`amount_grams_ml, ingredients(id, name, unit, current_stock, purchase_price, purchase_quantity)`)
                    .eq("filling_id", item.filling_id);
                fillingData = data || [];
            }

            // Fetch Packaging
            const pkgSize = getPackagingSize(item.size_inches);
            const { data: pkgData } = await supabase
                .from("ingredients")
                .select("*")
                .or(`name.ilike.%box (${pkgSize} inch)%,name.ilike.%board (${pkgSize} inch)%`);

            // Fetch Settings for Overhead Rates
            const { data: settings } = await supabase.from("settings").select("gas_rate_per_minute, electricity_rate_per_minute").single();
            const overheadRates = {
                gas: settings?.gas_rate_per_minute || 50,
                electricity: settings?.electricity_rate_per_minute || 30
            };

            if (cakeData && pkgData) {
                const result = calculateJobCost(
                    { ingredients: cakeData, baking_duration_minutes: item.recipes?.baking_duration_minutes || 45 },
                    { ingredients: fillingData },
                    pkgData || [],
                    item.custom_extras || [], // Use the extras saved in the item
                    { size: item.size_inches, layers: item.layers, qty: item.quantity, salePrice: item.item_price * item.quantity },
                    overheadRates
                );
                setProductionData(result);
            }
        }

        setLoading(false);
    };

    const startEditingMaterials = () => {
        if (productionData) {
            setEditedItems(JSON.parse(JSON.stringify(productionData.items))); // Deep copy
            setIsEditingMaterials(true);
        }
    };

    const saveMaterials = async () => {
        if (!productionData || !order) return;

        // Recalculate totals based on edited items
        const newTotalCost = editedItems.reduce((acc, item) => acc + (item.costToBake || 0), 0); // Assuming costToBake is the cost used
        // Note: costToBake in production.ts is Qty * UnitPrice. 
        // If user edits Qty, we should update Cost. If user edits Cost directly, we use that.
        // Let's assume user edits Qty and Cost is auto-updated, OR user edits Cost directly.
        // For simplicity, let's sum the 'costToBake' field which we will make editable or derived.

        const newProfit = (order.total_price - (order.vat || 0)) - newTotalCost;

        const newSnapshot: ProductionSummary = {
            ...productionData,
            items: editedItems,
            totalCostToBake: newTotalCost,
            totalProfit: newProfit
        };

        setLoading(true);
        const { error } = await supabase
            .from("orders")
            .update({
                production_snapshot: newSnapshot,
                total_cost: newTotalCost,
                profit: newProfit
            })
            .eq("id", order.id);

        if (error) {
            alert("Error saving materials");
        } else {
            setProductionData(newSnapshot);
            setOrder({ ...order, total_cost: newTotalCost, profit: newProfit }); // Optimistic update
            setIsEditingMaterials(false);
        }
        setLoading(false);
    };

    const updateEditedItem = (index: number, field: keyof ProductionItem, value: number) => {
        const newItems = [...editedItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditedItems(newItems);
    };

    const handleAddAdjustment = async () => {
        if (!customAdjName || !customAdjCost) return;

        const newItem: ProductionItem = {
            name: customAdjName,
            type: 'Adjustment',
            requiredAmount: 1,
            unit: 'unit',
            costToBake: customAdjCost,
            costToRestock: customAdjCost, // Assume immediate cost
            stock: 0,
            shortfall: 0
        };

        if (isEditingMaterials) {
            setEditedItems([...editedItems, newItem]);
            setCustomAdjName("");
            setCustomAdjCost(0);
        } else {
            if (!productionData || !order) return;

            const newItems = [...productionData.items, newItem];
            const newTotalCost = productionData.totalCostToBake + customAdjCost;
            const newProfit = (order.total_price - (order.vat || 0)) - newTotalCost;

            const newSnapshot = {
                ...productionData,
                items: newItems,
                totalCostToBake: newTotalCost,
                totalProfit: newProfit
            };

            const { error } = await supabase
                .from("orders")
                .update({
                    production_snapshot: newSnapshot,
                    total_cost: newTotalCost,
                    profit: newProfit
                })
                .eq("id", order.id);

            if (!error) {
                setProductionData(newSnapshot);
                setOrder({ ...order, total_cost: newTotalCost, profit: newProfit });
                setCustomAdjName("");
                setCustomAdjCost(0);
            }
        }
    };

    const handleDelete = async () => {
        setModalConfig({
            isOpen: true,
            title: "Delete Order",
            message: "Are you sure you want to delete this order? This action cannot be undone.",
            type: "danger",
            onConfirm: async () => {
                await supabase.from("order_items").delete().eq("order_id", id);
                const { error } = await supabase.from("orders").delete().eq("id", id);
                if (error) {
                    setModalConfig({
                        isOpen: true,
                        title: "Error Deleting Order",
                        message: "Error: " + error.message,
                        type: "danger",
                        onConfirm: () => {}
                    });
                }
                else router.push("/orders");
            }
        });
    };


    const updateStatus = async (newStatus: string) => {
        if (newStatus === 'Confirmed') {
            setModalConfig({
                isOpen: true,
                title: "Confirm Order",
                message: `Confirm change to Confirmed status for ${order.id.slice(0, 8)}?`,
                type: "info",
                onConfirm: async () => {
                    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
                    if (!error) {
                        fetchOrderDetails();
                        setModalConfig(prev => ({ ...prev, isOpen: false }));
                    } else {
                        setModalConfig({
                            isOpen: true,
                            title: "Error",
                            message: "Error updating status: " + error.message,
                            type: "danger",
                            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                }
            });
            return;
        }
        const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
        if (!error) fetchOrderDetails();
    };

    const handleBake = async () => {
        if (!productionData || !order) return;

        setModalConfig({
            isOpen: true,
            title: "Start Baking",
            message: "This will deduct ingredients from your Pantry and move the order to 'Baking' status. Continue?",
            type: "info",
            onConfirm: async () => {
                setBaking(true);
                try {
                    // 1. Deduct Stock (Iterate through the calculated requirements)
                    for (const item of productionData.items) {
                        if ((item.type === 'Ingredient' || item.type === 'Packaging') && item.id) {
                            const { error } = await supabase.rpc('deduct_stock', { ing_id: item.id, qty: item.requiredAmount });
                            if (error) console.error("Stock deduction error for " + item.name, error);
                        }
                    }

                    // 2. Update Order Status
                    const { error } = await supabase
                        .from("orders")
                        .update({ status: "Baking", total_cost: productionData.totalCostToBake, profit: productionData.totalProfit })
                        .eq("id", order.id);

                    if (error) throw error;

                    // Success Modal
                    setModalConfig({
                        isOpen: true,
                        title: "Baking Started",
                        message: "Order moved to Baking Floor! Stock has been updated.",
                        type: "success",
                        onConfirm: () => {
                            setModalConfig(prev => ({ ...prev, isOpen: false }));
                            fetchOrderDetails();
                        }
                    });

                } catch (e: any) {
                    setModalConfig({
                        isOpen: true,
                        title: "Error",
                        message: e.message,
                        type: "danger",
                        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                    });
                } finally {
                    setBaking(false);
                }
            }
        });
    };

    if (loading) return <div className="p-12 text-center text-slate-400">Loading Job Card...</div>;
    if (!order) return <div className="p-12 text-center text-red-400">Order not found.</div>;

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 bg-[#FDFBF7]">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/orders')} className="flex items-center gap-2 bg-white text-slate-600 px-5 py-2.5 rounded-full font-bold shadow-sm border border-[#E8ECE9] hover:bg-[#B03050] hover:text-white hover:border-[#B03050] transition-all group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-serif text-[#B03050]">Order #{order.id.slice(0, 8)}</h1>
                            <select
                                value={order.status}
                                onChange={(e) => updateStatus(e.target.value)}
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase border-none outline-none cursor-pointer ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                    order.status === 'Confirmed' ? 'bg-indigo-100 text-indigo-700' :
                                        order.status === 'Processing' ? 'bg-purple-100 text-purple-700' :
                                            order.status === 'Baking' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'Ready' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'Delivered' ? 'bg-slate-100 text-slate-600' :
                                                        'bg-red-50 text-red-600'
                                    }`}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Baking">Baking</option>
                                <option value="Ready">Ready</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <p className="text-slate-400 font-medium flex items-center gap-2 mt-1">
                            {order.customer_id ? (
                                <Link href={`/customers?id=${order.customer_id}`} className="hover:text-[#B03050] hover:underline transition-colors">
                                    {order.customer_name}
                                </Link>
                            ) : (
                                order.customer_name
                            )}
                            <span>•</span>
                            {new Date(order.delivery_date).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Link href={`/orders/${id}/baking-list`} className="group flex items-center gap-2 px-4 py-3 bg-white border border-[#E8ECE9] rounded-full text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm">
                        <ChefHat className="w-4 h-4" />
                        <span className="text-xs font-bold hidden group-hover:inline">Baking List</span>
                    </Link>
                    {order.status === 'Pending' && (
                        <button
                            onClick={async () => {
                                setModalConfig({
                                    isOpen: true,
                                    title: "Confirm Request",
                                    message: `Confirm Request for ${order.id.slice(0, 8)}:\n\n1. I have reviewed the order details.\n2. The price is correct and final.\n3. I am ready to accept this order.\n\nSend confirmation email to ${order.customer_email}?`,
                                    type: "info",
                                    onConfirm: async () => {
                                        try {
                                            // Fetch account details
                                            const { data: appSettings } = await supabase
                                                .from('app_settings')
                                                .select('value')
                                                .eq('key', 'account_details')
                                                .single();

                                            const accountDetails = appSettings?.value || "";
                                            const receiptUrl = `${window.location.origin}/pay/${order.id}`;

                                            await fetch('/api/send-email', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    to: order.customer_email,
                                                    subject: `Order Confirmation #${order.id.slice(0, 8)}`,
                                                    html: OrderConfirmationTemplate({ ...order, account_details: accountDetails }, receiptUrl)
                                                })
                                            });

                                            // Update status to Confirmed
                                            const { error: updateError } = await supabase.from("orders").update({ status: 'Confirmed' }).eq("id", order.id);

                                            if (updateError) throw updateError;

                                            setModalConfig({
                                                isOpen: true,
                                                title: "Success",
                                                message: "Email sent and Order Confirmed!",
                                                type: "success",
                                                onConfirm: () => {
                                                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                                                    fetchOrderDetails();
                                                }
                                            });
                                        } catch (e: any) {
                                            setModalConfig({
                                                isOpen: true,
                                                title: "Error",
                                                message: "Failed to process: " + e.message,
                                                type: "danger",
                                                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                                            });
                                        }
                                    }
                                });
                            }}
                            className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:scale-105 transition-all"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Confirm Order</span>
                        </button>
                    )}
                    {order && (
                        <PDFDownloadLink
                            document={<InvoicePDF order={order} />}
                            fileName={`Invoice-${order.id}.pdf`}
                            className="group flex items-center gap-2 px-4 py-3 bg-white border border-[#E8ECE9] rounded-full text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"
                        >
                            {({ loading }) => (
                                <>
                                    <Printer className="w-4 h-4" />
                                    <span className="text-xs font-bold hidden group-hover:inline">
                                        {loading ? 'Loading...' : 'Invoice'}
                                    </span>
                                </>
                            )}
                        </PDFDownloadLink>
                    )}
                    <Link href={`/orders/${id}/edit`} className="group flex items-center gap-2 px-4 py-3 bg-white border border-[#E8ECE9] rounded-full text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                        <Edit className="w-4 h-4" />
                        <span className="text-xs font-bold hidden group-hover:inline">Edit</span>
                    </Link>
                    <button onClick={handleDelete} className="group flex items-center gap-2 px-4 py-3 bg-white border border-[#E8ECE9] rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm">
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs font-bold hidden group-hover:inline">Delete</span>
                    </button>
                    {order.status === 'Pending' && (
                        <button
                            onClick={handleBake}
                            disabled={baking}
                            className="flex items-center gap-2 bg-[#B03050] text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] hover:scale-105 transition-all"
                        >
                            <Flame className="w-5 h-5 text-white" />
                            {baking ? "Heating Oven..." : "Bake!"}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Order Summary */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="text-sm font-bold uppercase text-slate-400 mb-4 tracking-wider">Job Details</h2>
                        <div className="space-y-4">
                            {order.order_items.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 bg-[#FDFBF7] rounded-2xl border border-[#E8ECE9]">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-serif text-lg text-slate-800">{item.recipes?.name}</h3>
                                        <span className="bg-white px-2 py-1 rounded-md text-xs font-bold shadow-sm border border-[#E8ECE9]">x{item.quantity}</span>
                                    </div>
                                    <div className="text-sm text-slate-500 space-y-1">
                                        <p>Size: <span className="font-bold text-slate-700">{item.size_inches}" ({item.layers} Layers)</span></p>
                                        <p>Filling: <span className="font-bold text-slate-700">{item.fillings?.name || "None"}</span></p>
                                    </div>

                                    {/* Baking Instructions */}
                                    <details className="mt-4 group">
                                        <summary className="list-none flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-xl cursor-pointer transition-all border border-[#E8ECE9]">
                                            <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                                                <FileText className="w-4 h-4" />
                                                <span>Baking Instructions</span>
                                            </div>
                                            <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                                        </summary>
                                        <div className="mt-2 text-xs text-slate-600 bg-white p-4 rounded-xl border border-[#E8ECE9] whitespace-pre-wrap leading-relaxed shadow-sm">
                                            {item.recipes?.instructions || "No instructions available for this recipe."}
                                        </div>
                                    </details>

                                    {item.custom_extras && item.custom_extras.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-[#E8ECE9]">
                                            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Extras</p>
                                            {item.custom_extras.map((ex: any, i: number) => (
                                                <div key={i} className="flex justify-between text-xs">
                                                    <span>{ex.name}</span>
                                                    <span className="font-bold">₦{ex.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-[#E8ECE9]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400 font-bold">Total Price</span>
                                <span className="text-2xl font-serif text-[#B03050]">₦{(order.total_price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-400">Discount</span>
                                    <span className="text-sm font-bold text-green-600">-₦{(order.discount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {order.vat > 0 && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-400">VAT ({order.vat_type})</span>
                                    <span className="text-sm font-bold text-slate-600">
                                        {order.vat_type === 'exclusive' ? '+' : ''}₦{(order.vat).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            {order.tip > 0 && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-400">Tip</span>
                                    <span className="text-sm font-bold text-green-600">+₦{(order.tip).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-400">Amount Paid</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700">₦{(order.amount_paid || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    <button
                                        onClick={async () => {
                                            const amount = prompt("Enter amount paid:", (order.amount_paid || 0).toString());
                                            if (amount === null) return;
                                            const numAmount = parseFloat(amount);
                                            if (isNaN(numAmount)) return;

                                            const { error } = await supabase.from('orders').update({
                                                amount_paid: numAmount
                                            }).eq('id', order.id);
                                            if (!error) fetchOrderDetails();
                                        }}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                                    >
                                        <Edit className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-[#E8ECE9]">
                                <span className="text-xs font-bold text-slate-500">Balance Due</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-lg font-bold ${((order.total_price || 0) - (order.amount_paid || 0)) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        ₦{Math.max(0, (order.total_price || 0) - (order.amount_paid || 0)).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    {((order.total_price || 0) - (order.amount_paid || 0)) > 0 && (
                                        <button
                                            onClick={async () => {
                                                setModalConfig({
                                                    isOpen: true,
                                                    title: "Confirm Payment",
                                                    message: "Mark this order as fully paid?",
                                                    type: "info",
                                                    onConfirm: async () => {
                                                        // 1. Update DB
                                                        const { error } = await supabase.from('orders').update({
                                                            amount_paid: order.total_price
                                                        }).eq('id', order.id);

                                                        if (error) {
                                                            setModalConfig({
                                                                isOpen: true,
                                                                title: "Error",
                                                                message: "Error updating payment: " + error.message,
                                                                type: "danger",
                                                                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                                                            });
                                                            return;
                                                        }

                                                        // 2. Send Payment Received Email
                                                        try {
                                                            await fetch('/api/send-email', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    to: order.customer_email,
                                                                    subject: `Payment Verified - Order #${order.id.slice(0, 8)}`,
                                                                    html: PaymentReceivedTemplate({ ...order, amount_paid: order.total_price })
                                                                })
                                                            });

                                                            setModalConfig({
                                                                isOpen: true,
                                                                title: "Success",
                                                                message: "Payment updated & Email sent!",
                                                                type: "success",
                                                                onConfirm: () => {
                                                                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                                                                    fetchOrderDetails();
                                                                    // We could also close automatically here
                                                                }
                                                            });
                                                        } catch (e) {
                                                            setModalConfig({
                                                                isOpen: true,
                                                                title: "Warning",
                                                                message: "Payment updated, but failed to send email.",
                                                                type: "info",
                                                                onConfirm: () => {
                                                                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                                                                    fetchOrderDetails();
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            }}
                                            className="text-[10px] bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-md hover:bg-green-700 transition-all flex items-center gap-1"
                                        >
                                            <CheckCircle className="w-3 h-3" />
                                            Mark Paid
                                        </button>
                                    )}
                                </div>
                            </div>
                            {order.receipt_url && (
                                <div className="mt-4 pt-4 border-t border-[#E8ECE9]">
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-green-600" />
                                            <span className="text-xs font-bold text-slate-600">Payment Receipt</span>
                                        </div>
                                        <a
                                            href={order.receipt_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-[#B03050] hover:underline"
                                        >
                                            View Image
                                        </a>
                                    </div>
                                </div>
                            )}
                            <div className="mt-2 text-center">
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/pay/${order.id}`;
                                        navigator.clipboard.writeText(url);
                                        setModalConfig({
                                            isOpen: true,
                                            title: "Link Copied",
                                            message: "Payment Upload Link copied: " + url,
                                            type: "success",
                                            confirmText: "OK",
                                            cancelText: "Close",
                                            onConfirm: () => {}
                                        });
                                    }}
                                    className="text-xs font-bold text-slate-400 hover:text-[#B03050] transition-colors"
                                >
                                    Copy Upload Payment Link
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                        <h2 className="text-sm font-bold uppercase text-slate-400 mb-4 tracking-wider">Delivery & Notes</h2>
                        <div className="space-y-4 text-sm">
                            <div className="flex gap-3">
                                <Clock className="w-5 h-5 text-slate-300" />
                                <div>
                                    <p className="font-bold text-slate-700">Due Date</p>
                                    <p className="text-slate-500">{new Date(order.delivery_date).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Package className="w-5 h-5 text-slate-300" />
                                <div>
                                    <p className="font-bold text-slate-700">Address</p>
                                    <p className="text-slate-500 whitespace-pre-wrap">{order.notes || "No notes"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Production Engine (The "Brain") */}
                <div className="lg:col-span-2">
                    {productionData ? (
                        <div className="space-y-6">

                            {/* Financial Dashboard for this Order */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <DollarSign className="w-12 h-12 text-slate-400" />
                                    </div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Est. Cost</p>
                                    <p className="text-3xl font-serif text-slate-800">₦{(productionData.totalCostToBake || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Flame className={`w-12 h-12 ${(productionData.totalProfit || 0) > 0 ? 'text-green-500' : 'text-red-500'}`} />
                                    </div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Profit Margin</p>
                                    <p className={`text-3xl font-serif ${(productionData.totalProfit || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₦{(productionData.totalProfit || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Restock Alert - Only show if needed */}
                            {(productionData.totalRestockCost || 0) > 0 && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-full shadow-sm text-red-500">
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Restock Required</p>
                                            <p className="text-[10px] text-red-600">Some ingredients are low in stock.</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-serif text-red-700">₦{(productionData.totalRestockCost || 0).toLocaleString()}</p>
                                </div>
                            )}

                            {/* Ingredients Table */}
                            <div className="bg-white rounded-[2rem] shadow-sm border border-[#E8ECE9] overflow-hidden">
                                <div className="p-6 border-b border-[#E8ECE9] flex justify-between items-center">
                                    <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Required Materials</h2>
                                    <div className="flex gap-2">
                                        {isEditingMaterials ? (
                                            <>
                                                <button onClick={() => setIsEditingMaterials(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-1">Cancel</button>
                                                <button onClick={saveMaterials} className="text-xs font-bold bg-[#B03050] text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                    <Save className="w-3 h-3" /> Save
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
                                    <thead className="bg-[#FDFBF7] text-[10px] uppercase font-bold text-slate-500">
                                        <tr>
                                            <th className="p-4">Item</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Qty Needed</th>
                                            <th className="p-4 text-right">Cost (₦)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8ECE9]">
                                        {(isEditingMaterials ? editedItems : productionData.items).map((item, idx) => (
                                            <tr key={idx} className="hover:bg-[#FDFBF7] transition-colors">
                                                <td className="p-4 font-medium text-slate-700">
                                                    {isEditingMaterials && item.type === 'Adjustment' ? (
                                                        <input
                                                            value={item.name}
                                                            onChange={(e) => updateEditedItem(idx, 'name', e.target.value as any)}
                                                            className="w-full p-1 border rounded text-xs"
                                                        />
                                                    ) : item.name}
                                                </td>
                                                <td className="p-4 text-xs">
                                                    <span className={`px-2 py-1 rounded-full font-bold ${item.type === 'Overhead' ? 'bg-yellow-100 text-yellow-700' :
                                                        item.type === 'Packaging' ? 'bg-purple-100 text-purple-700' :
                                                            item.type === 'Adjustment' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-600">
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
                                                <td className="p-4 text-right font-mono text-slate-600">
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

                                {/* Add Adjustment Row */}
                                <div className="p-4 bg-[#FDFBF7] border-t border-[#E8ECE9] flex gap-2 items-center">
                                    <input
                                        placeholder="Add extra cost (e.g. Extra Butter)"
                                        className="flex-1 p-2 text-xs border border-[#E8ECE9] rounded-lg outline-none focus:border-[#B03050]"
                                        value={customAdjName}
                                        onChange={e => setCustomAdjName(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Cost"
                                        className="w-20 p-2 text-xs border border-[#E8ECE9] rounded-lg outline-none focus:border-[#B03050]"
                                        value={customAdjCost || ''}
                                        onChange={e => setCustomAdjCost(Number(e.target.value))}
                                    />
                                    <button onClick={handleAddAdjustment} className="bg-[#B03050] text-white p-2 rounded-lg hover:bg-[#902040] transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-[#E8ECE9] rounded-[2rem] min-h-[400px]">
                            <p>No production data available.</p>
                        </div>
                    )}
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
