"use client";

import { useState, useEffect } from "react";
import { Sparkles, MessageCircle } from "lucide-react";

export default function AIOrb() {
    const [isHovered, setIsHovered] = useState(false);
    const [message, setMessage] = useState("Checking today's orders...");

    useEffect(() => {
        const messages = [
            "You have 3 orders due today.",
            "Stock Alert: Sugar is running low.",
            "Tip: 'Red Velvet' is trending this week.",
            "Don't forget to log your expenses!",
            "Good Morning! Ready to bake?"
        ];

        const interval = setInterval(() => {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            setMessage(randomMsg);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
            {/* Message Bubble */}
            <div
                className={`
                    bg-white/90 backdrop-blur-md border border-[#D4AF37]/30 p-4 rounded-2xl shadow-lg max-w-xs
                    transition-all duration-500 transform origin-bottom-right
                    ${isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'}
                `}
            >
                <p className="text-sm font-medium text-slate-700 font-sans leading-relaxed">
                    <span className="text-[#B03050] font-bold block mb-1 text-xs uppercase tracking-wider">Assistant</span>
                    {message}
                </p>
            </div>

            {/* The Orb */}
            <button
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative group"
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-[#B03050] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse" />

                {/* Core */}
                <div className="relative w-14 h-14 bg-gradient-to-br from-[#B03050] to-[#802030] rounded-full flex items-center justify-center shadow-xl border-2 border-white/20 overflow-hidden transition-transform duration-300 group-hover:scale-110">
                    {/* Inner Shine */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent opacity-50" />

                    <Sparkles className="w-6 h-6 text-white animate-spin-slow" />
                </div>

                {/* Status Dot */}
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full shadow-sm" />
            </button>
        </div>
    );
}
