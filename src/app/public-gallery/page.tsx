"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Instagram, ExternalLink, ArrowLeft, ChefHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function PublicGalleryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        const { data, error } = await supabase
            .from("gallery_items")
            .select("*")
            .order("is_featured", { ascending: false })
            .order("display_order", { ascending: false })
            .order("created_at", { ascending: false });

        if (!error && data) {
            setItems(data);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Header */}
            <header className="p-6 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                            <Image
                                src="/logo.png"
                                alt="Bakes & More Logo"
                                fill
                                className="object-contain"
                                sizes="64px"
                                loading="eager"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-[#B03050]">Gallery</h1>
                            <p className="text-sm text-slate-500">Our Latest Creations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href="https://www.instagram.com/bakesandmore_byhafsaa/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:scale-105 transition-all shadow-lg"
                        >
                            <Instagram className="w-4 h-4" />
                            Follow Us
                        </a>
                        <Link href="/" className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-[#B03050] transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Gallery Content */}
            <main className="py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 border-4 border-[#B03050] border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-slate-500">Loading gallery...</p>
                            </div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-20 space-y-6">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                                <ChefHat className="w-12 h-12 text-slate-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif text-slate-800 mb-2">Gallery Coming Soon!</h2>
                                <p className="text-slate-500">We're working on adding beautiful photos of our creations.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <a
                                    href="https://www.instagram.com/bakesandmore_byhafsaa/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:scale-105 transition-all shadow-lg"
                                >
                                    <Instagram className="w-5 h-5" />
                                    See Our Instagram
                                </a>
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-full font-bold hover:bg-slate-50 transition-all"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Back to Home
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="mb-8 text-center">
                                <p className="text-slate-600">
                                    <span className="font-bold text-[#B03050] text-2xl">{items.length}</span> {items.length === 1 ? 'creation' : 'creations'} to inspire you
                                </p>
                            </div>

                            {/* Masonry Grid */}
                            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                                {items.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="break-inside-avoid"
                                    >
                                        <div
                                            onClick={() => setSelectedItem(item)}
                                            className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer border border-slate-100"
                                        >
                                            {/* Featured Badge */}
                                            {item.is_featured && (
                                                <div className="absolute top-3 left-3 z-10 bg-[#D4AF37] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-1">
                                                    ⭐ Featured
                                                </div>
                                            )}

                                            {/* Image */}
                                            <div className="relative overflow-hidden">
                                                <img
                                                    src={item.thumbnail_url || item.image_url}
                                                    alt={item.caption || 'Gallery image'}
                                                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                                {/* Overlay on hover */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
                                                    <div className="text-white font-bold text-sm flex items-center gap-2">
                                                        <ExternalLink className="w-4 h-4" />
                                                        Click to view
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Caption */}
                                            {item.caption && (
                                                <div className="p-4">
                                                    <p className="text-sm text-slate-600 line-clamp-3">
                                                        {item.caption}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Bottom CTA */}
                            <div className="mt-12 text-center space-y-4">
                                <p className="text-slate-600">Love what you see?</p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link
                                        href="/order"
                                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#B03050] text-white rounded-full font-bold hover:bg-[#902040] hover:scale-105 transition-all shadow-xl"
                                    >
                                        <ChefHat className="w-5 h-5" />
                                        Place Your Order
                                    </Link>
                                    <a
                                        href="https://www.instagram.com/bakesandmore_byhafsaa/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:scale-105 transition-all shadow-xl"
                                    >
                                        <Instagram className="w-5 h-5" />
                                        Follow on Instagram
                                    </a>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedItem(null)}
                        className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-5xl max-h-[90vh] w-full"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute -top-12 right-0 text-white hover:text-[#B03050] transition-colors z-10"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            {/* Image */}
                            <div className="relative">
                                <img
                                    src={selectedItem.image_url || selectedItem.thumbnail_url}
                                    alt={selectedItem.caption || 'Gallery image'}
                                    className="w-full h-auto max-h-[70vh] object-contain rounded-2xl"
                                />
                                {selectedItem.is_featured && (
                                    <div className="absolute top-4 left-4 bg-[#D4AF37] text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl">
                                        ⭐ Featured Creation
                                    </div>
                                )}
                            </div>

                            {/* Caption and Actions */}
                            <div className="mt-4 bg-white p-6 rounded-2xl space-y-4">
                                {selectedItem.caption && (
                                    <p className="text-slate-700 leading-relaxed">{selectedItem.caption}</p>
                                )}
                                <div className="flex flex-wrap gap-3">
                                    <a
                                        href={selectedItem.instagram_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:scale-105 transition-all shadow-lg"
                                    >
                                        <Instagram className="w-4 h-4" />
                                        View on Instagram
                                    </a>
                                    <Link
                                        href="/order"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#B03050] text-white rounded-full font-bold hover:bg-[#902040] transition-all"
                                    >
                                        <ChefHat className="w-4 h-4" />
                                        Order Similar
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
