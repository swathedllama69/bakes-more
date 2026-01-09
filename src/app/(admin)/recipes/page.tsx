'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, ChefHat, Search, ArrowRight, AlertCircle, FileText, List, X, Image as ImageIcon, Upload, CheckCircle } from 'lucide-react';
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function RecipeCreator() {
    // Grouping mode: size (default), flavor, category
    const [groupMode, setGroupMode] = useState<'size' | 'flavor' | 'category'>('flavor');
    // Collapsible group state and multi-select
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [groupCollapse, setGroupCollapse] = useState<{ [cat: string]: boolean }>({});
    const [activeTab, setActiveTab] = useState<'recipes' | 'fillings' | 'desserts' | 'extras'>('recipes');
    const [editorTab, setEditorTab] = useState<'ingredients' | 'instructions'>('ingredients');

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

    // Data State
    const [items, setItems] = useState<any[]>([]);
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // New Ingredient Modal State
    const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false);
    const [newIngredient, setNewIngredient] = useState({
        name: "",
        category: "Flour/Dry",
        unit: "g",
        current_stock: 0,
        min_stock_level: 1000,
        purchase_price: 0,
        purchase_quantity: 1000
    });

    // Editor State
    const [editName, setEditName] = useState("");
    const [editCategory, setEditCategory] = useState("Cake");

    // Cake Specific State
    const [editLayerPrices, setEditLayerPrices] = useState<{ [key: number]: number }>({ 1: 0, 2: 0, 3: 0, 4: 0 });
    const [editDuration, setEditDuration] = useState(45);
    const [editInstructions, setEditInstructions] = useState("");
    const [editYieldAmount, setEditYieldAmount] = useState(1);
    const [editYieldUnit, setEditYieldUnit] = useState("Unit");
    const [editBaseSize, setEditBaseSize] = useState<number | null>(null);
    const [editFrosting, setEditFrosting] = useState('Whipped Cream');
    const [editShape, setEditShape] = useState('Round');
    const [editSize, setEditSize] = useState(8);
    const [editFlavor, setEditFlavor] = useState('Vanilla');
    const [editLuxury, setEditLuxury] = useState(false);
    const [editLuxuryFlavor, setEditLuxuryFlavor] = useState('Oreo');

    // Common/Other State
    const [editSellingPrice, setEditSellingPrice] = useState(0);
    const [editIngredients, setEditIngredients] = useState<any[]>([]);
    const [editImageUrl, setEditImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Smart Filters
    const [groupByCategory, setGroupByCategory] = useState(false);
    const [filterFlavor, setFilterFlavor] = useState("All");

    // Derived Data
    const uniqueCategories = Array.from(new Set(items.map(i => i.category || 'Uncategorized'))).sort();
    const commonFlavors = ['Vanilla', 'Chocolate', 'Red Velvet', 'Strawberry', 'Lemon', 'Carrot', 'Banana', 'Coconut', 'Blueberry', 'Plain'];
    const availableFlavors = commonFlavors.filter(flavor =>
        items.some(i => i.name.toLowerCase().includes(flavor.toLowerCase()))
    );

    // --- LOGIC: Filter & Group ---
    const filteredItems = useMemo(() => {
        return items.filter(i => {
            const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFlavor = filterFlavor === 'All' || i.name.toLowerCase().includes(filterFlavor.toLowerCase());
            return matchesSearch && matchesFlavor;
        });
    }, [items, searchTerm, filterFlavor]);

    const { groupedItems, sortedGroupKeys, groupLabel } = useMemo(() => {
        if (activeTab !== 'recipes' || !groupMode) {
            return { groupedItems: {}, sortedGroupKeys: [], groupLabel: '' };
        }

        let keyFn: (item: any) => string;
        let label = '';

        if (groupMode === 'size') {
            keyFn = (i) => (i.size ? `${i.size}"` : 'Unknown');
            label = 'Size';
        } else if (groupMode === 'flavor') {
            keyFn = (i) => i.flavor || 'Unknown';
            label = 'Flavor';
        } else {
            keyFn = (i) => i.category || 'Uncategorized';
            label = 'Category';
        }

        const map: { [key: string]: any[] } = {};
        filteredItems.forEach(i => {
            const key = keyFn(i);
            if (!map[key]) map[key] = [];
            map[key].push(i);
        });

        let keys = Object.keys(map);
        if (groupMode === 'size') {
            keys = keys.sort((a, b) => {
                const numA = parseInt(a);
                const numB = parseInt(b);
                if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                return a.localeCompare(b);
            });
        } else {
            keys = keys.sort((a, b) => a.localeCompare(b));
        }

        return { groupedItems: map, sortedGroupKeys: keys, groupLabel: label };
    }, [activeTab, groupMode, filteredItems]);

    useEffect(() => {
        if (activeTab === 'recipes' && groupMode) {
            const collapsed: { [key: string]: boolean } = {};
            sortedGroupKeys.forEach(k => { collapsed[k] = false; });
            setGroupCollapse(collapsed);
        }
    }, [activeTab, groupMode, filteredItems.length, sortedGroupKeys.length]);

    useEffect(() => {
        if (notification) {
            // Updated to 2000ms (2 seconds) as requested
            const timer = setTimeout(() => setNotification(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        fetchIngredients();
    }, []);

    useEffect(() => {
        fetchItems();
        setSelectedItem(null);
        setEditName("");
        setEditIngredients([]);
        setEditImageUrl("");
    }, [activeTab]);

    const fetchIngredients = async () => {
        const { data } = await supabase.from('ingredients').select('*').order('name');
        if (data) setIngredients(data);
    };

    const fetchItems = async () => {
        setLoading(true);
        if (activeTab === 'extras') {
            const { data } = await supabase
                .from('ingredients')
                .select('*')
                .in('category', ['Topper', 'Decoration', 'Extra', 'Balloon'])
                .order('name');
            if (data) setItems(data || []);
        } else if (activeTab === 'desserts') {
            const { data } = await supabase
                .from('desserts')
                .select('*')
                .order('name');
            if (data) setItems(data || []);
        } else {
            const table = activeTab === 'recipes' ? 'recipes' : 'fillings';
            const { data } = await supabase.from(table).select('*').order('name');
            if (data) setItems(data || []);
        }
        setLoading(false);
    };

    const handleSelectItem = async (item: any) => {
        setSelectedItem(item);
        setEditName(item.name);

        if (activeTab === 'extras') {
            setEditCategory(item.category || "Topper");
            setEditSellingPrice(item.purchase_price || 0);
            setEditImageUrl(item.image_url || "");
        } else if (activeTab === 'desserts') {
            setEditDuration(item.baking_duration_minutes || 45);
            setEditCategory("Dessert");
            setEditInstructions(item.description || "");
            setEditYieldAmount(item.yield_amount || 1);
            setEditYieldUnit(item.yield_unit || "Unit");
            setEditBaseSize(item.base_size_inches || null);
            setEditSellingPrice(item.selling_price || item.price || 0);
            // Always parse ingredients JSON for desserts
            let parsedIngredients = [];
            try {
                parsedIngredients = item.ingredients ? (typeof item.ingredients === 'string' ? JSON.parse(item.ingredients) : item.ingredients) : [];
            } catch (e) {
                parsedIngredients = [];
            }
            setEditIngredients(parsedIngredients);
            setEditorTab('ingredients');
            return;
        } else if (activeTab === 'recipes') {
            setEditDuration(item.baking_duration_minutes || 45);
            setEditCategory(item.category || "Cake");
            setEditInstructions(item.instructions || "");
            setEditYieldAmount(item.yield_amount || 1);
            setEditYieldUnit(item.yield_unit || "Unit");
            setEditBaseSize(item.base_size_inches || null);
            setEditSellingPrice(item.selling_price || 0);
            setEditFrosting(item.frosting || 'Whipped Cream');
            setEditShape(item.cake_type || 'Round');
            setEditSize(Number(item.size) || 8);
            setEditFlavor(item.flavor || 'Vanilla');
            setEditLuxury(item.luxury || false);
            setEditLuxuryFlavor(item.luxury_flavor || 'Oreo');
            const defaultPrices = { 1: item.selling_price || 0, 2: 0, 3: 0, 4: 0 };
            setEditLayerPrices(item.prices || defaultPrices);
        } else {
            // Fillings
            setEditSellingPrice(item.price || 0);
        }

        setEditorTab('ingredients');

        if (activeTab === 'recipes' || activeTab === 'fillings') {
            const table = activeTab === 'recipes' ? 'recipe_ingredients' : 'filling_ingredients';
            const idField = activeTab === 'recipes' ? 'recipe_id' : 'filling_id';

            const { data } = await supabase
                .from(table)
                .select(`*, ingredients(*)`)
                .eq(idField, item.id);

            if (data) {
                setEditIngredients(data.map((row: any) => ({
                    ingredient_id: row.ingredients.id,
                    name: row.ingredients.name,
                    unit: row.ingredients.unit,
                    amount: row.amount_grams_ml,
                    cost: (row.ingredients.purchase_price / row.ingredients.purchase_quantity) * row.amount_grams_ml
                })));
            }
        }
    };

    const handleCreateNew = () => {
        setSelectedItem({ id: 'new' });
        setEditName("");

        // Default values based on tab
        if (activeTab === 'extras') {
            setEditCategory("Topper");
        } else if (activeTab === 'fillings') {
            setEditCategory("Filling");
        } else {
            setEditCategory("Cake");
        }

        setEditDuration(45);
        setEditInstructions("");
        setEditYieldAmount(1);
        setEditYieldUnit("Unit");
        setEditBaseSize(8);
        setEditSellingPrice(0);
        setEditLayerPrices({ 1: 0, 2: 0, 3: 0, 4: 0 });
        setEditFrosting('Whipped Cream');
        setEditShape('Round');
        setEditSize(8);
        setEditFlavor('Vanilla');
        setEditLuxury(false);
        setEditLuxuryFlavor('Oreo');
        setEditIngredients([]);
        setEditImageUrl("");
        setEditorTab('ingredients');
    };

    const handleAddIngredient = (ingId: string) => {
        const ing = ingredients.find(i => i.id === ingId);
        if (!ing) return;

        setEditIngredients([...editIngredients, {
            ingredient_id: ing.id,
            name: ing.name,
            unit: ing.unit,
            amount: 0,
            cost: 0
        }]);
    };

    const handleUpdateIngredientAmount = (index: number, amount: number) => {
        const updated = [...editIngredients];
        const ing = ingredients.find(i => i.id === updated[index].ingredient_id);
        const pricePerUnit = ing ? (ing.purchase_price / ing.purchase_quantity) : 0;

        updated[index].amount = amount;
        updated[index].cost = amount * pricePerUnit;
        setEditIngredients(updated);
    };

    const handleRemoveIngredient = (index: number) => {
        const updated = [...editIngredients];
        updated.splice(index, 1);
        setEditIngredients(updated);
    };

    const totalCost = editIngredients.reduce((sum, i) => sum + i.cost, 0);

    function getLayerCost(layer: string | number) {
        return editIngredients.reduce((sum, i) => {
            const layerNum = typeof layer === 'number' ? layer : parseInt(layer, 10);
            const ingredient = ingredients.find(ing => ing.id === i.ingredient_id);
            const cat = ingredient?.category || i.category;
            if (cat === "Topper" || cat === "Decoration" || cat === "Packaging") {
                return sum + i.cost;
            } else {
                return sum + i.cost * layerNum;
            }
        }, 0);
    }
    const profit = editSellingPrice - totalCost;
    const margin = editSellingPrice > 0 ? (profit / editSellingPrice) * 100 : 0;

    const allCats = Array.from(new Set(ingredients.map(i => i.category)));
    const endCats = ["Topper", "Decoration", "Packaging"];
    const categories = [
        "Flour/Dry",
        ...allCats.filter(c => c !== "Flour/Dry" && !endCats.includes(c)),
        ...endCats.filter(c => allCats.includes(c))
    ];

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                setUploading(false);
                return;
            }
            const file = event.target.files[0];
            if (!file) throw new Error("No file selected");
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            if (data) {
                setEditImageUrl(data.publicUrl);
                setNotification({ message: "Image uploaded successfully!", type: "success" });
            }
        } catch (error: any) {
            setNotification({ message: 'Error uploading image: ' + (error.message || "Unknown error"), type: "error" });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!editName) return;
        let itemId = selectedItem.id;

        if (activeTab === 'extras') {
            const itemData: any = {
                name: editName,
                category: editCategory,
                purchase_price: editSellingPrice,
                image_url: editImageUrl
            };
            if (itemId === 'new') {
                itemData.unit = 'pcs';
                itemData.current_stock = 0;
                itemData.min_stock_level = 10;
                itemData.purchase_quantity = 1;
                const { data, error } = await supabase.from('ingredients').insert(itemData).select().single();
                if (error) return setNotification({ message: error.message, type: "error" });
                itemId = data.id;
            } else {
                const { error } = await supabase.from('ingredients').update(itemData).eq('id', itemId);
                if (error) return setNotification({ message: error.message, type: "error" });
            }
        } else {
            let table = 'fillings';
            const itemData: any = { name: editName };

            if (activeTab === 'recipes') {
                table = 'recipes';
                itemData.baking_duration_minutes = editDuration;
                itemData.category = editCategory;
                itemData.instructions = editInstructions;
                itemData.yield_amount = editYieldAmount;
                itemData.yield_unit = editYieldUnit;
                itemData.base_size_inches = editBaseSize;
                itemData.base_cost = totalCost;
                itemData.selling_price = editSellingPrice;
                itemData.frosting = editFrosting;
                itemData.cake_type = editShape;
                itemData.size = String(editSize);
                itemData.flavor = editFlavor;
                itemData.luxury = editLuxury;
                itemData.prices = editLayerPrices;
            } else if (activeTab === 'desserts') {
                table = 'desserts';
                itemData.selling_price = editSellingPrice;
                itemData.description = editInstructions;
                itemData.cost = totalCost;
                itemData.ingredients = editIngredients && Array.isArray(editIngredients) ? JSON.stringify(editIngredients) : '[]';
            } else {
                // Fillings
                itemData.price = editSellingPrice;
                // --- CRITICAL FIX: Save filling cost to DB ---
                itemData.cost = totalCost;
            }

            if (itemId === 'new') {
                const { data, error } = await supabase.from(table).insert(itemData).select().single();
                if (error) return setNotification({ message: error.message, type: "error" });
                itemId = data.id;
            } else {
                const { error } = await supabase.from(table).update(itemData).eq('id', itemId);
                if (error) return setNotification({ message: error.message, type: "error" });
            }
            if (activeTab === 'recipes' || activeTab === 'fillings') {
                const joinTable = activeTab === 'recipes' ? 'recipe_ingredients' : 'filling_ingredients';
                const idField = activeTab === 'recipes' ? 'recipe_id' : 'filling_id';
                await supabase.from(joinTable).delete().eq(idField, itemId);
                if (editIngredients.length > 0) {
                    const rows = editIngredients.map(i => ({
                        [idField]: itemId,
                        ingredient_id: i.ingredient_id,
                        amount_grams_ml: i.amount
                    }));
                    await supabase.from(joinTable).insert(rows);
                }
            }
        }

        setNotification({ message: "Saved successfully!", type: "success" });
        fetchItems();
        setSelectedItem(null);
    };

    const handleDelete = async () => {
        setModalConfig({
            isOpen: true,
            title: "Delete Item",
            message: "Are you sure? This cannot be undone.",
            type: "danger",
            confirmText: "Delete",
            onConfirm: async () => {
                let table = '';
                if (activeTab === 'extras') table = 'ingredients';
                else if (activeTab === 'recipes') table = 'recipes';
                else if (activeTab === 'fillings') table = 'fillings';
                else if (activeTab === 'desserts') table = 'desserts';
                const { error } = await supabase.from(table).delete().eq('id', selectedItem.id);
                if (error) {
                    setNotification({ message: `Delete failed: ${error.message}`, type: 'error' });
                } else {
                    setSelectedItem(null);
                    fetchItems();
                }
            }
        });
    };

    const handleCreateIngredient = async () => {
        if (!newIngredient.name) return;
        const { data, error } = await supabase.from("ingredients").insert(newIngredient).select().single();
        if (error) {
            setNotification({ message: "Error adding ingredient: " + error.message, type: "error" });
        } else {
            setIngredients([...ingredients, data]);
            setIsAddIngredientModalOpen(false);
            setNewIngredient({
                name: "",
                category: "Flour/Dry",
                unit: "g",
                current_stock: 0,
                min_stock_level: 1000,
                purchase_price: 0,
                purchase_quantity: 1000
            });
            handleAddIngredient(data.id);
        }
    };

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 bg-[#FDFBF7]">

            {/* --- NOTIFICATION TOAST --- */}
            {notification && (
                <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-top-2 fade-in duration-300 ${notification.type === 'success'
                    ? 'bg-green-600 text-white border-green-700'
                    : 'bg-red-600 text-white border-red-700'
                    }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                        <AlertCircle className="w-6 h-6 text-white" />
                    )}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
                        <p className="font-medium text-sm">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-2 text-white/80 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-[#B03050] flex items-center gap-3">
                        <ChefHat className="w-8 h-8" />
                        Recipe Creator
                    </h1>
                    <p className="text-slate-500 font-medium">Manage your cake formulas, fillings, and extras.</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-[#E8ECE9] shadow-sm">
                    <button onClick={() => setActiveTab('recipes')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'recipes' ? 'bg-[#B03050] text-white shadow-md' : 'text-slate-500 hover:bg-[#FAFAFA]'}`}>
                        Cake Recipes
                    </button>
                    <button onClick={() => setActiveTab('fillings')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'fillings' ? 'bg-[#B03050] text-white shadow-md' : 'text-slate-500 hover:bg-[#FAFAFA]'}`}>
                        Fillings
                    </button>
                    <button onClick={() => setActiveTab('desserts')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'desserts' ? 'bg-[#B03050] text-white shadow-md' : 'text-slate-500 hover:bg-[#FAFAFA]'}`}>
                        Desserts
                    </button>
                    <button onClick={() => setActiveTab('extras')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'extras' ? 'bg-[#B03050] text-white shadow-md' : 'text-slate-500 hover:bg-[#FAFAFA]'}`}>
                        Extras & Toppers
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* --- LEFT: LIST --- */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-[#E8ECE9] focus:outline-none focus:border-[#B03050] transition-colors text-sm"
                            />
                        </div>

                        {activeTab === 'recipes' && (
                            <div className="flex gap-2">
                                <select value={filterFlavor} onChange={(e) => setFilterFlavor(e.target.value)} className="flex-1 p-2 bg-white rounded-lg border border-[#E8ECE9] text-xs font-bold text-slate-600 outline-none focus:border-[#B03050]">
                                    <option value="All">All Flavors</option>
                                    {availableFlavors.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                                <select value={groupMode} onChange={e => setGroupMode(e.target.value as 'size' | 'flavor' | 'category')} className="p-2 bg-white rounded-lg border border-[#E8ECE9] text-xs font-bold text-slate-600 outline-none focus:border-[#B03050]">
                                    <option value="size">Group by Size</option>
                                    <option value="flavor">Group by Flavor</option>
                                    <option value="category">Group by Category</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCreateNew}
                        className="w-full py-3 bg-[#B03050] text-white rounded-xl font-bold hover:bg-[#902040] transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200 text-sm"
                    >
                        <Plus className="w-4 h-4" /> Create New {activeTab === 'recipes' ? 'Recipe' : (activeTab === 'fillings' ? 'Filling' : 'Item')}
                    </button>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {activeTab === 'recipes' && groupMode ? (
                            // Render Grouped Items
                            sortedGroupKeys.map(group => {
                                const catItems = groupedItems[group];
                                if (!catItems || catItems.length === 0) return null;
                                const isOpen = groupCollapse[group] === true;
                                const allChecked = catItems.every(i => selectedIds.includes(i.id));
                                const someChecked = catItems.some(i => selectedIds.includes(i.id));

                                return (
                                    <div key={group} className="mb-4">
                                        <div className="flex items-center mb-2 ml-1">
                                            <button onClick={() => setGroupCollapse(prev => ({ ...prev, [group]: !isOpen }))} className="mr-2 text-xs font-bold text-slate-400 focus:outline-none">
                                                {isOpen ? '▼' : '►'}
                                            </button>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{groupLabel}: {group}</h3>
                                        </div>
                                        {isOpen && (
                                            <div className="space-y-2">
                                                {catItems.map((item, idx) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => handleSelectItem(item)}
                                                        className={`p-3 rounded-lg border cursor-pointer transition-all group flex items-center ${selectedItem?.id === item.id ? 'bg-[#FDFBF7] border-[#B03050] shadow-sm' : 'bg-white border-[#E8ECE9] hover:border-[#B03050]'}`}
                                                    >
                                                        <div className="flex-1 flex items-center gap-3">
                                                            <span className="text-xs font-bold text-slate-300 w-4">{idx + 1}</span>
                                                            <span className={`text-sm font-bold ${selectedItem?.id === item.id ? 'text-[#B03050]' : 'text-slate-700'}`}>{item.name}</span>
                                                        </div>
                                                        <ArrowRight className={`w-3 h-3 ${selectedItem?.id === item.id ? 'text-[#B03050]' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            // Render Flat List
                            filteredItems.map((item, idx) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleSelectItem(item)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all group ${selectedItem?.id === item.id ? 'bg-[#FDFBF7] border-[#B03050] shadow-sm' : 'bg-white border-[#E8ECE9] hover:border-[#B03050]'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-300 w-4">{idx + 1}</span>
                                            <span className={`text-sm font-bold ${selectedItem?.id === item.id ? 'text-[#B03050]' : 'text-slate-700'}`}>{item.name}</span>
                                        </div>
                                        <ArrowRight className={`w-3 h-3 ${selectedItem?.id === item.id ? 'text-[#B03050]' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- RIGHT: EDITOR --- */}
                <div className="lg:col-span-8">
                    {selectedItem ? (
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-serif text-slate-800">
                                    {selectedItem.id === 'new' ? `New ${activeTab === 'recipes' ? 'Recipe' : (activeTab === 'fillings' ? 'Filling' : 'Item')}` : 'Edit Details'}
                                </h2>
                                {selectedItem.id !== 'new' && (
                                    <button onClick={handleDelete} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                {/* COMMON FIELD: NAME */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={activeTab !== 'recipes' ? "md:col-span-2" : ""}>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Name</label>
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                            placeholder="e.g. Vanilla Sponge"
                                        />
                                    </div>

                                    {/* RECIPE CATEGORY SELECTOR */}
                                    {activeTab === 'recipes' && (
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                                            <select
                                                value={editCategory}
                                                onChange={e => setEditCategory(e.target.value)}
                                                className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                            >
                                                <option value="Cake">Cake</option>
                                                <option value="Dessert">Dessert</option>
                                                <option value="Cupcake">Cupcakes</option>
                                                <option value="Loaf">Loaf / Bread</option>
                                                <option value="Cookie">Cookies</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* EXTRAS CATEGORY SELECTOR */}
                                    {activeTab === 'extras' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                                            <select
                                                value={editCategory}
                                                onChange={(e) => setEditCategory(e.target.value)}
                                                className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                            >
                                                <option value="Topper">Topper</option>
                                                <option value="Decoration">Decoration</option>
                                                <option value="Balloon">Balloon</option>
                                                <option value="Extra">Extra</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* --- RECIPE SPECIFIC FIELDS (Hidden for Fillings/Extras) --- */}
                                {activeTab === 'recipes' && (
                                    <>
                                        <div className="space-y-4 md:space-y-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                            {/* Frosting */}
                                            <div className="col-span-1 md:col-span-2">
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Frosting</label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-1 gap-y-1">
                                                    {['Whipped Cream', 'Swiss Meringue Buttercream', 'Fondant', 'Ganache'].map(frosting => (
                                                        <button
                                                            key={frosting}
                                                            className={`px-1 py-0.5 rounded-lg border font-bold text-xs ${editFrosting === frosting ? 'bg-[#B03050] text-white border-[#B03050]' : 'bg-[#FAFAFA] text-slate-800 border-[#E8ECE9]'} transition-all`}
                                                            style={{ minWidth: 0, margin: 0, fontSize: '0.7rem', height: '1.2rem', lineHeight: '1.1' }}
                                                            onClick={() => setEditFrosting(frosting)}
                                                        >
                                                            {frosting}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Flavor */}
                                            <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Flavor</label>
                                                    <select value={editFlavor} onChange={e => {
                                                        setEditFlavor(e.target.value);
                                                        setEditLuxury(e.target.value === 'Luxury');
                                                    }} className="w-full p-2 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors">
                                                        <option>Vanilla</option>
                                                        <option>Red Velvet</option>
                                                        <option>Chocolate</option>
                                                        <option>Strawberry (Colored)</option>
                                                        <option>Luxury</option>
                                                    </select>
                                                    {editLuxury && (
                                                        <div className="mt-2">
                                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Luxury Flavor</label>
                                                            <select value={editLuxuryFlavor} onChange={e => setEditLuxuryFlavor(e.target.value)} className="w-full p-2 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors">
                                                                <option>Oreo</option>
                                                                <option>Lotus</option>
                                                                <option>Coconut</option>
                                                                <option>Lemon</option>
                                                                <option>Banana</option>
                                                                <option>Carrot</option>
                                                                <option>Strawberry</option>
                                                                <option>Marble</option>
                                                                <option>Chocolate Oreo</option>
                                                                <option>Red Velvet Oreo</option>
                                                                <option>Fruit Cake (Non-Alcoholic)</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Shape</label>
                                                    <select value={editShape} onChange={e => setEditShape(e.target.value)} className="w-full p-2 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors">
                                                        <option>Round</option>
                                                        <option>Square</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {editCategory === 'Cupcake' && (
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Batch Yield (Count)</label>
                                                <input
                                                    type="number"
                                                    value={editYieldAmount}
                                                    onChange={(e) => {
                                                        setEditYieldAmount(Number(e.target.value));
                                                        setEditYieldUnit("Cupcakes");
                                                    }}
                                                    className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                                />
                                            </div>
                                        )}

                                        {editCategory === 'Loaf' && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Yield Amount</label>
                                                    <input
                                                        type="number"
                                                        value={editYieldAmount}
                                                        onChange={(e) => setEditYieldAmount(Number(e.target.value))}
                                                        className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Unit Type</label>
                                                    <select
                                                        value={editYieldUnit}
                                                        onChange={(e) => setEditYieldUnit(e.target.value)}
                                                        className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                                    >
                                                        <option value="Loaf">Loaf</option>
                                                        <option value="Mini Loaf">Mini Loaf</option>
                                                        <option value="Cup">Cup</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Baking Time (Mins)</label>
                                            <input
                                                type="number"
                                                value={editDuration}
                                                onChange={(e) => setEditDuration(Number(e.target.value))}
                                                className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* --- PRICING SECTION --- */}
                                {activeTab === 'recipes' ? (
                                    <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#E8ECE9] space-y-6 mt-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-serif text-lg text-[#B03050]">Pricing & Profitability</h3>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold uppercase text-slate-500">Cake Size:</label>
                                                <select value={editSize} onChange={e => setEditSize(Number(e.target.value))} className="p-2 bg-white rounded-lg border border-[#E8ECE9] font-bold text-slate-700 outline-none focus:border-[#B03050]">
                                                    {[4, 5, 6, 7, 8, 9, 10, 12, 13, 14].map(sz => (<option key={sz} value={sz}>{sz}"</option>))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {/* 1 Layer */}
                                            <div className="bg-white p-2 rounded border border-green-100 shadow-sm flex flex-col items-center text-xs min-w-0">
                                                <div className="flex justify-between items-center w-full mb-1">
                                                    <label className="font-bold uppercase text-slate-400">1L</label>
                                                    <span className="font-bold text-slate-300 bg-slate-50 px-1 py-0.5 rounded">₦{Math.ceil(totalCost).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1 w-full mb-1">
                                                    <span className="text-slate-400">₦</span>
                                                    <input
                                                        type="number"
                                                        value={editSellingPrice || ''}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            setEditSellingPrice(val);
                                                            setEditLayerPrices(prev => ({ ...prev, 1: val }));
                                                        }}
                                                        className="w-full text-base font-bold text-slate-800 outline-none placeholder:text-slate-200 p-1"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="flex justify-between w-full border-t border-slate-50 pt-1">
                                                    <span className={profit >= 0 ? "text-green-600" : "text-red-500"}>₦{profit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                    <span className={margin >= 30 ? "text-green-600" : "text-orange-500"}>{margin.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            {/* 2, 3, 4 Layers */}
                                            {[2, 3, 4].map(layerCount => {
                                                const price = editLayerPrices[layerCount] || 0;
                                                const estimatedCost = getLayerCost(layerCount);
                                                const layerProfit = price - estimatedCost;
                                                const layerMargin = price > 0 ? (layerProfit / price) * 100 : 0;
                                                return (
                                                    <div key={layerCount} className="bg-white p-2 rounded border border-slate-100 shadow-sm flex flex-col items-center text-xs min-w-0">
                                                        <div className="flex justify-between items-center w-full mb-1">
                                                            <label className="font-bold uppercase text-slate-400">{layerCount}L</label>
                                                            <span className="font-bold text-slate-300 bg-slate-50 px-1 py-0.5 rounded">₦{Math.ceil(estimatedCost).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 w-full mb-1">
                                                            <span className="text-slate-400">₦</span>
                                                            <input
                                                                type="number"
                                                                value={price === 0 ? '' : price}
                                                                onChange={(e) => setEditLayerPrices(prev => ({ ...prev, [layerCount]: Number(e.target.value) }))}
                                                                className="w-full text-base font-bold text-slate-700 outline-none placeholder:text-slate-200 p-1"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div className="flex justify-between w-full border-t border-slate-50 pt-1">
                                                            <span className={layerProfit >= 0 ? "text-slate-600" : "text-red-400"}>₦{layerProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                            <span className={layerMargin >= 30 ? "text-slate-600" : "text-orange-400"}>{layerMargin.toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    // Simple Pricing for Fillings and Extras
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-green-600 mb-1">Selling Price (₦)</label>
                                        <input
                                            type="number"
                                            value={editSellingPrice}
                                            onChange={(e) => setEditSellingPrice(Number(e.target.value))}
                                            className="w-full p-3 bg-green-50 text-green-700 rounded-xl font-black border border-green-100 outline-none focus:border-green-500 transition-colors"
                                            placeholder="0.00"
                                        />

                                        {/* Show profit margin only for Fillings (which have ingredients cost) */}
                                        {activeTab === 'fillings' && (
                                            <div className="flex gap-4 mt-2 text-xs font-bold">
                                                <span className={profit >= 0 ? "text-green-600" : "text-red-500"}>
                                                    Profit: ₦{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className={margin >= 30 ? "text-green-600" : "text-orange-500"}>
                                                    Margin: {margin.toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* --- IMAGE UPLOAD (EXTRAS ONLY) --- */}
                                {activeTab === 'extras' && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Image</label>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex-1">
                                                <label
                                                    htmlFor="image-upload"
                                                    className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploading ? 'bg-slate-50 border-slate-300' : 'bg-[#FAFAFA] border-[#E8ECE9] hover:border-[#B03050] hover:bg-pink-50'}`}
                                                >
                                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                                        {uploading ? (
                                                            <span className="text-sm font-bold animate-pulse">Uploading...</span>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-6 h-6" />
                                                                <span className="text-sm font-bold">Click to Upload Image</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <input
                                                        id="image-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        disabled={uploading}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                            {editImageUrl && (
                                                <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                                                    <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => setEditImageUrl("")}
                                                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">Supported formats: JPG, PNG, WEBP.</p>
                                    </div>
                                )}

                                {/* --- INGREDIENTS LIST (RECIPES & FILLINGS ONLY) --- */}
                                {activeTab !== 'extras' && (
                                    <>
                                        <div className="flex gap-6 border-b border-[#E8ECE9] mb-6 mt-6">
                                            <button
                                                onClick={() => setEditorTab('ingredients')}
                                                className={`pb-3 text-sm font-bold transition-all border-b-2 ${editorTab === 'ingredients' ? 'border-[#B03050] text-[#B03050]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <List className="w-4 h-4" /> Ingredients
                                                </div>
                                            </button>
                                            {activeTab === 'recipes' && (
                                                <button
                                                    onClick={() => setEditorTab('instructions')}
                                                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${editorTab === 'instructions' ? 'border-[#B03050] text-[#B03050]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4" /> Instructions
                                                    </div>
                                                </button>
                                            )}
                                        </div>

                                        {editorTab === 'ingredients' ? (
                                            <div className="mb-8">
                                                <div className="flex justify-between items-end mb-4">
                                                    <h3 className="font-bold text-slate-700">Ingredients List</h3>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="px-3 py-2 rounded-lg bg-[#FDFBF7] border border-[#E8ECE9] text-xs font-bold text-[#B03050] hover:bg-pink-50"
                                                            onClick={() => setIsAddIngredientModalOpen(true)}
                                                        >
                                                            + New Ingredient
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Grouped ingredient picker with checkboxes */}
                                                <div className="mb-4 p-2 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9]">
                                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Quick Add Ingredients</label>
                                                    <div className="max-h-48 overflow-y-auto grid grid-cols-1 md:grid-cols-4 gap-x-1 gap-y-1">
                                                        {categories.map((cat, idx) => (
                                                            <div key={cat} className={idx !== 0 ? 'pl-2 border-l border-slate-200' : ''}>
                                                                <div className="font-bold text-xs text-slate-400 mb-1 mt-2">{cat}</div>
                                                                {ingredients.filter(i => i.category === cat).map(i => {
                                                                    const checked = editIngredients.some(ei => ei.ingredient_id === i.id);
                                                                    return (
                                                                        <label key={i.id} className="flex items-center gap-2 text-xs mb-1 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={checked}
                                                                                onChange={e => {
                                                                                    if (e.target.checked) {
                                                                                        handleAddIngredient(i.id);
                                                                                    } else {
                                                                                        const idx = editIngredients.findIndex(ei => ei.ingredient_id === i.id);
                                                                                        if (idx !== -1) handleRemoveIngredient(idx);
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <span>{i.name}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-white border border-[#E8ECE9] rounded-xl overflow-hidden">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-xs uppercase font-bold text-slate-500 bg-[#FAFAFA]">
                                                            <tr>
                                                                <th className="p-4">Ingredient</th>
                                                                <th className="p-4 w-32">Amount</th>
                                                                <th className="p-4 w-24 text-right">Cost</th>
                                                                <th className="p-4 w-12"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200">
                                                            {editIngredients.map((ing, idx) => (
                                                                <tr key={idx} className="bg-white">
                                                                    <td className="p-4 font-medium text-slate-700">{ing.name}</td>
                                                                    <td className="p-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="number"
                                                                                value={ing.amount}
                                                                                onChange={(e) => handleUpdateIngredientAmount(idx, Number(e.target.value))}
                                                                                className="w-20 p-1 bg-[#FAFAFA] border border-[#E8ECE9] rounded text-center font-bold"
                                                                            />
                                                                            <span className="text-xs text-slate-400">{ing.unit}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-right font-bold text-slate-600">
                                                                        ₦{ing.cost.toFixed(2)}
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        <button onClick={() => handleRemoveIngredient(idx)} className="text-slate-300 hover:text-red-500">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {editIngredients.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                                                        No ingredients added yet.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                        <tfoot className="bg-slate-100">
                                                            <tr>
                                                                <td colSpan={2} className="p-4 text-right font-bold text-slate-500 uppercase text-xs">Total Base Cost</td>
                                                                <td className="p-4 text-right font-black text-slate-800 text-lg">₦{totalCost.toFixed(2)}</td>
                                                                <td></td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-8">
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Baking Instructions</label>
                                                <textarea
                                                    value={editInstructions}
                                                    onChange={(e) => setEditInstructions(e.target.value)}
                                                    className="w-full h-64 p-4 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none font-medium text-slate-700 focus:border-[#B03050] transition-colors resize-none"
                                                    placeholder="1. Preheat oven to 180°C...&#10;2. Mix dry ingredients...&#10;3. Bake for 45 mins..."
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                {selectedItem && (
                                    <div className="mb-4">
                                        <div className="flex gap-4 items-center">
                                            <span className="font-bold text-slate-500">Cost: ₦{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span className={profit >= 0 ? "text-green-600 font-bold" : "text-red-500 font-bold"}>Profit: ₦{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span className={margin >= 30 ? "text-green-600 font-bold" : "text-orange-500 font-bold"}>Margin: {margin.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-8 py-3 bg-[#B03050] text-white rounded-xl font-bold shadow-lg shadow-pink-200 hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        Save {activeTab === 'recipes' ? 'Recipe' : (activeTab === 'fillings' ? 'Filling' : 'Item')}
                                    </button>
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="h-full border-4 border-dashed border-[#E8ECE9] rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 p-12 text-center">
                            <ChefHat className="w-16 h-16 mb-4 text-slate-200" />
                            <p className="font-serif text-2xl mb-2 text-slate-400">Select an Item</p>
                            <p>Choose a recipe, filling, or extra from the list to edit, or create a new one.</p>
                        </div>
                    )}
                </div>
            </div>
            {/* Add Ingredient Modal */}
            {
                isAddIngredientModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-serif text-slate-900">Add New Ingredient</h2>
                                <button onClick={() => setIsAddIngredientModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Name</label>
                                    <input
                                        value={newIngredient.name}
                                        onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                        className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none font-bold text-slate-700 focus:border-[#B03050] transition-colors"
                                        placeholder="e.g. Almond Flour"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                                        <select
                                            value={newIngredient.category}
                                            onChange={e => setNewIngredient({ ...newIngredient, category: e.target.value })}
                                            className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none font-bold text-slate-700 focus:border-[#B03050] transition-colors"
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Unit</label>
                                        <input
                                            value={newIngredient.unit}
                                            onChange={e => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                            className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none font-bold text-slate-700 focus:border-[#B03050] transition-colors"
                                            placeholder="e.g. g, pcs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Current Stock</label>
                                        <input
                                            type="number"
                                            value={newIngredient.current_stock}
                                            onChange={e => setNewIngredient({ ...newIngredient, current_stock: Number(e.target.value) })}
                                            className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none font-bold text-slate-700 focus:border-[#B03050] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Min Level</label>
                                        <input
                                            type="number"
                                            value={newIngredient.min_stock_level}
                                            onChange={e => setNewIngredient({ ...newIngredient, min_stock_level: Number(e.target.value) })}
                                            className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none font-bold text-slate-700 focus:border-[#B03050] transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Purchase Price (₦)</label>
                                        <input
                                            type="number"
                                            value={newIngredient.purchase_price}
                                            onChange={e => setNewIngredient({ ...newIngredient, purchase_price: Number(e.target.value) })}
                                            className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none font-bold text-slate-700 focus:border-[#B03050] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">For Qty</label>
                                        <input
                                            type="number"
                                            value={newIngredient.purchase_quantity}
                                            onChange={e => setNewIngredient({ ...newIngredient, purchase_quantity: Number(e.target.value) })}
                                            className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#E8ECE9] outline-none font-bold text-slate-700 focus:border-[#B03050] transition-colors"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateIngredient}
                                    className="w-full py-4 bg-[#B03050] text-white rounded-xl font-bold hover:bg-[#902040] transition-all mt-4 shadow-lg shadow-pink-200"
                                >
                                    Create & Add to Recipe
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
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
        </div >
    );
}