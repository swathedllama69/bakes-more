'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, ChefHat, Search, ArrowRight, AlertCircle, FileText, List, X, Image as ImageIcon, Upload } from 'lucide-react';
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function RecipeCreator() {
    const [activeTab, setActiveTab] = useState<'recipes' | 'fillings' | 'extras'>('recipes');
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
    const [editDuration, setEditDuration] = useState(45); // For recipes
    const [editInstructions, setEditInstructions] = useState("");
    const [editYieldAmount, setEditYieldAmount] = useState(1);
    const [editYieldUnit, setEditYieldUnit] = useState("Unit");
    const [editBaseSize, setEditBaseSize] = useState<number | null>(null);
    const [editSellingPrice, setEditSellingPrice] = useState(0);
    const [editIngredients, setEditIngredients] = useState<any[]>([]);
    const [editImageUrl, setEditImageUrl] = useState(""); // For extras
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

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
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
            // Fetch ingredients that are considered "Extras"
            const { data } = await supabase
                .from('ingredients')
                .select('*')
                .in('category', ['Topper', 'Decoration', 'Extra', 'Balloon'])
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
            setEditSellingPrice(item.purchase_price || 0); // Using purchase_price as base for now, or we need a selling_price column
            setEditImageUrl(item.image_url || "");
            // Extras don't have ingredients list usually, they ARE the ingredient/product
        } else if (activeTab === 'recipes') {
            setEditDuration(item.baking_duration_minutes || 45);
            setEditCategory(item.category || "Cake");
            setEditInstructions(item.instructions || "");
            setEditYieldAmount(item.yield_amount || 1);
            setEditYieldUnit(item.yield_unit || "Unit");
            setEditBaseSize(item.base_size_inches || null);
            setEditSellingPrice(item.selling_price || 0);
        } else {
            // Fillings
            setEditSellingPrice(item.price || 0); // Fillings table has 'price' column? Need to check schema or usage
        }

        setEditorTab('ingredients');

        if (activeTab !== 'extras') {
            // Fetch ingredients for this item
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
        setEditDuration(45);
        setEditCategory(activeTab === 'extras' ? "Topper" : "Cake");
        setEditInstructions("");
        setEditYieldAmount(1);
        setEditYieldUnit("Unit");
        setEditBaseSize(8);
        setEditSellingPrice(0);
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
    const profit = editSellingPrice - totalCost;
    const margin = editSellingPrice > 0 ? (profit / editSellingPrice) * 100 : 0;

    // Derive categories from ingredients
    const categories = ["Flour/Dry", ...Array.from(new Set(ingredients.map(i => i.category))).filter(c => c !== "Flour/Dry")];

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                // User cancelled selection
                setUploading(false);
                return;
            }

            const file = event.target.files[0];
            if (!file) {
                throw new Error("No file selected");
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('images').getPublicUrl(filePath);

            if (data) {
                setEditImageUrl(data.publicUrl);
                setNotification({ message: "Image uploaded successfully!", type: "success" });
            }
        } catch (error: any) {
            setNotification({ message: 'Error uploading image: ' + (error.message || "Unknown error"), type: "error" });
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!editName) return;

        let itemId = selectedItem.id;

        if (activeTab === 'extras') {
            // Saving to ingredients table
            const itemData: any = {
                name: editName,
                category: editCategory,
                purchase_price: editSellingPrice, // Assuming selling price is stored here for extras for now
                image_url: editImageUrl
            };

            if (itemId === 'new') {
                // Defaults for new ingredient
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
            const table = activeTab === 'recipes' ? 'recipes' : 'fillings';

            // 1. Upsert Item
            const itemData: any = { name: editName };
            if (activeTab === 'recipes') {
                itemData.baking_duration_minutes = editDuration;
                itemData.category = editCategory;
                itemData.instructions = editInstructions;
                itemData.yield_amount = editYieldAmount;
                itemData.yield_unit = editYieldUnit;
                itemData.base_size_inches = editBaseSize;
                itemData.base_cost = totalCost; // Save calculated cost
                itemData.selling_price = editSellingPrice;
            } else {
                // Fillings
                itemData.price = editSellingPrice;
            }

            if (itemId === 'new') {
                const { data, error } = await supabase.from(table).insert(itemData).select().single();
                if (error) return setNotification({ message: error.message, type: "error" });
                itemId = data.id;
            } else {
                const { error } = await supabase.from(table).update(itemData).eq('id', itemId);
                if (error) return setNotification({ message: error.message, type: "error" });
            }

            // 2. Update Ingredients (Delete all & Re-insert)
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
                const table = activeTab === 'extras' ? 'ingredients' : (activeTab === 'recipes' ? 'recipes' : 'fillings');
                await supabase.from(table).delete().eq('id', selectedItem.id);
                setSelectedItem(null);
                fetchItems();
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
            // Auto-add to current recipe
            handleAddIngredient(data.id);
        }
    };

    // const totalCost = editIngredients.reduce((sum, i) => sum + i.cost, 0); // Moved up

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 bg-[#FDFBF7]">

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
                    <button
                        onClick={() => setActiveTab('recipes')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'recipes' ? 'bg-[#B03050] text-white shadow-md' : 'text-slate-500 hover:bg-[#FAFAFA]'}`}
                    >
                        Cake Recipes
                    </button>
                    <button
                        onClick={() => setActiveTab('fillings')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'fillings' ? 'bg-[#B03050] text-white shadow-md' : 'text-slate-500 hover:bg-[#FAFAFA]'}`}
                    >
                        Fillings
                    </button>
                    <button
                        onClick={() => setActiveTab('extras')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'extras' ? 'bg-[#B03050] text-white shadow-md' : 'text-slate-500 hover:bg-[#FAFAFA]'}`}
                    >
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
                                <select
                                    value={filterFlavor}
                                    onChange={(e) => setFilterFlavor(e.target.value)}
                                    className="flex-1 p-2 bg-white rounded-lg border border-[#E8ECE9] text-xs font-bold text-slate-600 outline-none focus:border-[#B03050]"
                                >
                                    <option value="All">All Flavors</option>
                                    {availableFlavors.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                                <button
                                    onClick={() => setGroupByCategory(!groupByCategory)}
                                    className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${groupByCategory ? 'bg-[#B03050] text-white border-[#B03050]' : 'bg-white text-slate-500 border-[#E8ECE9]'}`}
                                >
                                    {groupByCategory ? 'Grouped' : 'Group?'}
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCreateNew}
                        className="w-full py-3 bg-[#B03050] text-white rounded-xl font-bold hover:bg-[#902040] transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200 text-sm"
                    >
                        <Plus className="w-4 h-4" /> Create New {activeTab === 'recipes' ? 'Recipe' : (activeTab === 'fillings' ? 'Filling' : 'Extra')}
                    </button>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {(() => {
                            const filtered = items.filter(i => {
                                const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
                                const matchesFlavor = filterFlavor === 'All' || i.name.toLowerCase().includes(filterFlavor.toLowerCase());
                                return matchesSearch && matchesFlavor;
                            });

                            if (groupByCategory && activeTab === 'recipes') {
                                return uniqueCategories.map(cat => {
                                    const catItems = filtered.filter(i => (i.category || 'Uncategorized') === cat);
                                    if (catItems.length === 0) return null;
                                    return (
                                        <div key={cat} className="mb-4">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{cat}</h3>
                                            <div className="space-y-2">
                                                {catItems.map((item, idx) => (
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
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            }

                            return filtered.map((item, idx) => (
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
                            ));
                        })()}
                    </div>
                </div>

                {/* --- RIGHT: EDITOR --- */}
                <div className="lg:col-span-8">
                    {selectedItem ? (
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-serif text-slate-800">
                                    {selectedItem.id === 'new' ? `New ${activeTab === 'recipes' ? 'Recipe' : (activeTab === 'fillings' ? 'Filling' : 'Extra')}` : 'Edit Details'}
                                </h2>
                                {selectedItem.id !== 'new' && (
                                    <button onClick={handleDelete} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Name</label>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                        placeholder="e.g. Vanilla Sponge"
                                    />
                                </div>

                                {activeTab === 'extras' && (
                                    <>
                                        <div>
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
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-green-600 mb-1">Price (₦)</label>
                                            <input
                                                type="number"
                                                value={editSellingPrice}
                                                onChange={(e) => setEditSellingPrice(Number(e.target.value))}
                                                className="w-full p-3 bg-green-50 text-green-700 rounded-xl font-black border border-green-100 outline-none focus:border-green-500 transition-colors"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
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
                                    </>
                                )}

                                {activeTab === 'recipes' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                                            <select
                                                value={editCategory}
                                                onChange={(e) => setEditCategory(e.target.value)}
                                                className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                            >
                                                <option value="Cake">Cake (Round/Square)</option>
                                                <option value="Dessert">Dessert</option>
                                                <option value="Cupcake">Cupcakes</option>
                                                <option value="Loaf">Loaf / Bread</option>
                                                <option value="Cookie">Cookies</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        {/* Dynamic Yield Inputs */}
                                        {editCategory === 'Cake' && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Base Size (Inches)</label>
                                                    <input
                                                        type="number"
                                                        value={editBaseSize || ''}
                                                        onChange={(e) => setEditBaseSize(Number(e.target.value))}
                                                        className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                                        placeholder="e.g. 8"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Yields (Layers)</label>
                                                    <input
                                                        type="number"
                                                        value={editYieldAmount}
                                                        onChange={(e) => {
                                                            setEditYieldAmount(Number(e.target.value));
                                                            setEditYieldUnit("Layers");
                                                        }}
                                                        className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                                    />
                                                </div>
                                            </>
                                        )}

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
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-green-600 mb-1">Selling Price (₦)</label>
                                            <input
                                                type="number"
                                                value={editSellingPrice}
                                                onChange={(e) => setEditSellingPrice(Number(e.target.value))}
                                                className="w-full p-3 bg-green-50 text-green-700 rounded-xl font-black border border-green-100 outline-none focus:border-green-500 transition-colors"
                                                placeholder="0.00"
                                            />
                                            <div className="flex gap-4 mt-2 text-xs font-bold">
                                                <span className={profit >= 0 ? "text-green-600" : "text-red-500"}>
                                                    Profit: ₦{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className={margin >= 30 ? "text-green-600" : "text-orange-500"}>
                                                    Margin: {margin.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

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
                                                    <select
                                                        className="p-2 bg-[#FAFAFA] rounded-lg text-sm border border-[#E8ECE9] outline-none max-w-[200px]"
                                                        onChange={(e) => {
                                                            if (e.target.value === 'NEW') {
                                                                setIsAddIngredientModalOpen(true);
                                                                e.target.value = "";
                                                            } else if (e.target.value) {
                                                                handleAddIngredient(e.target.value);
                                                                e.target.value = "";
                                                            }
                                                        }}
                                                    >
                                                        <option value="">+ Add Ingredient...</option>
                                                        <option value="NEW" className="font-bold text-[#B03050]">+ Create New Item</option>
                                                        <optgroup label="Pantry Items">
                                                            {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                                        </optgroup>
                                                    </select>
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
                                    Save {activeTab === 'recipes' ? 'Recipe' : (activeTab === 'fillings' ? 'Filling' : 'Extra')}
                                </button>
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
            {isAddIngredientModalOpen && (
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
