"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Instagram, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GallerySection() {
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
            .order("created_at", { ascending: false })
            .limit(12);

        if (!error && data) {
            setItems(data);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <section className="py-20 px-4 bg-[#FDFBF7]">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="animate-pulse">
                        <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-4"></div>
                        <div className="h-4 bg-slate-200 rounded w-64 mx-auto"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (items.length === 0) {
        return null; // Don't show section if no items
    }

    return (
        <>
            <section className="py-20 px-4 bg-[#FDFBF7]">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-serif text-[#B03050] mb-4">
                            Our Gallery
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            See our latest creations and get inspired for your next celebration
                        </p>
                        <a
                            href="https://www.instagram.com/bakesandmore_byhafsaa/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-4 text-[#B03050] font-bold hover:underline"
                        >
                            <Instagram className="w-5 h-5" />
                            Follow us on Instagram
                        </a>
                    </div>

                    {/* Masonry Grid */}
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="break-inside-avoid"
                            >
                                <div
                                    onClick={() => setSelectedItem(item)}
                                    className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-slate-100"
                                >
                                    {/* Featured Badge */}
                                    {item.is_featured && (
                                        <div className="absolute top-3 left-3 z-10 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                            ⭐ Featured
                                        </div>
                                    )}

                                    {/* Image */}
                                    <div className="relative overflow-hidden">
                                        <img
                                            src={item.thumbnail_url || item.image_url}
                                            alt={item.caption || 'Gallery image'}
                                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {/* Overlay on hover */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ExternalLink className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Caption */}
                                    {item.caption && (
                                        <div className="p-4">
                                            <p className="text-sm text-slate-600 line-clamp-2">
                                                {item.caption}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* View More */}
                    {items.length >= 12 && (
                        <div className="text-center mt-12">
                            <a
                                href="https://www.instagram.com/bakesandmore_byhafsaa/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-[#B03050] text-white rounded-full font-bold hover:bg-[#902040] transition-colors shadow-lg hover:shadow-xl"
                            >
                                <Instagram className="w-5 h-5" />
                                See More on Instagram
                            </a>
                        </div>
                    )}
                </div>
            </section>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedItem(null)}
                        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-4xl max-h-[90vh] w-full"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute -top-12 right-0 text-white hover:text-[#B03050] transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            {/* Image */}
                            <img
                                src={`/api/image-proxy?url=${encodeURIComponent(selectedItem.image_url || selectedItem.thumbnail_url)}`}
                                alt={selectedItem.caption || 'Gallery image'}
                                className="w-full h-auto max-h-[70vh] object-contain rounded-2xl"
                            />

                            {/* Caption and Link */}
                            <div className="mt-4 bg-white p-6 rounded-2xl">
                                {selectedItem.caption && (
                                    <p className="text-slate-700 mb-4">{selectedItem.caption}</p>
                                )}
                                <a
                                    href={selectedItem.instagram_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#B03050] font-bold hover:underline"
                                >
                                    <Instagram className="w-5 h-5" />
                                    View on Instagram
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
