"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Star, GripVertical, Image as ImageIcon, Upload } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function GalleryManager() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUrl, setNewUrl] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [adding, setAdding] = useState(false);
    const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, onConfirm: () => { } });

    useEffect(() => {
        fetchGalleryItems();
    }, []);

    const fetchGalleryItems = async () => {
        const { data, error } = await supabase
            .from("gallery_items")
            .select("*")
            .order("display_order", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching gallery:", error);
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const addInstagramPost = async () => {
        if (!newUrl.trim() || !imageFile) {
            setModalConfig({
                isOpen: true,
                title: "Missing Information",
                message: "Please provide both Instagram URL and upload an image file",
                type: "danger",
                onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false }),
                onClose: () => setModalConfig({ ...modalConfig, isOpen: false })
            });
            return;
        }

        setAdding(true);
        try {
            // Extract post ID
            const postIdMatch = newUrl.match(/\/p\/([^\/\?]+)/);
            if (!postIdMatch) {
                throw new Error('Invalid Instagram URL. Use format: https://www.instagram.com/p/...');
            }

            const postId = postIdMatch[1];

            // Check if URL already exists
            const { data: existing, error: checkError } = await supabase
                .from("gallery_items")
                .select("id")
                .eq("instagram_url", newUrl)
                .maybeSingle();

            if (existing) {
                throw new Error('This Instagram post is already in your gallery!');
            }

            // Upload image to Supabase Storage
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${postId}-${Date.now()}.${fileExt}`;
            const filePath = `gallery/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('gallery-images')
                .upload(filePath, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw new Error(`Failed to upload image: ${uploadError.message}`);
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('gallery-images')
                .getPublicUrl(filePath);

            // Save to database
            const { error } = await supabase
                .from("gallery_items")
                .insert({
                    instagram_url: newUrl,
                    image_url: publicUrl,
                    thumbnail_url: publicUrl,
                    caption: caption || '',
                    media_type: 'IMAGE',
                    display_order: items.length
                });

            if (error) {
                throw error;
            }

            setNewUrl("");
            setImageFile(null);
            setCaption("");
            fetchGalleryItems();

            setModalConfig({
                isOpen: true,
                title: "Success",
                message: "Instagram post added to gallery!",
                type: "success",
                onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false }),
                onClose: () => setModalConfig({ ...modalConfig, isOpen: false })
            });
        } catch (error: any) {
            setModalConfig({
                isOpen: true,
                title: "Error",
                message: error.message || "Failed to add post. Please try again.",
                type: "danger",
                onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false }),
                onClose: () => setModalConfig({ ...modalConfig, isOpen: false })
            });
        }
        setAdding(false);
    };

    const deleteItem = async (id: string) => {
        setModalConfig({
            isOpen: true,
            title: "Delete Gallery Item",
            message: "Are you sure you want to remove this from the gallery?",
            type: "danger",
            onConfirm: async () => {
                const { error } = await supabase
                    .from("gallery_items")
                    .delete()
                    .eq("id", id);

                if (!error) {
                    fetchGalleryItems();
                }
                setModalConfig({ ...modalConfig, isOpen: false });
            },
            onClose: () => setModalConfig({ ...modalConfig, isOpen: false })
        });
    };

    const toggleFeatured = async (id: string, currentValue: boolean) => {
        const { error } = await supabase
            .from("gallery_items")
            .update({ is_featured: !currentValue })
            .eq("id", id);

        if (!error) {
            fetchGalleryItems();
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B03050] mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <ConfirmationModal {...modalConfig} />

            <div className="mb-8">
                <h1 className="text-3xl font-serif text-[#B03050] mb-2">Gallery Manager</h1>
                <p className="text-slate-500">Add Instagram posts to your website gallery</p>
            </div>

            {/* Add New Post */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8ECE9] mb-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Add Instagram Post</h2>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Instagram Post URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://www.instagram.com/p/ABC123/"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#B03050]"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Go to Instagram post → Click ••• → Copy link
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Upload Image <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#B03050]"
                        />
                        {imageFile && (
                            <p className="text-xs text-green-600 mt-1">
                                ✓ Selected: {imageFile.name}
                            </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                            Save image from Instagram and upload here
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Caption (Optional)
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Describe this creation..."
                            rows={2}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#B03050] resize-none"
                        />
                    </div>

                    <button
                        onClick={addInstagramPost}
                        disabled={adding || !newUrl.trim() || !imageFile}
                        className="w-full px-6 py-3 bg-[#B03050] text-white rounded-xl font-bold hover:bg-[#902040] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {adding ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Add to Gallery
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-bold text-blue-900 mb-2">✨ How to add images:</p>
                    <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                        <li>Go to Instagram post → Click ••• → Copy link → Paste above</li>
                        <li>Right-click Instagram image → Save image to computer</li>
                        <li>Upload the file above</li>
                        <li>Click "Add to Gallery" - done! 🎉</li>
                    </ol>
                    <p className="text-xs text-blue-700 mt-2 italic">💡 Images are stored in your Supabase project!</p>
                </div>
            </div>

            {/* Gallery Items */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8ECE9]">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                    Gallery Items ({items.length})
                </h2>

                {items.length === 0 ? (
                    <div className="text-center py-12">
                        <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 mb-2">No gallery items yet</p>
                        <p className="text-sm text-slate-400">Add your first Instagram post above!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="group relative bg-slate-50 rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all"
                            >
                                {/* Image */}
                                <div className="aspect-square bg-slate-100 relative">
                                    {item.thumbnail_url ? (
                                        <img
                                            src={item.thumbnail_url}
                                            alt={item.caption || 'Gallery item'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-12 h-12 text-slate-300" />
                                        </div>
                                    )}

                                    {/* Featured Badge */}
                                    {item.is_featured && (
                                        <div className="absolute top-2 left-2 bg-[#D4AF37] text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Star className="w-3 h-3" fill="currentColor" />
                                            Featured
                                        </div>
                                    )}
                                </div>

                                {/* Caption */}
                                {item.caption && (
                                    <div className="p-3 bg-white">
                                        <p className="text-xs text-slate-600 line-clamp-2">{item.caption}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                                    <button
                                        onClick={() => toggleFeatured(item.id, item.is_featured)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${item.is_featured
                                                ? 'bg-[#D4AF37] text-white hover:bg-[#c49f2f]'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Star className="w-3 h-3 inline mr-1" fill={item.is_featured ? 'currentColor' : 'none'} />
                                        {item.is_featured ? 'Featured' : 'Feature'}
                                    </button>
                                    <a
                                        href={item.instagram_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        View Post
                                    </a>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
