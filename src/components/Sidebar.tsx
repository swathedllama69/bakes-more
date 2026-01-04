"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Calculator, ShoppingBag, ChefHat, Package, Settings, CalendarDays, ScrollText, Users, CircleDollarSign, LogOut, FileText } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <aside className="w-20 lg:w-72 bg-white border-r border-slate-100 fixed h-full z-50 hidden md:flex flex-col justify-between transition-all duration-300 shadow-2xl shadow-slate-200/50">
            <div>
                {/* Logo Section */}
                <div className="h-64 flex flex-col items-center justify-center border-b border-slate-50 gap-4 p-6 bg-gradient-to-b from-white to-pink-50/30">
                    <div className="relative w-32 h-32 lg:w-40 lg:h-40 drop-shadow-2xl hover:scale-105 transition-transform duration-500 ease-out">
                        <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
                    </div>
                    <div className="text-center w-full space-y-1">
                        <span className="hidden lg:block text-xl text-[#B03050] tracking-[0.25em] uppercase font-bold">Bakes & More</span>
                        <span className="hidden lg:block text-3xl text-slate-400 font-['Great_Vibes'] transform -rotate-3 translate-x-4">By Hafsaa</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-6 space-y-2">
                    <NavItem
                        href="/dashboard"
                        icon={<LayoutDashboard className="w-5 h-5" />}
                        label="Dashboard"
                        active={isActive('/dashboard')}
                    />
                    <NavItem
                        href="/orders"
                        icon={<ShoppingBag className="w-5 h-5" />}
                        label="Orders"
                        active={isActive('/orders')}
                    />
                    <NavItem
                        href="/customers"
                        icon={<Users className="w-5 h-5" />}
                        label="Customers"
                        active={isActive('/customers')}
                    />
                    <NavItem
                        href="/quotes"
                        icon={<FileText className="w-5 h-5" />}
                        label="Quotes"
                        active={isActive('/quotes')}
                    />
                    <NavItem
                        href="/Calculator"
                        icon={<Calculator className="w-5 h-5" />}
                        label="Calculator"
                        active={isActive('/Calculator')}
                    />
                    <NavItem href="/recipes"
                        icon={<ChefHat className="w-5 h-5" />}
                        label="Recipe Creator"
                        active={isActive('/recipes')}
                    />
                    <NavItem href="/pantry"
                        icon={<Package className="w-5 h-5" />}
                        label="Pantry"
                        active={isActive('/pantry')}
                    />
                </nav>

            </div>

            {/* Footer / Settings */}
            <div className="p-6 border-t border-slate-50 space-y-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    <NavItem href="/reports"
                        icon={<CircleDollarSign className="w-5 h-5" />}
                        label="Reports"
                        active={isActive('/reports')}
                    />
                    <NavItem
                        href="/settings"
                        icon={<Settings className="w-5 h-5" />}
                        label="Settings"
                        active={isActive('/settings')}
                    />
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 text-slate-400 hover:bg-red-50 hover:text-red-500 group"
                >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="hidden lg:block font-bold text-sm tracking-wide">Logout</span>
                </button>
            </div>
        </aside>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`
                flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 group relative overflow-hidden
                ${active
                    ? 'bg-[#B03050] text-white shadow-lg shadow-pink-200'
                    : 'text-slate-400 hover:bg-pink-50 hover:text-[#B03050]'
                }
            `}
        >
            {/* Active Indicator Dot */}
            {active && (
                <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-sm animate-pulse" />
            )}

            <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                {icon}
            </span>
            <span className={`hidden lg:block font-bold text-sm tracking-wide ${active ? 'text-white' : ''}`}>
                {label}
            </span>
        </Link>
    );
}
