"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, MessageSquare, X, Send, BrainCircuit, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { prepareDailyBriefingData } from "@/lib/ai/sanitizer";
import { useUIStore } from "@/lib/store/ui-store";

export default function TheOrb() {
    const { isAIChatOpen, toggleAIChat, closeAIChat } = useUIStore();
    const [isHovered, setIsHovered] = useState(false);
    const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [contextData, setContextData] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchContextAndBrief();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchContextAndBrief = async () => {
        try {
            // Fetch Orders
            const { data: orders } = await supabase
                .from("orders")
                .select(`*, order_items (*, recipes (name), fillings (name))`)
                .neq('status', 'Delivered')
                .neq('status', 'Cancelled');

            // Fetch Inventory
            const { data: inventory } = await supabase
                .from("ingredients")
                .select("*");

            if (orders && inventory) {
                const briefing = prepareDailyBriefingData(orders, inventory);
                setContextData({ briefing, rawOrders: orders, rawInventory: inventory });

                // Generate Initial Message
                const orderCount = briefing.orders_due.length;
                const lowStockCount = briefing.low_stock_alerts.length;

                let msg = `Good morning! I've analyzed your bakery data.\n\n`;

                if (orderCount > 0) {
                    msg += `📅 You have ${orderCount} order${orderCount > 1 ? 's' : ''} due today.\n`;
                } else {
                    msg += `📅 No orders due today. Great time for prep!\n`;
                }

                if (lowStockCount > 0) {
                    msg += `⚠️ Alert: ${lowStockCount} ingredient${lowStockCount > 1 ? 's are' : ' is'} running low (e.g., ${briefing.low_stock_alerts[0].name}).\n`;
                }

                setMessages([{ role: 'ai', text: msg }]);
            }
        } catch (error) {
            console.error("AI Init Error:", error);
            setMessages([{ role: 'ai', text: "I'm having trouble connecting to the bakery database right now." }]);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput("");
        setLoading(true);

        // Simulate AI Processing (Replace with real LLM call later)
        setTimeout(() => {
            let response = "I'm not sure about that yet.";
            const lowerInput = userMsg.toLowerCase();

            if (lowerInput.includes("stock") || lowerInput.includes("low")) {
                const low = contextData?.briefing?.low_stock_alerts || [];
                if (low.length > 0) {
                    response = `You are low on: ${low.map((i: any) => `${i.name} (${i.current}${i.unit})`).join(', ')}.`;
                } else {
                    response = "Your stock levels look healthy! Nothing is below the minimum threshold.";
                }
            } else if (lowerInput.includes("order") || lowerInput.includes("due")) {
                const due = contextData?.briefing?.orders_due || [];
                if (due.length > 0) {
                    response = `Here are today's orders:\n${due.map((o: any) => `- Order #${o.id.slice(0, 4)}: ${o.items.map((i: any) => i.name).join(', ')}`).join('\n')}`;
                } else {
                    response = "You have no orders due for delivery today.";
                }
            } else if (lowerInput.includes("profit") || lowerInput.includes("money")) {
                // Simple calculation from raw orders
                const totalPending = contextData?.rawOrders?.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0) || 0;
                response = `The total value of your active (pending/baking) orders is ₦${totalPending.toLocaleString()}.`;
            } else {
                response = "I can help you check stock levels, today's orders, or active revenue. Try asking 'What is low on stock?'";
            }

            setMessages(prev => [...prev, { role: 'ai', text: response }]);
            setLoading(false);
        }, 1000);
    };

    return (
        <div className={`fixed z-50 flex flex-col items-end font-sans ${isAIChatOpen ? 'inset-0 md:inset-auto md:bottom-8 md:right-8' : 'bottom-8 right-8'}`}>

            {/* Chat Window */}
            {isAIChatOpen && (
                <div className="w-full h-full md:h-auto md:mb-4 md:w-96 bg-white md:rounded-2xl shadow-2xl border border-[#E8ECE9] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-200">
                    {/* Header */}
                    <div className="bg-[#B03050] p-4 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5" />
                            <span className="font-bold font-serif">Bakery Intelligence</span>
                        </div>
                        <button onClick={closeAIChat} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFBF7] md:h-80">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-[#B03050] text-white rounded-br-none'
                                        : 'bg-white border border-[#E8ECE9] text-slate-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-[#E8ECE9] p-3 rounded-2xl rounded-bl-none shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-[#B03050]" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-[#E8ECE9] flex gap-2 shrink-0 pb-safe md:pb-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about recipes, stock, or profits..."
                            className="flex-1 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#B03050] text-slate-700"
                        />
                        <button
                            onClick={handleSend}
                            className="p-2 bg-[#B03050] text-white rounded-xl hover:bg-[#902040] transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* The Orb Trigger (Desktop Only) */}
            <button
                onClick={toggleAIChat}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`hidden md:flex relative group items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${isAIChatOpen ? 'bg-white text-[#B03050] rotate-90' : 'bg-[#B03050] text-white hover:scale-110'
                    }`}
            >
                {/* Pulse Effect */}
                {!isAIChatOpen && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#B03050] opacity-20 animate-ping"></span>
                )}

                {isAIChatOpen ? (
                    <X className="w-8 h-8" />
                ) : (
                    <Sparkles className="w-8 h-8 animate-pulse" />
                )}

                {/* Tooltip */}
                {!isAIChatOpen && isHovered && (
                    <div className="absolute right-20 bg-white text-slate-700 px-4 py-2 rounded-xl shadow-lg border border-[#E8ECE9] whitespace-nowrap font-bold text-sm animate-in slide-in-from-right-2">
                        Ask the Assistant
                    </div>
                )}
            </button>
        </div>
    );
}
