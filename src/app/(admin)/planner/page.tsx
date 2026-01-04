"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarDays, Clock, ChevronLeft, ChevronRight, User, Package, X, CheckCircle, AlertCircle, Truck } from "lucide-react";
import Link from "next/link";

export default function ProductionPlanner() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const { data } = await supabase
            .from("orders")
            .select("*, order_items(*, recipes(name), fillings(name))")
            .neq("status", "Cancelled") // Show everything except cancelled
            .order("delivery_date", { ascending: true });

        if (data) {
            setOrders(data);
        }
        setLoading(false);
    };

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const getOrdersForDate = (day: number) => {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return orders.filter(order => {
            if (!order.delivery_date) return false;
            const orderDate = new Date(order.delivery_date);
            const isSameDate = orderDate.getDate() === day &&
                orderDate.getMonth() === currentDate.getMonth() &&
                orderDate.getFullYear() === currentDate.getFullYear();

            if (!isSameDate) return false;

            // Apply Filter
            if (filterStatus === 'All') return true;
            if (filterStatus === 'Active') return ['Pending', 'Confirmed', 'Baking', 'Ready'].includes(order.status);
            return order.status === filterStatus;
        });
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delivered': return 'bg-slate-100 text-slate-500 border-slate-200';
            case 'Ready': return 'bg-green-50 text-green-600 border-green-200';
            case 'Baking': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'Pending': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
            case 'Quote': return 'bg-purple-50 text-purple-600 border-purple-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400">Loading Calendar...</div>;

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 relative bg-[#FDFBF7]">
            <div className="mb-8">
                <Link href="/orders" className="inline-flex items-center gap-2 bg-white text-slate-600 px-5 py-2.5 rounded-full font-bold shadow-sm border border-[#E8ECE9] hover:bg-[#B03050] hover:text-white hover:border-[#B03050] transition-all group mb-6">
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Orders
                </Link>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-serif text-[#B03050] flex items-center gap-3">
                            <CalendarDays className="w-8 h-8" />
                            Production Calendar
                        </h1>
                        <p className="text-slate-500 font-medium">Schedule for {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Filters */}
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            {['All', 'Active', 'Pending', 'Baking', 'Ready', 'Delivered'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === status
                                        ? 'bg-slate-800 text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Month Navigation */}
                        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100 self-start md:self-auto">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="font-bold text-slate-700 w-32 text-center">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="py-4 text-center text-xs font-black uppercase text-slate-400 tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 auto-rows-fr min-h-[600px]">
                    {blanks.map(blank => (
                        <div key={`blank-${blank}`} className="bg-slate-50/50 border-b border-r border-slate-100 p-4 min-h-[120px]"></div>
                    ))}

                    {days.map(day => {
                        const dayOrders = getOrdersForDate(day);
                        const isToday = day === new Date().getDate() &&
                            currentDate.getMonth() === new Date().getMonth() &&
                            currentDate.getFullYear() === new Date().getFullYear();

                        return (
                            <div key={day} className={`border-b border-r border-slate-100 p-2 md:p-4 min-h-[120px] transition-colors hover:bg-pink-50/30 ${isToday ? 'bg-pink-50/50' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#B03050] text-white' : 'text-slate-400'}`}>
                                        {day}
                                    </span>
                                    {dayOrders.length > 0 && (
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                            {dayOrders.length}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {dayOrders.map(order => (
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            key={order.id}
                                            className={`w-full text-left block p-2 rounded-lg border shadow-sm hover:shadow-md transition-all group ${getStatusColor(order.status)}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'Delivered' ? 'bg-slate-400' :
                                                    order.status === 'Ready' ? 'bg-green-500' :
                                                        order.status === 'Baking' ? 'bg-blue-500' : 'bg-yellow-500'
                                                    }`} />
                                                <span className="text-xs font-bold truncate">
                                                    {order.customer_name}
                                                </span>
                                            </div>
                                            <div className="text-[10px] opacity-70 pl-3.5 truncate">
                                                {order.order_items.length} Items
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick View Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${getStatusColor(selectedOrder.status)}`}>
                                        <div className={`w-2 h-2 rounded-full ${selectedOrder.status === 'Delivered' ? 'bg-slate-400' :
                                            selectedOrder.status === 'Ready' ? 'bg-green-500' :
                                                selectedOrder.status === 'Baking' ? 'bg-blue-500' : 'bg-yellow-500'
                                            }`} />
                                        {selectedOrder.status}
                                    </div>
                                    <h2 className="text-2xl font-serif font-bold text-slate-800">{selectedOrder.customer_name}</h2>
                                    <p className="text-slate-500 text-sm font-medium mt-1">
                                        Delivery: {new Date(selectedOrder.delivery_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">Order Items</h3>
                                    <div className="space-y-4">
                                        {selectedOrder.order_items.map((item: any, i: number) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#B03050] shadow-sm border border-slate-100 font-bold text-sm">
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700">{item.recipes?.name || 'Custom Item'}</p>
                                                    <p className="text-xs text-slate-500">{item.size_inches}" • {item.layers} Layers {item.fillings?.name ? `• ${item.fillings.name}` : ''}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedOrder.notes && (
                                    <div>
                                        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-2">Notes</h3>
                                        <p className="text-sm text-slate-600 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                            {selectedOrder.notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex gap-3">
                                <Link
                                    href={`/orders/${selectedOrder.id}`}
                                    className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold text-center hover:bg-slate-700 transition-colors"
                                >
                                    View Full Details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
