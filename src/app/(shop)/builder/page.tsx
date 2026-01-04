"use client";

import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, ContactShadows, Environment } from "@react-three/drei";
import { supabase } from "@/lib/supabase";
import { Loader2, ShoppingBag, ChevronRight, Layers, Ruler, Palette, Package } from "lucide-react";
import Link from "next/link";

// 3D Components
import CakeModel from "@/components/cake-builder/CakeModel";

export default function CakeBuilderPage() {
    // State
    const [recipes, setRecipes] = useState<any[]>([]);
    const [fillings, setFillings] = useState<any[]>([]);

    // Configuration
    const [selectedShape, setSelectedShape] = useState<'round' | 'square'>('round');
    const [size, setSize] = useState(6); // inches
    const [layers, setLayers] = useState(2);
    const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null);
    const [selectedFillingId, setSelectedFillingId] = useState<number | null>(null);
    const [color, setColor] = useState("#F5E6D3"); // Default Vanilla/Cream
    const [quantity, setQuantity] = useState(1);

    // Cart / Order State
    const [cart, setCart] = useState<any[]>([]);
    const [view, setView] = useState<'builder' | 'cart'>('builder');

    // Pricing
    const [basePrice, setBasePrice] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        calculatePrice();
    }, [size, layers, selectedFlavorId, selectedFillingId, quantity]);

    const fetchOptions = async () => {
        const { data: r } = await supabase.from('recipes').select('*').eq('category', 'Cake');
        const { data: f } = await supabase.from('fillings').select('*');
        if (r) setRecipes(r);
        if (f) setFillings(f);
        if (r && r.length > 0) {
            setSelectedFlavorId(r[0].id);
            setBasePrice(r[0].selling_price || 5000);
        }
    };

    const calculatePrice = () => {
        if (!selectedFlavorId) return;
        const recipe = recipes.find(r => r.id === selectedFlavorId);
        if (!recipe) return;

        // Base Logic: 
        // Recipe price is usually for a standard size (e.g., 8 inch, 1 layer or 2 layers).
        // Let's assume the database price is for a 6" Round, 1 Layer for simplicity, 
        // or we use the volume logic as requested.

        // Volume of current selection
        const radius = size / 2;
        const height = layers * 2; // Assume 2 inches per layer
        const currentVolume = Math.PI * (radius * radius) * height;

        // Volume of Base (Standard 6" 1 Layer)
        const baseRadius = 3; // 6/2
        const baseHeight = 2; // 1 layer
        const baseVolume = Math.PI * (baseRadius * baseRadius) * baseHeight;

        const volumeRatio = currentVolume / baseVolume;

        // Price Calculation
        let price = (recipe.selling_price || 5000) * volumeRatio;

        // Add Filling Price (Simplified)
        if (selectedFillingId) {
            price += (layers - 1) * 1000; // 1000 per filling layer
        }

        setTotalPrice((Math.round(price / 100) * 100) * quantity); // Round to nearest 100
    };

    const addToCart = () => {
        const newItem = {
            id: Date.now(),
            shape: selectedShape,
            size,
            layers,
            flavorId: selectedFlavorId,
            fillingId: selectedFillingId,
            color,
            quantity,
            price: totalPrice,
            flavorName: recipes.find(r => r.id === selectedFlavorId)?.name,
            fillingName: fillings.find(f => f.id === selectedFillingId)?.name
        };
        setCart([...cart, newItem]);
        setView('cart');
    };

    const resetBuilder = () => {
        // Reset to defaults
        setSize(6);
        setLayers(2);
        setQuantity(1);
        setView('builder');
    };

    if (view === 'cart') {
        const grandTotal = cart.reduce((sum, item) => sum + item.price, 0);
        return (
            <div className="min-h-screen bg-[#FDFBF7] p-8 font-sans text-slate-800">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-serif text-[#B03050] mb-8">Your Cake Cart</h1>

                    <div className="space-y-4 mb-8">
                        {cart.map((item, idx) => (
                            <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg">Cake #{idx + 1}</h3>
                                    <p className="text-slate-500 text-sm">
                                        {item.size}" {item.shape} • {item.layers} Layers • {item.flavorName}
                                    </p>
                                    <p className="text-slate-500 text-sm">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xl text-[#B03050]">₦{item.price.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-200 pt-6 mb-8">
                        <span className="text-xl font-bold">Total</span>
                        <span className="text-3xl font-serif font-bold text-[#B03050]">₦{grandTotal.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={resetBuilder}
                            className="flex-1 py-4 bg-white border-2 border-[#B03050] text-[#B03050] rounded-xl font-bold hover:bg-pink-50 transition-all"
                        >
                            + Build Another Cake
                        </button>
                        <button className="flex-[2] py-4 bg-[#B03050] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#902040] transition-all">
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row font-sans text-slate-800">

            {/* Left: 3D Canvas */}
            <div className="w-full md:w-2/3 h-[50vh] md:h-screen bg-[#E8ECE9] relative">
                <div className="absolute top-6 left-6 z-10">
                    <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-[#B03050] transition-colors font-bold">
                        <ShoppingBag className="w-5 h-5" />
                        Back to Home
                    </Link>
                </div>

                <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-slate-400">Loading 3D Engine...</div>}>
                    <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
                        <Environment preset="city" />
                        <Stage intensity={0.5} environment="city" adjustCamera={false}>
                            <CakeModel
                                shape={selectedShape}
                                size={size}
                                layers={layers}
                                color={color}
                            />
                        </Stage>
                        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
                    </Canvas>
                </Suspense>

                <div className="absolute bottom-6 left-0 right-0 text-center text-slate-400 text-sm font-medium pointer-events-none">
                    Drag to rotate • Scroll to zoom
                </div>
            </div>

            {/* Right: Controls */}
            <div className="w-full md:w-1/3 h-auto md:h-screen overflow-y-auto bg-white border-l border-[#E8ECE9] p-8 shadow-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-serif text-[#B03050] mb-2">Build Your Cake</h1>
                    <p className="text-slate-500">Customize every layer to perfection.</p>
                </div>

                <div className="space-y-8">
                    {/* Flavor Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Palette className="w-4 h-4" /> Flavor
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {recipes.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => {
                                        setSelectedFlavorId(r.id);
                                        // Simple color mapping for demo
                                        if (r.name.includes("Chocolate")) setColor("#5D4037");
                                        else if (r.name.includes("Red Velvet")) setColor("#9E2A2B");
                                        else if (r.name.includes("Strawberry")) setColor("#FFB7B2");
                                        else if (r.name.includes("Lemon")) setColor("#FFF9C4");
                                        else setColor("#F5E6D3");
                                    }}
                                    className={`p-3 rounded-xl border text-left transition-all ${selectedFlavorId === r.id
                                        ? 'border-[#B03050] bg-[#B03050] text-white shadow-md'
                                        : 'border-[#E8ECE9] hover:border-[#B03050] text-slate-600'
                                        }`}
                                >
                                    <span className="font-bold block">{r.name}</span>
                                    <span className="text-xs opacity-80">₦{r.selling_price?.toLocaleString()} base</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size Slider */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Ruler className="w-4 h-4" /> Size (Diameter)
                        </label>
                        <input
                            type="range"
                            min="4"
                            max="12"
                            step="2"
                            value={size}
                            onChange={(e) => setSize(Number(e.target.value))}
                            className="w-full accent-[#B03050] h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-2 text-sm font-bold text-slate-600">
                            <span>4"</span>
                            <span>6"</span>
                            <span>8"</span>
                            <span>10"</span>
                            <span>12"</span>
                        </div>
                        <div className="mt-2 text-center font-bold text-[#B03050] text-lg">{size} Inches</div>
                    </div>

                    {/* Layers Control */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Layers (Height)
                        </label>
                        <div className="flex items-center justify-center gap-6 bg-[#FAFAFA] p-4 rounded-xl border border-[#E8ECE9]">
                            <button
                                onClick={() => setLayers(Math.max(1, layers - 1))}
                                className="w-10 h-10 rounded-full bg-white border border-[#E8ECE9] flex items-center justify-center hover:bg-[#B03050] hover:text-white transition-colors font-bold text-xl"
                            >
                                -
                            </button>
                            <span className="text-2xl font-serif font-bold text-slate-800 w-8 text-center">{layers}</span>
                            <button
                                onClick={() => setLayers(Math.min(6, layers + 1))}
                                className="w-10 h-10 rounded-full bg-white border border-[#E8ECE9] flex items-center justify-center hover:bg-[#B03050] hover:text-white transition-colors font-bold text-xl"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Quantity Control */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Quantity
                        </label>
                        <div className="flex items-center justify-center gap-6 bg-[#FAFAFA] p-4 rounded-xl border border-[#E8ECE9]">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 rounded-full bg-white border border-[#E8ECE9] flex items-center justify-center hover:bg-[#B03050] hover:text-white transition-colors font-bold text-xl"
                            >
                                -
                            </button>
                            <span className="text-2xl font-serif font-bold text-slate-800 w-8 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 rounded-full bg-white border border-[#E8ECE9] flex items-center justify-center hover:bg-[#B03050] hover:text-white transition-colors font-bold text-xl"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Total Price */}
                    <div className="pt-8 border-t border-[#E8ECE9]">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-slate-500 font-medium">Estimated Price</span>
                            <span className="text-4xl font-serif font-bold text-[#B03050]">₦{totalPrice.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={addToCart}
                            className="w-full py-4 bg-[#B03050] text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-200 hover:bg-[#902040] transition-all flex items-center justify-center gap-2"
                        >
                            Add to Order <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
