"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, DollarSign, ShoppingBag, Clock, CheckCircle, TrendingUp, Users, Calendar } from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("all"); // all, month, year, custom
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const { data } = await supabase
            .from("orders")
            .select("*")
            .neq('status', 'Cancelled') // Exclude cancelled orders from reports
            .order("created_at", { ascending: false });
        setOrders(data || []);
        setLoading(false);
    };

    // --- Calculations ---

    const filterOrdersByTime = (orders: any[]) => {
        if (timeRange === 'all') return orders;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        return orders.filter(o => {
            const date = new Date(o.created_at);
            if (timeRange === 'month') return date >= startOfMonth;
            if (timeRange === 'year') return date >= startOfYear;
            if (timeRange === 'custom' && startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return date >= start && date <= end;
            }
            return true;
        });
    };

    const filteredOrders = filterOrdersByTime(orders);

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length;
    const completedOrders = filteredOrders.filter(o => o.status === 'Delivered' || o.status === 'Ready').length;

    // Group by Month
    const revenueByMonth = filteredOrders.reduce((acc: any, order) => {
        const date = new Date(order.created_at);
        const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[month]) acc[month] = { revenue: 0, count: 0 };
        acc[month].revenue += (order.total_price || 0);
        acc[month].count += 1;
        return acc;
    }, {});

    // Top Customers
    const topCustomers = filteredOrders.reduce((acc: any, order) => {
        const name = order.customer_name || "Unknown";
        if (!acc[name]) acc[name] = { revenue: 0, count: 0 };
        acc[name].revenue += (order.total_price || 0);
        acc[name].count += 1;
        return acc;
    }, {});

    const sortedCustomers = Object.entries(topCustomers)
        .map(([name, data]: [string, any]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    if (loading) return <div className="p-12 text-center text-slate-400">Loading Reports...</div>;

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 bg-[#FDFBF7]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 bg-white text-slate-600 px-5 py-2.5 rounded-full font-bold shadow-sm border border-[#E8ECE9] hover:bg-[#B03050] hover:text-white hover:border-[#B03050] transition-all group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                    <h1 className="text-3xl font-serif text-[#B03050]">Reports & Analytics</h1>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                    {timeRange === 'custom' && (
                        <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-[#E8ECE9] shadow-sm px-4">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-xs font-bold text-slate-600 outline-none bg-transparent"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-xs font-bold text-slate-600 outline-none bg-transparent"
                            />
                        </div>
                    )}
                    <div className="flex bg-white rounded-full p-1 border border-[#E8ECE9] shadow-sm">
                        {['all', 'year', 'month', 'custom'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${timeRange === range ? 'bg-[#B03050] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {range === 'all' ? 'All Time' : range === 'year' ? 'This Year' : range === 'month' ? 'This Month' : 'Custom'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-12 h-12 text-green-500" />
                    </div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total Revenue</p>
                    <p className="text-3xl font-serif text-slate-800">₦{totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingBag className="w-12 h-12 text-blue-500" />
                    </div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total Orders</p>
                    <p className="text-3xl font-serif text-slate-800">{totalOrders}</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-12 h-12 text-purple-500" />
                    </div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Avg. Order Value</p>
                    <p className="text-3xl font-serif text-slate-800">₦{averageOrderValue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-[#E8ECE9] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle className="w-12 h-12 text-orange-500" />
                    </div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Completion Rate</p>
                    <p className="text-3xl font-serif text-slate-800">
                        {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{completedOrders} completed / {pendingOrders} pending</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Breakdown */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                    <div className="flex items-center gap-3 mb-6">
                        <Calendar className="w-5 h-5 text-[#B03050]" />
                        <h2 className="text-lg font-serif text-slate-800">Monthly Performance</h2>
                    </div>
                    <div className="space-y-6">
                        {Object.entries(revenueByMonth).length > 0 ? (
                            Object.entries(revenueByMonth).map(([month, data]: [string, any], idx) => {
                                const maxRevenue = Math.max(...Object.values(revenueByMonth).map((d: any) => d.revenue));
                                const percentage = (data.revenue / maxRevenue) * 100;
                                return (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                            <span>{month}</span>
                                            <span>₦{data.revenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-[#B03050] h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-[#902040]"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1 text-right">{data.count} orders</p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-slate-400 py-8">No data available for this period.</p>
                        )}
                    </div>
                </div>

                {/* Top Customers */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E8ECE9]">
                    <div className="flex items-center gap-3 mb-6">
                        <Users className="w-5 h-5 text-[#B03050]" />
                        <h2 className="text-lg font-serif text-slate-800">Top Customers</h2>
                    </div>
                    <div className="space-y-4">
                        {sortedCustomers.map((customer, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-[#FDFBF7] rounded-xl border border-[#E8ECE9]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#B03050] text-white flex items-center justify-center font-bold text-xs">
                                        {idx + 1}
                                    </div>
                                    <span className="font-bold text-slate-600">{customer.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800">₦{customer.revenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    <p className="text-xs text-slate-400">{customer.count} orders</p>
                                </div>
                            </div>
                        ))}
                        {sortedCustomers.length === 0 && (
                            <p className="text-center text-slate-400 py-8">No customer data available.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
