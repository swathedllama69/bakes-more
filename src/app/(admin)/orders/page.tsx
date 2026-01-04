"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CalendarDays, Search, Plus, Clock, ChevronDown, ChevronUp, CheckCircle, Printer, Trash2, MoreHorizontal, ArrowRight } from "lucide-react";

export default function OrderManager() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sourceFilter, setSourceFilter] = useState("All");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const { data } = await supabase
            .from("orders")
            .select("*, order_items(*, recipes(name))")
            .order("created_at", { ascending: false });
        setOrders(data || []);
        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "Confirmed": return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case "Processing": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Baking": return "bg-blue-100 text-blue-700 border-blue-200"; // Legacy support
            case "Ready": return "bg-green-100 text-green-700 border-green-200";
            case "Delivered": return "bg-slate-100 text-slate-600 border-slate-200";
            case "Cancelled": return "bg-red-50 text-red-600 border-red-100";
            default: return "bg-slate-50 text-slate-500 border-slate-100";
        }
    };

    const toggleSelectOrder = (id: string) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedOrderIds.length === filteredOrders.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(filteredOrders.map(o => o.id));
        }
    };

    const deleteSelectedOrders = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedOrderIds.length} orders?`)) return;

        // Delete order items first (cascade usually handles this but safer to be explicit if needed, 
        // though here we'll rely on cascade or just delete orders if configured)
        // Assuming cascade delete is set up in DB, otherwise we need to delete items first.
        // Let's try deleting orders directly.
        const { error } = await supabase.from("orders").delete().in("id", selectedOrderIds);

        if (error) {
            alert("Error deleting orders: " + error.message);
        } else {
            setOrders(prev => prev.filter(o => !selectedOrderIds.includes(o.id)));
            setSelectedOrderIds([]);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
        if (!error) {
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        } else {
            alert(`Failed to update status: ${error.message}`);
            console.error("Error updating status:", error);
        }
    };

    const markAsPaid = async (order: any) => {
        if (!confirm("Mark this order as fully paid?")) return;
        const { error } = await supabase.from("orders").update({ amount_paid: order.total_price }).eq("id", order.id);
        if (!error) {
            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, amount_paid: order.total_price } : o));
        }
    };

    const filteredOrders = orders
        .filter(order => {
            const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.id.toString().includes(searchTerm);
            const matchesStatus = statusFilter === "All" || order.status === statusFilter;
            const matchesSource = sourceFilter === "All" || order.source === sourceFilter;
            return matchesSearch && matchesStatus && matchesSource;
        })
        .sort((a, b) => {
            const dateA = new Date(a.delivery_date || a.created_at).getTime();
            const dateB = new Date(b.delivery_date || b.created_at).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 bg-[#FDFBF7]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-serif text-[#B03050] flex items-center gap-3">
                        <ShoppingBag className="w-8 h-8" />
                        Order Management
                    </h1>
                    <p className="text-slate-500 font-medium">Track production and deliveries</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Link
                        href="/planner"
                        className="bg-white text-slate-700 border border-[#E8ECE9] px-4 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                    >
                        <CalendarDays className="w-5 h-5" />
                        <span className="hidden md:inline">Planner</span>
                    </Link>
                    <Link
                        href="/orders/new"
                        className="bg-[#B03050] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] transition-all flex items-center gap-2 flex-1 md:flex-none justify-center"
                    >
                        <Plus className="w-5 h-5" />
                        New Order
                    </Link>
                </div>
            </header>

            {/* Filters & Bulk Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
                {selectedOrderIds.length > 0 ? (
                    <div className="flex-1 bg-[#B03050] text-white p-2 rounded-xl flex items-center justify-between px-4 shadow-md animate-in fade-in slide-in-from-top-2">
                        <span className="font-bold">{selectedOrderIds.length} selected</span>
                        <button
                            onClick={deleteSelectedOrders}
                            className="bg-white text-[#B03050] px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 bg-white p-2 rounded-xl border border-[#E8ECE9] flex items-center gap-3 shadow-sm w-full">
                        <Search className="w-5 h-5 text-slate-400 ml-2" />
                        <input
                            type="text"
                            placeholder="Search customer or order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 outline-none text-slate-700 font-medium placeholder:text-slate-300"
                        />
                    </div>
                )}

                <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="bg-white text-slate-600 border border-[#E8ECE9] px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 min-w-[140px] justify-center"
                >
                    <Clock className="w-4 h-4" />
                    <span>Sort: {sortOrder === 'asc' ? 'Oldest' : 'Newest'}</span>
                </button>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 max-w-full">
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-[#E8ECE9] rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-[#B03050]"
                    >
                        <option value="All">All Sources</option>
                        <option value="Website">Website</option>
                        <option value="Instagram">Instagram</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Phone">Phone</option>
                        <option value="Walk-in">Walk-in</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-[#E8ECE9] rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-[#B03050]"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Ready">Ready</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* List Header */}
            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-6 px-6 py-3 text-xs font-bold uppercase text-slate-400 tracking-wider">
                <div className="w-6">
                    <input
                        type="checkbox"
                        checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-[#B03050] focus:ring-[#B03050]"
                    />
                </div>
                <div>Order Details</div>
                <div className="text-right">Date</div>
                <div className="text-right">Amount</div>
                <div className="text-center">Status</div>
                <div className="w-8"></div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400 animate-pulse">Loading Orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-[#E8ECE9]">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 mb-4 font-medium">No orders found matching your criteria.</p>
                    {searchTerm === "" && statusFilter === "All" && (
                        <Link href="/orders/new" className="text-[#B03050] font-bold hover:underline">Create your first order</Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        const isSelected = selectedOrderIds.includes(order.id);
                        const balance = (order.total_price || 0) - (order.amount_paid || 0);

                        return (
                            <div
                                key={order.id}
                                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'shadow-lg border-[#B03050] ring-1 ring-[#B03050]/10' : 'shadow-sm border-[#E8ECE9] hover:border-slate-300'
                                    } ${isSelected ? 'bg-pink-50/30' : ''}`}
                            >
                                {/* Main Row */}
                                <div
                                    className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 md:gap-6 items-center cursor-pointer"
                                    onClick={(e) => {
                                        // Don't expand if clicking checkbox or interactive elements
                                        if ((e.target as HTMLElement).closest('input, button, select, a')) return;
                                        setExpandedOrderId(isExpanded ? null : order.id);
                                    }}
                                >
                                    {/* Checkbox */}
                                    <div className="flex items-center justify-between md:justify-start md:w-6">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelectOrder(order.id)}
                                            className="w-5 h-5 rounded border-slate-300 text-[#B03050] focus:ring-[#B03050]"
                                        />
                                        {/* Mobile Status Badge (visible only on mobile) */}
                                        <span className={`md:hidden px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    {/* Order Info */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-serif text-slate-800 font-bold">
                                                {order.customer_name}
                                            </h3>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                #{order.id.slice(0, 8)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs mt-1">
                                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{order.source || 'Unknown'}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-slate-500 truncate max-w-[200px]">
                                                {order.order_items.map((item: any) =>
                                                    `${item.quantity}x ${Array.isArray(item.recipes) ? item.recipes[0]?.name : item.recipes?.name || "Custom Cake"}`
                                                ).join(", ")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="text-right md:text-right text-sm text-slate-600">
                                        <div className="flex items-center justify-end gap-2">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <span className="font-medium">
                                                {new Date(order.delivery_date || order.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">Due Date</p>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right">
                                        <p className="font-serif font-bold text-slate-800">₦{order.total_price?.toLocaleString()}</p>
                                        <p className={`text-xs font-bold ${balance <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {balance <= 0 ? 'Paid' : `Due: ₦${balance.toLocaleString()}`}
                                        </p>
                                    </div>

                                    {/* Status (Desktop) */}
                                    <div className="hidden md:block text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(order.status)}`}>
                                            {order.status === 'Baking' ? 'Processing' : order.status}
                                        </span>
                                    </div>

                                    {/* Expand Icon */}
                                    <div className="hidden md:flex justify-center text-slate-400">
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-4 md:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50">
                                        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">

                                            {/* Quick Actions */}
                                            <div className="flex flex-wrap gap-3 w-full md:w-auto order-2 md:order-1">
                                                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                                    <span className="text-xs font-bold text-slate-400 px-2 uppercase">Status:</span>
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateStatus(order.id, e.target.value)}
                                                        className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer py-1 pr-2"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Confirmed">Confirmed</option>
                                                        <option value="Processing">Processing</option>
                                                        <option value="Ready">Ready</option>
                                                        <option value="Delivered">Delivered</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </div>

                                                {balance > 0 && (
                                                    <button
                                                        onClick={() => markAsPaid(order)}
                                                        className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Mark Paid
                                                    </button>
                                                )}

                                                <Link
                                                    href={`/orders/${order.id}/invoice`}
                                                    target="_blank"
                                                    className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                                                >
                                                    <Printer className="w-4 h-4" /> Receipt
                                                </Link>

                                                <Link
                                                    href={`/orders/${order.id}`}
                                                    className="flex items-center gap-2 bg-[#B03050] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#902040] transition-colors shadow-sm shadow-pink-200"
                                                >
                                                    View Full Details <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>

                                            {/* Items List */}
                                            <div className="w-full md:w-1/2 order-1 md:order-2">
                                                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Order Items</h4>
                                                <div className="space-y-2">
                                                    {order.order_items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded border border-slate-100">
                                                            <span className="font-medium text-slate-700">
                                                                {item.quantity}x {Array.isArray(item.recipes) ? item.recipes[0]?.name : item.recipes?.name || "Custom Cake"}
                                                                <span className="text-slate-400 text-xs ml-1">({item.size_inches}")</span>
                                                            </span>
                                                            <span className="font-mono text-slate-500">₦{(item.item_price * item.quantity).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Helper for icon (not used in main render but good to have)
function ShoppingBag({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    );
}