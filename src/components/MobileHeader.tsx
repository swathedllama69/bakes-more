'use client';

import Image from 'next/image';
import { Bell } from 'lucide-react';

export default function MobileHeader() {
    return (
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                    <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold text-[#B03050] tracking-widest uppercase">Bakes & More</span>
            </div>
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
        </div>
    );
}
