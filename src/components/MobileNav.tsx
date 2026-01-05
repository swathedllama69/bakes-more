'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, ChefHat, Menu } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, FileText, Calculator, CircleDollarSign, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MobileNav() {
    const pathname = usePathname();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const router = useRouter();

    const isActive = (path: string) => pathname === path;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <>
            {/* Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 z-50 flex justify-between items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                <NavLink href="/dashboard" icon={<LayoutDashboard className="w-6 h-6" />} label="Home" active={isActive('/dashboard')} />
                <NavLink href="/orders" icon={<ShoppingBag className="w-6 h-6" />} label="Orders" active={isActive('/orders')} />
                
                {/* Center FAB for Quick Action or Main Feature (Recipes) */}
                <div className="relative -top-6">
                    <Link href="/recipes" className="flex items-center justify-center w-14 h-14 bg-[#B03050] rounded-full shadow-lg shadow-pink-200 text-white transform transition-transform active:scale-95">
                        <ChefHat className="w-7 h-7" />
                    </Link>
                </div>

                <NavLink href="/pantry" icon={<Package className="w-6 h-6" />} label="Pantry" active={isActive('/pantry')} />
                <button 
                    onClick={() => setIsMoreOpen(true)}
                    className={`flex flex-col items-center gap-1 ${isMoreOpen ? 'text-[#B03050]' : 'text-slate-400'}`}
                >
                    <Menu className="w-6 h-6" />
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </div>

            {/* More Menu Drawer */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                            className="fixed inset-0 bg-black/20 z-50 md:hidden backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-50 md:hidden p-6 pb-24 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800">Menu</h3>
                                <button onClick={() => setIsMoreOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <MenuLink href="/customers" icon={<Users className="w-6 h-6" />} label="Clients" onClick={() => setIsMoreOpen(false)} />
                                <MenuLink href="/quotes" icon={<FileText className="w-6 h-6" />} label="Quotes" onClick={() => setIsMoreOpen(false)} />
                                <MenuLink href="/Calculator" icon={<Calculator className="w-6 h-6" />} label="Calc" onClick={() => setIsMoreOpen(false)} />
                                <MenuLink href="/reports" icon={<CircleDollarSign className="w-6 h-6" />} label="Reports" onClick={() => setIsMoreOpen(false)} />
                                <MenuLink href="/settings" icon={<Settings className="w-6 h-6" />} label="Settings" onClick={() => setIsMoreOpen(false)} />
                                <button 
                                    onClick={handleLogout}
                                    className="flex flex-col items-center gap-2 p-3 rounded-2xl active:bg-red-50 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 group-active:scale-95 transition-transform">
                                        <LogOut className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-medium text-red-500 text-center">Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <Link href={href} className={`flex flex-col items-center gap-1 ${active ? 'text-[#B03050]' : 'text-slate-400'}`}>
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    );
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <Link href={href} onClick={onClick} className="flex flex-col items-center gap-2 p-3 rounded-2xl active:bg-slate-50 transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-active:scale-95 transition-transform">
                {icon}
            </div>
            <span className="text-xs font-medium text-slate-600 text-center">{label}</span>
        </Link>
    );
}
