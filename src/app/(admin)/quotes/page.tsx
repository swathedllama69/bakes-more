"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Search, Plus, FileText, Calendar, User, ArrowRight, Trash2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        const { data, error } = await supabase
            .from("orders")
            .select("*, order_items(*, recipes(name))")
            .eq("status", "Quote")
            .order("created_at", { ascending: false });

        if (error) console.error("Error fetching quotes:", error);
        setQuotes(data || []);
        setLoading(false);
    };

    const deleteQuote = async (id: string) => {
        if (!confirm("Are you sure you want to delete this quote?")) return;
        const { error } = await supabase.from("orders").delete().eq("id", id);
        if (!error) {
            setQuotes(prev => prev.filter(q => q.id !== id));
        }
    };

    const convertToOrder = async (quote: any) => {
        if (!confirm("Convert this quote to a confirmed order?")) return;
        const { error } = await supabase
            .from("orders")
            .update({ status: "Pending", created_at: new Date().toISOString() }) // Reset date to now? Or keep original? Usually convert means "it's an order now"
            .eq("id", quote.id);

        if (!error) {
            router.push(`/orders/${quote.id}`);
        }
    };

    const filteredQuotes = quotes.filter(quote =>
        quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.id.toString().includes(searchTerm)
    );

    if (loading) return <div className="p-12 text-center text-slate-400">Loading Quotes...</div>;

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 bg-[#FDFBF7]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-[#B03050]">Saved Quotes</h1>
                    <p className="text-slate-400 mt-1">Manage and convert your price estimates</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search quotes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-full border border-[#E8ECE9] focus:outline-none focus:border-[#B03050] w-64 text-sm"
                        />
                    </div>
                    <Link href="/Calculator" className="flex items-center gap-2 bg-[#B03050] text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] transition-all">
                        <Plus className="w-5 h-5" />
                        New Quote
                    </Link>
                </div>
            </div>

            {/* Quotes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{quote.customer_name}</h3>
                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(quote.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-serif text-[#B03050]">₦{(quote.total_price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            {quote.order_items && quote.order_items.slice(0, 2).map((item: any, idx: number) => (
                                <div key={idx} className="text-sm text-slate-600 flex justify-between border-b border-slate-50 pb-1 last:border-0">
                                    <span>{item.recipes?.name || "Custom Item"}</span>
                                    <span className="text-slate-400">x{item.quantity}</span>
                                </div>
                            ))}
                            {quote.order_items && quote.order_items.length > 2 && (
                                <p className="text-xs text-slate-400 italic">+ {quote.order_items.length - 2} more items</p>
                            )}
                        </div>

                        <div className="flex gap-2 mt-auto pt-4 border-t border-[#E8ECE9]">
                            <button
                                onClick={() => convertToOrder(quote)}
                                className="flex-1 bg-slate-800 text-white py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
                            >
                                Convert to Order
                            </button>
                            <Link
                                href={`/orders/${quote.id}`}
                                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={() => deleteQuote(quote.id)}
                                className="px-3 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredQuotes.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <FileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-400">No quotes found</h3>
                    <p className="text-slate-300 text-sm mt-2">Create a new quote to get started</p>
                </div>
            )}
        </div>
    );
}
