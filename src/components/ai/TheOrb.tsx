"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, MessageSquare, X, Send, BrainCircuit, Loader2, LayoutDashboard, MessageCircle, Lightbulb, Mic, Image as ImageIcon, Paperclip } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { prepareDailyBriefingData } from "@/lib/ai/sanitizer";
import { useUIStore } from "@/lib/store/ui-store";
import { useTimerStore } from "@/lib/store/timer-store";
import { processAIRequest } from "@/app/actions/ai";

const INSPIRATION_LINKS = [
    { title: "Trending Cake Designs 2024", url: "https://www.pinterest.com/search/pins/?q=cake%20trends%202024" },
    { title: "Mastering Buttercream Flowers", url: "https://www.youtube.com/results?search_query=buttercream+flowers+tutorial" },
    { title: "Chocolate Tempering Guide", url: "https://www.callebaut.com/en-US/chocolate-video/tempering/callets" },
    { title: "Wedding Cake Inspirations", url: "https://www.theknot.com/content/wedding-cake-trends" },
    { title: "Cupcake Decorating Ideas", url: "https://sallysbakingaddiction.com/cupcake-decorating-tips/" },
    { title: "Macaron Troubleshooting", url: "https://www.indulgewithmimi.com/macaron-troubleshooting-guide/" }
];

const BAKING_FACTS = [
    "Room temperature ingredients mix better and create more volume.",
    "Always measure flour by weight, not volume, for consistent results.",
    "Chill your cookie dough for at least 24 hours for better flavor.",
    "Adding a pinch of salt to sweet recipes enhances the flavor.",
    "Don't overmix your batter; it can make the cake tough.",
    "Use unsalted butter to control the salt content in your recipes.",
    "Preheat your oven for at least 20 minutes before baking.",
    "Fresh eggs separate easier when cold, but whip better at room temp.",
    "Cocoa powder can be used to dust pans for chocolate cakes instead of flour.",
    "Let cakes cool completely before frosting to prevent melting."
];

