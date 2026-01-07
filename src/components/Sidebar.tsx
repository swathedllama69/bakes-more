"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Calculator, ShoppingBag, ChefHat, Package, Settings, CalendarDays, ScrollText, Users, CircleDollarSign, LogOut, FileText, Timer, Mail, ImageIcon } from "lucide-react";
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
        <aside className={`
            hidden md:flex fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-100 flex-col justify-between transition-all duration-300 shadow-2xl shadow-slate-200/50
            md:w-24 lg:w-64
        `}>
            <div>
                {/* Logo Section */}
                <div className="flex flex-col items-center justify-center border-b border-slate-50 gap-3 p-6 bg-gradient-to-b from-white to-pink-50/30">
                    <div className="relative w-20 h-20 lg:w-28 lg:h-28 drop-shadow-xl hover:scale-105 transition-transform duration-500 ease-out">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            fill
                            sizes="(min-width: 1024px) 112px, 80px"
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="w-full hidden lg:block">
                        <h1 className="text-lg text-[#B03050] tracking-widest uppercase font-bold text-center">Bakes & More</h1>
                        <p className="text-2xl text-slate-400 font-['Great_Vibes'] text-right pr-2">By Hafsaa</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-3 lg:p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
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
                        href="/Calculator"
                        icon={<Calculator className="w-5 h-5" />}
                        label="Calculator"
                        active={isActive('/Calculator')}
                    />
                    <NavItem
                        href="/timer"
                        icon={<Timer className="w-5 h-5" />}
                        label="Timer"
                        active={isActive('/timer')}
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
                    <NavItem href="/admin-gallery"
                        icon={<ImageIcon className="w-5 h-5" />}
                        label="Gallery"
                        active={isActive('/admin-gallery')}
                    />
                </nav>

            </div>

            {/* Footer / Settings */}
            <div className="p-3 lg:p-4 border-t border-slate-50 bg-white">
                <div className="grid grid-cols-2 gap-1">
                    <NavItem href="/emails"
                        icon={<Mail className="w-5 h-5" />}
                        label="Emails"
                        active={isActive('/emails')}
                    />
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
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-50 group"
                    >
                        <LogOut className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                        <span className="hidden lg:block font-bold text-sm tracking-wide">Logout</span>
                    </button>
                </div>
            </div>
        </aside >
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`
                flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${active
                    ? 'bg-[#B03050] text-white shadow-md shadow-pink-200'
                    : 'text-slate-500 hover:bg-pink-50 hover:text-[#B03050]'
                }
            `}
        >
            {/* Active Indicator Dot */}
            {active && (
                <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-sm hidden lg:block" />
            )}

            <span className={`transition-transform duration-300 ${active ? 'scale-105' : 'group-hover:scale-110'}`}>
                {icon}
            </span>
            <span className={`hidden lg:block font-bold text-sm tracking-wide ${active ? 'text-white' : ''}`}>
                {label}
            </span>
        </Link>
    );
}
