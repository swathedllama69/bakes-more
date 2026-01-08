"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calculateJobCost, ProductionItem } from "@/lib/calculations/production";
import { getPackagingSize } from "@/lib/constants/bakery";
import {
    Search, Filter, Plus, AlertTriangle, CheckCircle, ShoppingCart,
    Package, RefreshCw, Printer, X, Pencil, ArrowUpDown,
    Trash2, DollarSign, ChevronLeft, ChevronRight, ArrowUp, ArrowDown
} from "lucide-react";
import dynamic from "next/dynamic";
import ShoppingListPDF from '@/components/pdf/ShoppingListPDF';
import ConfirmationModal from "@/components/ui/ConfirmationModal";

const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

export default function PantryPage() {
    const [activeTab, setActiveTab] = useState<'stock' | 'shopping'>('stock');

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'danger' | 'success' | 'info';
        onConfirm: () => void;
        confirmText?: string;
        cancelText?: string;
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: () => { },
    });

    // --- Stock State ---
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [loadingStock, setLoadingStock] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Add/Edit Ingredient State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newIngredient, setNewIngredient] = useState({
        name: "",
        category: "Flour/Dry",
        unit: "g",
        current_stock: 0,
        min_stock_level: 1000,
        purchase_price: 0,
        purchase_quantity: 1000
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<any>(null);

    // --- Shopping List State ---
    const [shoppingItems, setShoppingItems] = useState<any[]>([]);
    const [loadingShopping, setLoadingShopping] = useState(false);
    const [totalShoppingCost, setTotalShoppingCost] = useState(0);
    const [isAddShoppingItemModalOpen, setIsAddShoppingItemModalOpen] = useState(false);
    const [newShoppingItem, setNewShoppingItem] = useState({
        name: "",
        quantity: 1,
        unit: "pcs",
        cost: 0
    });

    // Stats
    const totalItems = ingredients.length;
    const lowStockItems = ingredients.filter(i => i.current_stock < i.min_stock_level).length;
    const totalValue = ingredients.reduce((sum, i) => sum + ((i.purchase_price / i.purchase_quantity) * i.current_stock), 0);
    const categories = ["All", ...Array.from(new Set(ingredients.map(i => i.category))).sort()];

    useEffect(() => {
        fetchIngredients();
    }, []);

    // --- Stock Logic ---
    async function fetchIngredients() {
        setLoadingStock(true);
        const { data } = await supabase.from("ingredients").select("*").order("name");
        if (data) setIngredients(data);
        setLoadingStock(false);
    }

    async function updateStock(id: string, newStock: number) {
        // Optimistic Update
        setIngredients(prev => prev.map(i => i.id === id ? { ...i, current_stock: newStock } : i));

        const { error } = await supabase.from("ingredients").update({ current_stock: newStock }).eq("id", id);
        if (error) {
            // Revert on error
            fetchIngredients();
            alert("Failed to update stock");
        }
    }

    async function deleteIngredient(id: string) {
        setModalConfig({
            isOpen: true,
            title: "Delete Ingredient",
            message: "Are you sure you want to delete this item? This cannot be undone.",
            type: "danger",
            confirmText: "Delete",
            onConfirm: async () => {
                const { error } = await supabase.from("ingredients").delete().eq("id", id);
                if (!error) {
                    setIngredients(prev => prev.filter(i => i.id !== id));
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                } else {
                    alert(error.message);
                }
            }
        });
    }

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Memoized Sorting & Filtering for Performance
    const processedIngredients = useMemo(() => {
        let processed = [...ingredients];

        // 1. Filter
        processed = processed.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === "All" || item.category === filterCategory;
            return matchesSearch && matchesCategory;
        });

        // 2. Sort
        processed.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'status') {
                // Low Stock (0) comes before Good (1)
                valA = a.current_stock < a.min_stock_level ? 0 : 1;
                valB = b.current_stock < b.min_stock_level ? 0 : 1;
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return processed;
    }, [ingredients, searchTerm, filterCategory, sortConfig]);

    // Pagination Calculation
    const totalPages = Math.ceil(processedIngredients.length / itemsPerPage);
    const paginatedIngredients = processedIngredients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- CRUD Handlers ---
    const handleAddIngredient = async () => {
        if (!newIngredient.name) return;
        const { data, error } = await supabase.from("ingredients").insert(newIngredient).select().single();

        if (error) {
            alert("Error adding ingredient: " + error.message);
        } else {
            setIngredients([...ingredients, data]);
            setIsAddModalOpen(false);
            setNewIngredient({
                name: "", category: "Flour/Dry", unit: "g",
                current_stock: 0, min_stock_level: 1000,
                purchase_price: 0, purchase_quantity: 1000
            });
        }
    };

    const handleUpdateIngredient = async () => {
        if (!editingIngredient || !editingIngredient.name) return;
        const { error } = await supabase
            .from("ingredients")
            .update({
                name: editingIngredient.name,
                category: editingIngredient.category,
                unit: editingIngredient.unit,
                current_stock: editingIngredient.current_stock,
                min_stock_level: editingIngredient.min_stock_level,
                purchase_price: editingIngredient.purchase_price,
                purchase_quantity: editingIngredient.purchase_quantity
            })
            .eq("id", editingIngredient.id);

        if (error) {
            alert("Error updating: " + error.message);
        } else {
            setIngredients(prev => prev.map(i => i.id === editingIngredient.id ? editingIngredient : i));
            setIsEditModalOpen(false);
            setEditingIngredient(null);
        }
    };

    // --- Shopping List Logic ---
    const handleAnalyzePantry = async () => {
        setLoadingShopping(true);

        // 1. Fetch Pending Orders
        const { data: orders } = await supabase
            .from("orders")
            .select(`*, order_items (*, recipes (*), fillings (*))`)
            .eq("status", "Pending");

        if (!orders || orders.length === 0) {
            setShoppingItems([]);
            setTotalShoppingCost(0);
            setLoadingShopping(false);
            return;
        }

        // 2. Fetch Ingredient Relations
        const recipeIds = new Set<string>();
        const fillingIds = new Set<string>();
        orders.forEach(o => o.order_items.forEach((item: any) => {
            if (item.recipe_id) recipeIds.add(item.recipe_id);
            if (item.filling_id) fillingIds.add(item.filling_id);
        }));

        const { data: recipeIngs } = await supabase.from("recipe_ingredients").select(`*, ingredients(*)`).in("recipe_id", Array.from(recipeIds));
        const { data: fillingIngs } = await supabase.from("filling_ingredients").select(`*, ingredients(*)`).in("filling_id", Array.from(fillingIds));
        const { data: allIngredients } = await supabase.from("ingredients").select("*");

        // 3. Calculate Requirements
        const aggregatedRequirements: Record<string, ProductionItem> = {};

        for (const order of orders) {
            for (const item of order.order_items) {
                const cakeData = { ingredients: recipeIngs?.filter((r: any) => r.recipe_id === item.recipe_id) || [] };
                const fillingData = { ingredients: fillingIngs?.filter((f: any) => f.filling_id === item.filling_id) || [] };

                const pkgSize = getPackagingSize(item.size_inches);
                const pkgData = allIngredients?.filter(ing =>
                    ing.name.toLowerCase().includes(`box (${pkgSize} inch)`) ||
                    ing.name.toLowerCase().includes(`board (${pkgSize} inch)`)
                ) || [];

                const result = calculateJobCost(
                    cakeData, fillingData, pkgData, item.custom_extras || [],
                    { size: item.size_inches, layers: item.layers, qty: item.quantity, salePrice: item.item_price },
                    { gas: 0, electricity: 0 }
                );

                result.items.forEach(prodItem => {
                    if (prodItem.type === 'Overhead') return;
                    const key = prodItem.name;
                    if (!aggregatedRequirements[key]) {
                        aggregatedRequirements[key] = { ...prodItem, requiredAmount: 0, shortfall: 0, costToRestock: 0 };
                    }
                    aggregatedRequirements[key].requiredAmount += prodItem.requiredAmount;
                });
            }
        }

        // 4. Calculate Shortfalls
        const finalItems: any[] = [];
        let totalRestock = 0;

        Object.values(aggregatedRequirements).forEach(item => {
            const realIng = allIngredients?.find(i => i.name === item.name);
            const currentStock = realIng?.current_stock || 0;
            const shortfall = Math.max(0, item.requiredAmount - currentStock);

            if (shortfall > 0) {
                const pricePerUnit = realIng ? (realIng.purchase_price / realIng.purchase_quantity) : 0;
                const cost = shortfall * pricePerUnit;
                finalItems.push({ ...item, stock: currentStock, shortfall, costToRestock: cost, isManual: false });
                totalRestock += cost;
            }
        });

        setShoppingItems(finalItems);
        setTotalShoppingCost(totalRestock);
        setLoadingShopping(false);
    };

    const handleAddShoppingItem = () => {
        if (!newShoppingItem.name) return;
        const newItem = {
            name: newShoppingItem.name,
            type: 'Manual',
            requiredAmount: newShoppingItem.quantity,
            unit: newShoppingItem.unit,
            stock: 0,
            shortfall: newShoppingItem.quantity,
            costToRestock: newShoppingItem.cost,
            isManual: true
        };

        setShoppingItems(prev => [...prev, newItem]);
        setTotalShoppingCost(prev => prev + newItem.costToRestock);
        setIsAddShoppingItemModalOpen(false);
        setNewShoppingItem({ name: "", quantity: 1, unit: "pcs", cost: 0 });
    };

    const handleRemoveShoppingItem = (index: number) => {
        const itemToRemove = shoppingItems[index];
        setShoppingItems(prev => prev.filter((_, i) => i !== index));
        setTotalShoppingCost(prev => Math.max(0, prev - (itemToRemove.costToRestock || 0)));
    };

    // --- Render Helpers ---
    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (sortConfig.key !== colKey) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 text-[#B03050]" />
            : <ArrowDown className="w-3 h-3 text-[#B03050]" />;
    };

    return (
        <div className="min-h-screen p-4 md:p-8 font-sans text-slate-800 bg-[#FDFBF7] print:bg-white print:p-0">

            {/* Header - Hidden on Print */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-serif text-[#B03050] flex items-center gap-3">
                        <Package className="w-8 h-8" />
                        Pantry & Inventory
                    </h1>
                    <p className="text-slate-500 font-medium">Manage stock levels and generate shopping lists.</p>
                </div>

                {/* Tabs & Actions */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex bg-white p-1 rounded-xl border border-[#E8ECE9] shadow-sm">
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-[#B03050] text-white shadow-md' : 'text-slate-500 hover:bg-[#FDFBF7]'}`}
                        >
                            Stock
                        </button>
                        <button
                            onClick={() => setActiveTab('shopping')}
                            className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'shopping' ? 'bg-[#B03050] text-white shadow-md' : 'text-slate-500 hover:bg-[#FDFBF7]'}`}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="hidden sm:inline">Shopping List</span>
                            <span className="sm:hidden">List</span>
                        </button>
                    </div>

                    {activeTab === 'stock' && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="p-3 bg-[#B03050] text-white rounded-xl hover:bg-[#902040] transition-all shadow-lg flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline font-bold text-sm">Add Item</span>
                        </button>
                    )}

                    {activeTab === 'shopping' && (
                        <PDFDownloadLink
                            document={<ShoppingListPDF items={shoppingItems} totalCost={totalShoppingCost} />}
                            fileName={`ShoppingList-${new Date().toISOString().split('T')[0]}.pdf`}
                            className="p-3 bg-white border border-[#E8ECE9] text-slate-600 rounded-xl hover:text-[#B03050] hover:border-[#B03050]/30 transition-all shadow-sm flex items-center gap-2"
                        >
                            {({ loading }) => (
                                <>
                                    {loading ? '...' : <Printer className="w-5 h-5" />}
                                    <span className="hidden sm:inline font-bold text-sm">Print PDF</span>
                                </>
                            )}
                        </PDFDownloadLink>
                    )}
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8 border-b pb-4">
                <div className="flex items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-slate-900">Bakes & More</h1>
                        <p className="text-sm text-slate-500">Shopping List & Restock Guide</p>
                    </div>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">Generated On</p>
                        <p className="font-medium">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-bold">Est. Cost</p>
                        <p className="font-bold text-lg">₦{totalShoppingCost.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* --- Main Content --- */}
            {activeTab === 'stock' ? (
                <div className="space-y-6 print:hidden">
                    {/* Stat Cards - Scrollable on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard icon={Package} color="blue" label="Total Items" value={totalItems} />
                        <StatCard icon={AlertTriangle} color="red" label="Low Stock" value={lowStockItems} />
                        <StatCard icon={DollarSign} color="green" label="Total Value" value={`₦${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                    </div>

                    {/* Filters & Actions - Responsive Layout */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-[#E8ECE9] shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search ingredients..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-12 pr-4 py-2 bg-[#FDFBF7] rounded-xl border border-[#E8ECE9] focus:outline-none focus:border-[#B03050] transition-all text-sm"
                            />
                        </div>
                        {/* REPLACED: Category Tags with Dropdown Select for cleaner layout */}
                        <div className="w-full md:w-48 relative flex items-center">
                            <select
                                value={filterCategory}
                                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                className="w-full px-4 py-2 bg-[#FDFBF7] rounded-xl border border-[#E8ECE9] text-sm font-bold text-slate-600 focus:outline-none focus:border-[#B03050] appearance-none pr-10"
                                style={{ backgroundImage: 'none' }}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <ArrowDown className="absolute right-3 pointer-events-none w-4 h-4 text-slate-400" />
                        </div>
                    </div>

                    {/* Stock List Container */}
                    <div className="bg-white rounded-[2rem] border border-[#E8ECE9] shadow-sm overflow-hidden">

                        {/* 1. Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#FAFAFA] border-b border-[#E8ECE9]">
                                    <tr>
                                        {[
                                            { key: 'name', label: 'Ingredient' },
                                            { key: 'category', label: 'Category' },
                                            { key: 'current_stock', label: 'Stock Level' },
                                            { key: 'status', label: 'Status' }
                                        ].map((head) => (
                                            <th
                                                key={head.key}
                                                className="px-6 py-4 text-left text-xs font-serif font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                                onClick={() => handleSort(head.key)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {head.label} <SortIcon colKey={head.key} />
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-right text-xs font-serif font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E8ECE9]">
                                    {loadingStock ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading pantry data...</td></tr>
                                    ) : paginatedIngredients.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No ingredients found.</td></tr>
                                    ) : (
                                        paginatedIngredients.map((item) => (
                                            <tr key={item.id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800">{item.name}</p>
                                                    <p className="text-xs text-slate-400">₦{item.purchase_price.toLocaleString()} / {item.purchase_quantity}{item.unit}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 rounded-full bg-[#FDFBF7] border border-[#E8ECE9] text-xs font-bold text-slate-600">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => updateStock(item.id, Math.max(0, item.current_stock - 100))} className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600">-</button>
                                                        <span className={`font-bold w-16 text-center ${item.current_stock < item.min_stock_level ? 'text-red-500' : 'text-slate-800'}`}>
                                                            {item.current_stock}<span className="text-xs text-slate-400 ml-0.5">{item.unit}</span>
                                                        </span>
                                                        <button onClick={() => updateStock(item.id, item.current_stock + 100)} className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600">+</button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.current_stock < item.min_stock_level ? (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg w-fit">
                                                            <AlertTriangle className="w-3 h-3" /> Low
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit">
                                                            <CheckCircle className="w-3 h-3" /> Good
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => { setEditingIngredient(item); setIsEditModalOpen(true); }} className="p-2 text-slate-400 hover:text-[#B03050] hover:bg-[#FDFBF7] rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                                                        <button onClick={() => deleteIngredient(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 2. Mobile Card View */}
                        <div className="md:hidden divide-y divide-[#E8ECE9]">
                            {loadingStock ? (
                                <div className="p-6 text-center text-slate-400">Loading...</div>
                            ) : paginatedIngredients.length === 0 ? (
                                <div className="p-6 text-center text-slate-400">No ingredients found.</div>
                            ) : (
                                paginatedIngredients.map((item) => (
                                    <div key={item.id} className="p-4 space-y-3 bg-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                                                <p className="text-xs text-slate-400">Price: ₦{item.purchase_price.toLocaleString()}</p>
                                            </div>
                                            <span className="px-2 py-1 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-600 border border-slate-100">
                                                {item.category}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between bg-[#FDFBF7] p-3 rounded-xl border border-[#E8ECE9]">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => updateStock(item.id, Math.max(0, item.current_stock - 100))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 text-slate-600">-</button>
                                                <div className="text-center">
                                                    <span className={`block font-black text-lg ${item.current_stock < item.min_stock_level ? 'text-red-500' : 'text-slate-800'}`}>
                                                        {item.current_stock}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">{item.unit}</span>
                                                </div>
                                                <button onClick={() => updateStock(item.id, item.current_stock + 100)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 text-slate-600">+</button>
                                            </div>

                                            <div className="flex gap-1">
                                                <button onClick={() => { setEditingIngredient(item); setIsEditModalOpen(true); }} className="p-2 bg-white border border-slate-100 shadow-sm text-slate-400 rounded-lg"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => deleteIngredient(item.id)} className="p-2 bg-white border border-slate-100 shadow-sm text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>

                                        {item.current_stock < item.min_stock_level && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                                                <AlertTriangle className="w-3 h-3" /> Low Stock (Min: {item.min_stock_level})
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6 pb-20">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-full bg-white border border-[#E8ECE9] text-slate-500 disabled:opacity-50 hover:bg-[#FDFBF7] transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-bold text-slate-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-full bg-white border border-[#E8ECE9] text-slate-500 disabled:opacity-50 hover:bg-[#FDFBF7] transition-all shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Shopping List Actions */}
                    <div className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm print:hidden">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-slate-800">Shopping List Generator</h2>
                                <p className="text-slate-500 text-sm mt-1">Analyze pending orders to calculate required ingredients automatically.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => setIsAddShoppingItemModalOpen(true)}
                                    className="px-6 py-3 bg-white border border-[#E8ECE9] text-slate-600 font-bold rounded-xl hover:bg-[#FDFBF7] transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Item
                                </button>
                                <button
                                    onClick={handleAnalyzePantry}
                                    disabled={loadingShopping}
                                    className="px-6 py-3 bg-[#B03050] text-white font-bold rounded-xl hover:bg-[#902040] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-pink-100"
                                >
                                    {loadingShopping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    Analyze Orders
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Shopping List Table */}
                    <div className="bg-white rounded-[2rem] border border-[#E8ECE9] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-[#FAFAFA] border-b border-[#E8ECE9]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-serif font-bold text-slate-500 uppercase tracking-wider">Item</th>
                                        <th className="px-6 py-4 text-left text-xs font-serif font-bold text-slate-500 uppercase tracking-wider">Required</th>
                                        <th className="px-6 py-4 text-left text-xs font-serif font-bold text-slate-500 uppercase tracking-wider">In Stock</th>
                                        <th className="px-6 py-4 text-left text-xs font-serif font-bold text-slate-500 uppercase tracking-wider">To Buy</th>
                                        <th className="px-6 py-4 text-right text-xs font-serif font-bold text-slate-500 uppercase tracking-wider">Est. Cost</th>
                                        <th className="px-6 py-4 text-right text-xs font-serif font-bold text-slate-500 uppercase tracking-wider print:hidden"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E8ECE9]">
                                    {shoppingItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                                Shopping list is empty. Click "Analyze Orders" to generate from pending orders.
                                            </td>
                                        </tr>
                                    ) : (
                                        shoppingItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-[#FDFBF7]/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800">{item.name}</p>
                                                    {item.isManual && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Manual</span>}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {item.requiredAmount.toLocaleString()} <span className="text-xs text-slate-400">{item.unit}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {item.stock.toLocaleString()} <span className="text-xs text-slate-400">{item.unit}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-[#B03050] bg-pink-50 px-2 py-1 rounded">
                                                        {item.shortfall.toLocaleString()} {item.unit}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-800">
                                                    ₦{item.costToRestock.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right print:hidden">
                                                    <button
                                                        onClick={() => handleRemoveShoppingItem(idx)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    {shoppingItems.length > 0 && (
                                        <tr className="bg-[#FDFBF7] font-bold border-t border-slate-200">
                                            <td colSpan={4} className="px-6 py-4 text-right text-slate-600 uppercase text-xs tracking-wider">Total Estimated Cost:</td>
                                            <td className="px-6 py-4 text-right text-xl text-[#B03050]">₦{totalShoppingCost.toLocaleString()}</td>
                                            <td className="print:hidden"></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modals --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-[#E8ECE9] p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-serif font-bold text-slate-800">Add New Ingredient</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newIngredient.name}
                                    onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                    className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    placeholder="e.g. All Purpose Flour"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                    <select
                                        value={newIngredient.category}
                                        onChange={e => setNewIngredient({ ...newIngredient, category: e.target.value })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    >
                                        <option>Flour/Dry</option>
                                        <option>Sugar/Sweetener</option>
                                        <option>Dairy/Egg</option>
                                        <option>Fat/Oil</option>
                                        <option>Flavor/Extract</option>
                                        <option>Packaging</option>
                                        <option>Topper</option>
                                        <option>Decoration</option>
                                        <option>Balloon</option>
                                        <option>Extra</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit</label>
                                    <input
                                        type="text"
                                        value={newIngredient.unit}
                                        onChange={e => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                        placeholder="g, ml, pcs"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Stock</label>
                                    <input
                                        type="number"
                                        value={newIngredient.current_stock}
                                        onChange={e => setNewIngredient({ ...newIngredient, current_stock: Number(e.target.value) })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min Level</label>
                                    <input
                                        type="number"
                                        value={newIngredient.min_stock_level}
                                        onChange={e => setNewIngredient({ ...newIngredient, min_stock_level: Number(e.target.value) })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Price (₦)</label>
                                    <input
                                        type="number"
                                        value={newIngredient.purchase_price}
                                        onChange={e => setNewIngredient({ ...newIngredient, purchase_price: Number(e.target.value) })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">For Qty</label>
                                    <input
                                        type="number"
                                        value={newIngredient.purchase_quantity}
                                        onChange={e => setNewIngredient({ ...newIngredient, purchase_quantity: Number(e.target.value) })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddIngredient}
                                className="w-full py-4 bg-[#B03050] text-white font-bold rounded-xl hover:bg-[#902040] transition-all mt-4 shadow-lg shadow-pink-100"
                            >
                                Add Ingredient
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && editingIngredient && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-[#E8ECE9] p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-serif font-bold text-slate-800">Edit Ingredient</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingIngredient.name}
                                    onChange={e => setEditingIngredient({ ...editingIngredient, name: e.target.value })}
                                    className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                    <select
                                        value={editingIngredient.category}
                                        onChange={e => setEditingIngredient({ ...editingIngredient, category: e.target.value })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    >
                                        <option>Flour/Dry</option>
                                        <option>Sugar/Sweetener</option>
                                        <option>Dairy/Egg</option>
                                        <option>Fat/Oil</option>
                                        <option>Flavor/Extract</option>
                                        <option>Packaging</option>
                                        <option>Topper</option>
                                        <option>Decoration</option>
                                        <option>Balloon</option>
                                        <option>Extra</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit</label>
                                    <input
                                        type="text"
                                        value={editingIngredient.unit}
                                        onChange={e => setEditingIngredient({ ...editingIngredient, unit: e.target.value })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Stock</label>
                                    <input
                                        type="number"
                                        value={editingIngredient.current_stock}
                                        onChange={e => setEditingIngredient({ ...editingIngredient, current_stock: Number(e.target.value) })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min Level</label>
                                    <input
                                        type="number"
                                        value={editingIngredient.min_stock_level}
                                        onChange={e => setEditingIngredient({ ...editingIngredient, min_stock_level: Number(e.target.value) })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Price (₦)</label>
                                    <input
                                        type="number"
                                        value={editingIngredient.purchase_price}
                                        onChange={e => setEditingIngredient({ ...editingIngredient, purchase_price: Number(e.target.value) })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">For Qty</label>
                                    <input
                                        type="number"
                                        value={editingIngredient.purchase_quantity}
                                        onChange={e => setEditingIngredient({ ...editingIngredient, purchase_quantity: Number(e.target.value) })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateIngredient}
                                className="w-full py-4 bg-[#B03050] text-white font-bold rounded-xl hover:bg-[#902040] transition-all mt-4"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddShoppingItemModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-[#E8ECE9] p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-serif font-bold text-slate-800">Add Manual Item</h3>
                            <button onClick={() => setIsAddShoppingItemModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                                <input
                                    type="text"
                                    value={newShoppingItem.name}
                                    onChange={e => setNewShoppingItem({ ...newShoppingItem, name: e.target.value })}
                                    className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    placeholder="e.g. Paper Towels"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        value={newShoppingItem.quantity}
                                        onChange={e => setNewShoppingItem({ ...newShoppingItem, quantity: Number(e.target.value) })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit</label>
                                    <select
                                        value={newShoppingItem.unit}
                                        onChange={e => setNewShoppingItem({ ...newShoppingItem, unit: e.target.value })}
                                        className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                    >
                                        <option value="pcs">Pieces</option>
                                        <option value="pack">Pack</option>
                                        <option value="g">Grams</option>
                                        <option value="ml">Milliliters</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estimated Cost (₦)</label>
                                <input
                                    type="number"
                                    value={newShoppingItem.cost}
                                    onChange={e => setNewShoppingItem({ ...newShoppingItem, cost: Number(e.target.value) })}
                                    className="w-full p-3 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl focus:outline-none focus:border-[#B03050]"
                                />
                            </div>
                            <button
                                onClick={handleAddShoppingItem}
                                className="w-full py-4 bg-[#B03050] text-white font-bold rounded-xl hover:bg-[#902040] transition-all mt-4 shadow-lg"
                            >
                                Add to List
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
            />
        </div>
    );
}

// Simple Helper Component for Cards
function StatCard({ icon: Icon, color, label, value }: { icon: any, color: string, label: string, value: string | number }) {
    const bgClasses: any = {
        blue: 'bg-blue-50 text-blue-500',
        red: 'bg-red-50 text-red-500',
        green: 'bg-green-50 text-green-500'
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bgClasses[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
                <p className="text-2xl font-serif font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
}