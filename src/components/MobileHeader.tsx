'use client';

import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { useUIStore } from '@/lib/store/ui-store';

export default function MobileHeader() {
    const { toggleAIChat, isAIChatOpen } = useUIStore();

    return (
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                    <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold text-[#B03050] tracking-widest uppercase">Bakes & More</span>
            </div>
            <button 
                onClick={toggleAIChat}
                className={`p-2 rounded-full relative transition-colors ${isAIChatOpen ? 'bg-[#B03050] text-white' : 'text-slate-400 hover:bg-slate-50'}`}
            >
                <Sparkles className="w-6 h-6" />
                {!isAIChatOpen && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#B03050] rounded-full border border-white animate-pulse"></span>
                )}
            </button>
        </div>
    );
}
