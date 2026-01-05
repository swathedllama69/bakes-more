"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { X, PartyPopper, Heart } from "lucide-react";

export default function Greetings() {
    const [greeting, setGreeting] = useState<{ title: string; message: string; icon: any } | null>(null);

    useEffect(() => {
        const checkDate = () => {
            const today = new Date();
            const month = today.getMonth() + 1; // 0-indexed
            const day = today.getDate();

            // Check if we've already shown it this session
            const hasShown = sessionStorage.getItem("hasShownGreeting");
            if (hasShown) return;

            if (month === 1 && day === 5) {
                setGreeting({
                    title: "Happy Birthday! 🎂",
                    message: "Wishing you a fantastic birthday filled with joy, laughter, and of course, cake!",
                    icon: PartyPopper
                });
                triggerConfetti();
                sessionStorage.setItem("hasShownGreeting", "true");
            } else if (month === 9 && day === 22) {
                setGreeting({
                    title: "Happy Anniversary! 🥂",
                    message: "Congratulations on another wonderful year! Here's to many more sweet moments.",
                    icon: Heart
                });
                triggerConfetti();
                sessionStorage.setItem("hasShownGreeting", "true");
            }
        };

        checkDate();
    }, []);

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    if (!greeting) return null;

    const Icon = greeting.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center relative animate-in zoom-in-95 duration-300 border-4 border-pink-100">
                <button
                    onClick={() => setGreeting(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#B03050]">
                    <Icon className="w-10 h-10" />
                </div>

                <h2 className="text-3xl font-serif font-bold text-[#B03050] mb-4">{greeting.title}</h2>
                <p className="text-slate-600 text-lg leading-relaxed mb-8">
                    {greeting.message}
                </p>

                <button
                    onClick={() => setGreeting(null)}
                    className="bg-[#B03050] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] transition-all active:scale-95"
                >
                    Thank You!
                </button>
            </div>
        </div>
    );
}
