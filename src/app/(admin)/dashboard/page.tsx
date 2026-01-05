"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DollarSign, ShoppingBag, TrendingUp, AlertCircle, Clock, ArrowRight, BarChart3, PieChart, Users, Calendar, CalendarDays, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    profit: 0,
    pendingOrders: 0,
    bakingOrders: 0,
    lowStockItems: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
    monthlyGrowth: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    monthlyOrdersCount: 0,
    dueToday: 0,
    dueTomorrow: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Welcome back");
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '6m'>('6m');
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [showFinancials, setShowFinancials] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (allOrders.length > 0) {
      processChartData(allOrders, chartPeriod);
    }
  }, [chartPeriod, allOrders]);

  const fetchDashboardData = async () => {
    setLoading(true);

    // 1. Fetch Orders for Stats & Charts
    const { data: orders } = await supabase
      .from("orders")
      .select("*, order_items(*, recipes(name))")
      .neq("status", "Cancelled");

    // 2. Fetch Customer Count
    const { count: customerCount } = await supabase
      .from("customers")
      .select("*", { count: 'exact', head: true });

    if (orders) {
      setAllOrders(orders);

      // Basic Stats
      const revenue = orders.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);
      const profit = orders.reduce((acc, o) => acc + (Number(o.profit) || 0), 0);
      const pending = orders.filter(o => o.status === 'Pending').length;
      const baking = orders.filter(o => o.status === 'Baking').length;
      const avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;

      // Monthly Stats
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const thisMonthOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const lastMonthOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        // Handle January case
        const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });

      const thisMonthRevenue = thisMonthOrders.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);
      const thisMonthProfit = thisMonthOrders.reduce((acc, o) => acc + (Number(o.profit) || 0), 0);
      const lastMonthRevenue = lastMonthOrders.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);

      const growth = lastMonthRevenue === 0
        ? (thisMonthRevenue > 0 ? 100 : 0)
        : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

      // Production Snapshot
      const today = new Date().toISOString().split('T')[0];
      const dueToday = orders.filter(o => o.due_date === today && o.status !== 'Delivered' && o.status !== 'Cancelled');
      const dueTomorrow = orders.filter(o => {
        const d = new Date(o.due_date);
        const t = new Date();
        t.setDate(t.getDate() + 1);
        return d.toISOString().split('T')[0] === t.toISOString().split('T')[0] && o.status !== 'Delivered';
      });

      setStats(prev => ({
        ...prev,
        revenue,
        profit,
        pendingOrders: pending,
        bakingOrders: baking,
        monthlyRevenue: thisMonthRevenue,
        monthlyProfit: thisMonthProfit,
        monthlyGrowth: growth,
        avgOrderValue,
        totalCustomers: customerCount || 0,
        monthlyOrdersCount: thisMonthOrders.length,
        dueToday: dueToday.length,
        dueTomorrow: dueTomorrow.length
      }));

      // Initial Chart Data (6m)
      processChartData(orders, '6m');

      // Top Products
      const productMap: { [key: string]: number } = {};
      orders.forEach(o => {
        o.order_items.forEach((item: any) => {
          const name = item.recipes?.name || "Custom Cake";
          productMap[name] = (productMap[name] || 0) + item.quantity;
        });
      });

      const sortedProducts = Object.entries(productMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopProducts(sortedProducts);
    }

    // 2. Fetch Recent Orders
    const { data: recent } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recent) setRecentOrders(recent);

    // 3. Fetch Low Stock Items (Client-side filter for now)
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("current_stock, min_stock_level");

    if (ingredients) {
      const lowStockCount = ingredients.filter(i => i.current_stock < (i.min_stock_level || 0)).length;
      setStats(prev => ({ ...prev, lowStockItems: lowStockCount }));
    }

    setLoading(false);
  };

  const processChartData = (orders: any[], period: '7d' | '30d' | '6m') => {
    const now = new Date();
    let dataPoints: any[] = [];

    if (period === '6m') {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = now.getMonth();
      dataPoints = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(currentMonth - 5 + i);
        return {
          label: months[d.getMonth()],
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          value: 0
        };
      });

      orders.forEach(o => {
        const d = new Date(o.created_at);
        const match = dataPoints.find(p => p.monthIndex === d.getMonth() && p.year === d.getFullYear());
        if (match) match.value += o.total_price || 0;
      });
    } else {
      // Days logic (7d or 30d)
      const daysCount = period === '7d' ? 7 : 30;
      dataPoints = Array.from({ length: daysCount }, (_, i) => {
        const d = new Date();
        d.setDate(now.getDate() - (daysCount - 1) + i);
        return {
          label: d.getDate().toString(), // Just the day number
          fullDate: d.toDateString(),
          value: 0
        };
      });

      orders.forEach(o => {
        const d = new Date(o.created_at);
        const match = dataPoints.find(p => p.fullDate === d.toDateString());
        if (match) match.value += o.total_price || 0;
      });
    }

    const maxVal = Math.max(...dataPoints.map(p => p.value), 1);
    setRevenueData(dataPoints.map(p => ({ ...p, height: (p.value / maxVal) * 100 })));
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#FAFAFA] max-w-[1600px] mx-auto">

      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-[#B03050] mb-3 tracking-tight">{greeting}, Hafsat</h1>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-100 shadow-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <span className="text-sm font-medium">
              You have <strong className="text-[#B03050]">{stats.dueToday} orders</strong> due today.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFinancials(!showFinancials)}
            className="p-3 bg-white border border-[#E8ECE9] rounded-xl shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-[#B03050]"
            title={showFinancials ? "Hide Financials" : "Show Financials"}
          >
            {showFinancials ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <Link href="/planner" className="flex items-center gap-3 px-5 py-3 bg-[#B03050] text-white rounded-xl shadow-lg shadow-pink-200 hover:bg-[#902040] hover:shadow-xl hover:-translate-y-0.5 transition-all group">
            <CalendarDays className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">Production Planner</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions & Production Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9] flex flex-col justify-between">
          <h3 className="text-lg font-serif text-slate-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/orders" className="p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors flex flex-col items-center gap-2 text-center group">
              <div className="p-2 bg-white rounded-full text-[#B03050] shadow-sm group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#B03050] uppercase tracking-wider">New Order</span>
            </Link>
            <Link href="/recipes" className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors flex flex-col items-center gap-2 text-center group">
              <div className="p-2 bg-white rounded-full text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">New Recipe</span>
            </Link>
            <Link href="/pantry" className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-2 text-center group">
              <div className="p-2 bg-white rounded-full text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Check Stock</span>
            </Link>
            <Link href="/Calculator" className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors flex flex-col items-center gap-2 text-center group">
              <div className="p-2 bg-white rounded-full text-purple-600 shadow-sm group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Quote Calc</span>
            </Link>
          </div>
        </div>

        {/* Production Status */}
        <div className="lg:col-span-2 bg-[#B03050] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-serif mb-1">Production Status</h3>
              <p className="text-slate-400 text-sm">Live overview of your kitchen</p>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                <span className="block text-2xl font-bold">{stats.dueToday}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400">Due Today</span>
              </div>
              <div className="px-4 py-2 bg-white/5 rounded-lg backdrop-blur-sm border border-white/5">
                <span className="block text-2xl font-bold text-slate-300">{stats.dueTomorrow}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Tomorrow</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-white/10 rounded-xl border border-white/5 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">Pending</span>
              </div>
              <span className="text-3xl font-serif">{stats.pendingOrders}</span>
              <p className="text-xs text-slate-400 mt-1">Orders to start</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl border border-white/5 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Baking</span>
              </div>
              <span className="text-3xl font-serif">{stats.bakingOrders}</span>
              <p className="text-xs text-slate-400 mt-1">In the oven</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl border border-white/5 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Low Stock</span>
              </div>
              <span className="text-3xl font-serif">{stats.lowStockItems}</span>
              <p className="text-xs text-slate-400 mt-1">Items critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Highlights (Collapsible/Toggleable via Eye icon) */}
      {showFinancials && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <StatCard
            title="Total Revenue"
            value={`₦${stats.revenue.toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5 text-[#B03050]" />}
            bg="bg-pink-50"
            text="text-[#B03050]"
            trend={stats.monthlyGrowth}
          />
          <StatCard
            title="Net Profit"
            value={`₦${stats.profit.toLocaleString()}`}
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            bg="bg-emerald-50"
            text="text-emerald-600"
          />
          <StatCard
            title="This Month"
            value={`₦${stats.monthlyRevenue.toLocaleString()}`}
            sub={`${stats.monthlyOrdersCount} orders`}
            icon={<Calendar className="w-5 h-5 text-amber-600" />}
            bg="bg-amber-50"
            text="text-amber-600"
          />
          <StatCard
            title="Avg. Order"
            value={`₦${Math.round(stats.avgOrderValue).toLocaleString()}`}
            icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
            bg="bg-indigo-50"
            text="text-indigo-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-[#E8ECE9] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B03050]/5 rounded-bl-[4rem] -mr-8 -mt-8" />

          <div className="flex items-center justify-between mb-8 relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-[#B03050]" />
              </div>
              <h2 className="text-xl font-serif text-slate-800">Revenue Trend</h2>
            </div>

            {/* Chart Filters */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['7d', '30d', '6m'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartPeriod === period
                    ? 'bg-white text-[#B03050] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '6 Months'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-48 flex items-end gap-2 md:gap-4">
            {revenueData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-[#FDFBF7] rounded-t-xl relative h-full flex items-end overflow-hidden border border-[#E8ECE9]">
                  <div
                    style={{ height: `${d.height}%` }}
                    className="w-full bg-[#B03050] rounded-t-xl transition-all duration-500 group-hover:bg-[#902040] relative opacity-80 group-hover:opacity-100"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {showFinancials ? `₦${d.value.toLocaleString()}` : "₦••••"}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider truncate w-full text-center">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E8ECE9] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/10 rounded-bl-[3rem] -mr-6 -mt-6" />

          <div className="flex items-center gap-3 mb-6 relative">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <PieChart className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h2 className="text-xl font-serif text-slate-800">Top Sellers</h2>
          </div>

          <div className="space-y-4 relative">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-[#FDFBF7] rounded-xl transition-colors border border-transparent hover:border-[#E8ECE9]">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${i === 0 ? 'bg-[#D4AF37] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {i + 1}
                  </span>
                  <span className="font-bold text-slate-700 font-serif">{p.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-400">{p.count} sold</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4 italic">No sales data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-[#E8ECE9] p-8 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif text-slate-800">Recent Orders</h2>
          <Link href="/orders" className="text-sm font-bold text-[#B03050] hover:text-[#902040] flex items-center gap-1 uppercase tracking-wider text-xs group">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs font-bold uppercase text-slate-400 border-b border-[#E8ECE9]">
              <tr>
                <th className="pb-4 pl-4 font-sans tracking-wider">Order ID</th>
                <th className="pb-4 font-sans tracking-wider">Customer</th>
                <th className="pb-4 font-sans tracking-wider">Status</th>
                <th className="pb-4 font-sans tracking-wider">Amount</th>
                <th className="pb-4 font-sans tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECE9]">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FDFBF7] transition-colors group cursor-pointer" onClick={() => window.location.href = `/orders/${order.id}`}>
                  <td className="py-4 pl-4 font-mono text-slate-500">#{order.id.slice(0, 8)}</td>
                  <td className="py-4 font-bold text-slate-800 font-serif text-lg">{order.customer_name}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'Baking' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'Ready' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-500'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-slate-700">₦{order.total_price.toLocaleString()}</td>
                  <td className="py-4 text-slate-400 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, bg, text, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9] flex items-start justify-between hover:shadow-md transition-all hover:-translate-y-1 duration-300 group">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-[#B03050] transition-colors">{title}</p>
        <h3 className={`text-2xl md:text-3xl font-serif ${text}`}>{value}</h3>
        {sub && <p className="text-xs text-slate-400 mt-1 font-medium italic">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className={`p-3 rounded-2xl ${bg} shadow-inner group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
  );
}