export default function TheOrb() {
    const { isAIChatOpen, toggleAIChat, closeAIChat } = useUIStore();
    const { addTimer } = useTimerStore();
    const [isHovered, setIsHovered] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');

    // Daily Inspiration & Facts
    const [dailyLink, setDailyLink] = useState(INSPIRATION_LINKS[0]);
    const [dailyFact, setDailyFact] = useState(BAKING_FACTS[0]);
    const [greeting, setGreeting] = useState("Good Morning");

    useEffect(() => {
        // Pick a link based on the day of the year
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        setDailyLink(INSPIRATION_LINKS[dayOfYear % INSPIRATION_LINKS.length]);
        setDailyFact(BAKING_FACTS[dayOfYear % BAKING_FACTS.length]);

        // Set Greeting
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
    }, []);

    // Chat State
    const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Data State
    const [contextData, setContextData] = useState<any>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [isListening, setIsListening] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchContextAndBrief = async () => {
        setIsLoadingData(true);
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

                // Check for 2-day reminders
                const today = new Date();
                const twoDaysFromNow = new Date(today);
                twoDaysFromNow.setDate(today.getDate() + 2);
                const twoDaysStr = twoDaysFromNow.toISOString().split('T')[0];

                const upcomingOrders = orders.filter((o: any) => o.due_date && o.due_date.startsWith(twoDaysStr));

                if (upcomingOrders.length > 0) {
                    briefing.upcoming_reminders = upcomingOrders;
                    // Send notification if permission granted
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification("Upcoming Orders", {
                            body: `You have ${upcomingOrders.length} orders due in 2 days!`
                        });
                    }
                }

                setContextData({ briefing, rawOrders: orders, rawInventory: inventory });

                // Generate Initial Chat Message if empty
                if (messages.length === 0) {
                    setMessages([{
                        role: 'ai',
                        text: "Hello! I've analyzed your bakery data. Check the Dashboard tab for a summary, or ask me anything here!"
                    }]);
                }
            }
        } catch (error) {
            console.error("AI Init Error:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (isAIChatOpen) {
            fetchContextAndBrief();
        }
    }, [isAIChatOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeTab]);

        const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSelectedImage(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        };

        const toggleListening = () => {
            if (!('webkitSpeechRecognition' in window)) {
                alert("Voice dictation is not supported in this browser.");
                return;
            }

            if (isListening) {
                setIsListening(false);
                return;
            }

            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + (prev ? " " : "") + transcript);
            };

            recognition.start();
        };

        const handleSend = async () => {
            if (!input.trim() && !selectedImage) return;

            const userMsg = input;
            const currentImage = selectedImage;

            setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
            setInput("");
            setSelectedImage(null);
            setLoading(true);

            try {
                // Prepare conversation history for AI
                const history = messages.map(m => ({ 
                    role: m.role === 'ai' ? 'assistant' : m.role, 
                    content: m.text 
                }));
                history.push({ role: 'user', content: userMsg });

                const result = await processAIRequest(history, currentImage || undefined);

                if (result.tool_calls) {
                    for (const toolCall of result.tool_calls) {
                        const args = JSON.parse(toolCall.function.arguments);

                        if (toolCall.function.name === 'create_order') {
                            // Insert into Supabase
                            const { data, error } = await supabase.from('orders').insert({
                                customer_name: args.customer_name,
                                due_date: args.due_date,
                                status: 'Pending',
                                notes: args.notes || '',
                                total_price: 0 // Placeholder
                            }).select().single();

                            if (error) {
                                setMessages(prev => [...prev, { role: 'ai', text: `Error creating order: ${error.message}` }]);
                            } else {
                                setMessages(prev => [...prev, { role: 'ai', text: `Order created for ${args.customer_name} on ${args.due_date}! (ID: ${data.id.slice(0, 4)})` }]);
                                fetchContextAndBrief(); // Refresh data
                            }
                        }
                        else if (toolCall.function.name === 'set_timer') {
                            addTimer(args.duration_seconds, args.label || "AI Timer");
                            setMessages(prev => [...prev, { role: 'ai', text: `Timer set for ${args.duration_seconds} seconds.` }]);
                        }
                        else if (toolCall.function.name === 'set_reminder') {
                            setTimeout(() => {
                                if ("Notification" in window && Notification.permission === "granted") {
                                    new Notification("Reminder", { body: args.task });
                                } else {
                                    alert(`Reminder: ${args.task}`);
                                }
                            }, args.delay_seconds * 1000);
                            setMessages(prev => [...prev, { role: 'ai', text: `I'll remind you to "${args.task}" in ${args.delay_seconds} seconds.` }]);
                        }
                        else if (toolCall.function.name === 'add_pantry_item') {
                            // Find item
                            const item = contextData?.rawInventory?.find((i: any) => i.name.toLowerCase().includes(args.item_name.toLowerCase()));
                            if (item) {
                                await supabase.from('ingredients').update({ current_stock: item.current_stock + args.quantity }).eq('id', item.id);
                                setMessages(prev => [...prev, { role: 'ai', text: `Added ${args.quantity} to ${item.name}.` }]);
                                fetchContextAndBrief();
                            } else {
                                setMessages(prev => [...prev, { role: 'ai', text: `Could not find item "${args.item_name}" in pantry.` }]);
                            }
                        }
                    }
                } else {
                    setMessages(prev => [...prev, { role: 'ai', text: result.content || "I didn't understand that." }]);
                }

            } catch (error) {
                console.error(error);
                setMessages(prev => [...prev, { role: 'ai', text: "Sorry, something went wrong." }]);
            } finally {
                setLoading(false);
            }
        };

        // Render Helper for Input Area
        const renderInputArea = () => (
            <div className="p-3 bg-white border-t border-[#E8ECE9] flex flex-col gap-2 shrink-0 pb-safe md:pb-3">
                {selectedImage && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                        <img src={selectedImage} alt="Upload" className="object-cover w-full h-full" />
                        <button onClick={() => setSelectedImage(null)} className="absolute top-0 right-0 bg-black/50 text-white p-0.5">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <div className="flex gap-2 items-center">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-[#B03050] transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                    />

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "Listening..." : "Ask AI or upload image..."}
                        className={`flex-1 bg-[#FAFAFA] border border-[#E8ECE9] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#B03050] text-slate-700 ${isListening ? 'animate-pulse border-red-300' : ''}`}
                    />

                    <button
                        onClick={toggleListening}
                        className={`p-2 rounded-xl transition-colors ${isListening ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:text-[#B03050]'}`}
                    >
                        <Mic className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleSend}
                        disabled={loading || (!input.trim() && !selectedImage)}
                        className="p-2 bg-[#B03050] text-white rounded-xl hover:bg-[#902040] transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        );

        return (
            <div className={`fixed z-50 flex flex-col items-end font-sans ${isAIChatOpen ? 'inset-0 md:inset-auto md:bottom-8 md:right-8' : 'bottom-8 right-8'}`}>

                {/* Chat Window */}
                {isAIChatOpen && (
                    <div className="w-full h-full md:h-[650px] md:mb-4 md:w-[400px] bg-white md:rounded-2xl shadow-2xl border border-[#E8ECE9] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-200">
                        {/* Header */}
                        <div className="bg-[#B03050] p-4 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5" />
                                <span className="font-bold font-serif">Personal Assistant</span>
                            </div>
                            <button onClick={closeAIChat} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50">
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-white text-[#B03050] border-b-2 border-[#B03050]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutDashboard className="w-4 h-4" /> Daily Brief
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'chat' ? 'bg-white text-[#B03050] border-b-2 border-[#B03050]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <MessageCircle className="w-4 h-4" /> Assistant
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden bg-[#FDFBF7] relative">

                            {/* DASHBOARD VIEW */}
                            {activeTab === 'dashboard' && (
                                <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
                                    {isLoadingData ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="text-xs">Analyzing Bakery Data...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Welcome Card */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                <h3 className="font-bold text-slate-800 mb-1">{greeting}! ☀️</h3>
                                                <p className="text-sm text-slate-500">Here is your bakery snapshot for today.</p>
                                            </div>

                                            {/* Daily Fact */}
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Lightbulb className="w-4 h-4 text-blue-500" />
                                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Did You Know?</span>
                                                </div>
                                                <p className="text-sm text-slate-700 italic">"{dailyFact}"</p>
                                            </div>

                                            {/* Daily Inspiration */}
                                            <a
                                                href={dailyLink.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Sparkles className="w-4 h-4 text-slate-500" />
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Daily Inspiration</span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 group-hover:text-[#B03050] transition-colors flex items-center justify-between">
                                                    {dailyLink.title}
                                                    <span className="text-slate-400 text-xs group-hover:translate-x-1 transition-transform">Read &rarr;</span>
                                                </h4>
                                            </a>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-pink-50 p-3 rounded-xl border border-pink-100">
                                                    <div className="text-xs text-pink-600 font-bold uppercase mb-1">Orders Due</div>
                                                    <div className="text-2xl font-bold text-slate-800">{contextData?.briefing?.orders_due?.length || 0}</div>
                                                </div>
                                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                                    <div className="text-xs text-orange-600 font-bold uppercase mb-1">Low Stock</div>
                                                    <div className="text-2xl font-bold text-slate-800">{contextData?.briefing?.low_stock_alerts?.length || 0}</div>
                                                </div>
                                            </div>

                                            {/* Urgent Alerts */}
                                            {contextData?.briefing?.low_stock_alerts?.length > 0 && (
                                                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                                                    <h4 className="font-bold text-red-600 text-sm mb-3 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Low Stock Alerts
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {contextData.briefing.low_stock_alerts.slice(0, 3).map((item: any, i: number) => (
                                                            <div key={i} className="flex justify-between text-sm border-b border-slate-50 last:border-0 pb-1 last:pb-0">
                                                                <span className="text-slate-700">{item.name}</span>
                                                                <span className="font-mono text-red-500 font-bold">{item.current}{item.unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Today's Orders */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                <h4 className="font-bold text-slate-700 text-sm mb-3">Today's Production</h4>
                                                {contextData?.briefing?.orders_due?.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {contextData.briefing.orders_due.map((order: any) => (
                                                            <div key={order.id} className="text-sm bg-slate-50 p-2 rounded-lg">
                                                                <div className="flex justify-between mb-1">
                                                                    <span className="font-bold text-slate-800">#{order.id.slice(0, 4)}</span>
                                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{order.status}</span>
                                                                </div>
                                                                <div className="text-slate-500 text-xs">
                                                                    {order.items.map((i: any) => i.name).join(', ')}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-400 italic">No orders due today.</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* CHAT VIEW */}
                            {activeTab === 'chat' && (
                                <div className="absolute inset-0 flex flex-col">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                    {renderInputArea()}
                                </div>
                            )}

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
