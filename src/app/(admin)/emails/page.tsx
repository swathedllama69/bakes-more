"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Copy, Eye, Mail, Search, RefreshCw } from "lucide-react";

export default function EmailLogsPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("email_logs")
            .select("*")
            .order("created_at", { ascending: false });

        if (data) setEmails(data);
        setLoading(false);
    };

    const copyToClipboard = (html: string) => {
        // Create a temporary element to strip HTML tags if needed, 
        // OR copy the HTML directly. User asked to "copy and send to customer WhatsApp".
        // WhatsApp doesn't render HTML. We need plain text.
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const text = tempDiv.innerText || tempDiv.textContent || "";

        navigator.clipboard.writeText(text);
        alert("Email content copied to clipboard (Text-only for WhatsApp)!");
    };

    const filteredEmails = emails.filter(e =>
        e.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.order_id && e.order_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen p-8 font-sans text-slate-800 bg-[#FDFBF7]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-serif text-[#B03050] flex items-center gap-3">
                        <Mail className="w-8 h-8" />
                        System Emails
                    </h1>
                    <p className="text-slate-500 font-medium">Log of all notifications sent to customers.</p>
                </div>
                <button
                    onClick={fetchEmails}
                    className="p-2 bg-white rounded-full border hover:bg-slate-50 transition-all"
                    title="Refresh Log"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            <div className="flex bg-white p-2 rounded-xl border border-[#E8ECE9] mb-6 shadow-sm max-w-md">
                <Search className="w-5 h-5 text-slate-400 ml-2 mt-2" />
                <input
                    type="text"
                    placeholder="Search by email or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-2 outline-none text-slate-700 font-medium placeholder:text-slate-300"
                />
            </div>

            <div className="bg-white rounded-2xl border border-[#E8ECE9] shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-[2fr_3fr_1fr_auto] gap-4 px-6 py-3 text-xs font-bold uppercase text-slate-400 border-b border-[#E8ECE9]">
                    <div>Recipient</div>
                    <div>Subject</div>
                    <div>Date</div>
                    <div>Actions</div>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading Logs...</div>
                    ) : filteredEmails.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">No emails found.</div>
                    ) : (
                        filteredEmails.map((email) => (
                            <div key={email.id} className="p-4 md:px-6 md:py-4 grid grid-cols-1 md:grid-cols-[2fr_3fr_1fr_auto] gap-2 items-center hover:bg-slate-50 transition-colors">
                                <div className="font-bold text-slate-700 break-all">{email.recipient}</div>
                                <div className="text-sm text-slate-600">{email.subject}</div>
                                <div className="text-xs text-slate-400">
                                    {new Date(email.created_at).toLocaleString()}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedEmail(email)}
                                        className="p-2 text-slate-400 hover:text-[#B03050] hover:bg-pink-50 rounded-lg transition-colors"
                                        title="View Content"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(email.html)}
                                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Copy for WhatsApp"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Email Viewer Modal */}
            {selectedEmail && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                            <h3 className="font-bold text-lg">{selectedEmail.subject}</h3>
                            <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-slate-200 rounded-full">
                                <span className="text-xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-white">
                            <iframe
                                title="email-preview"
                                srcDoc={selectedEmail.html}
                                className="w-full h-full min-h-[400px] border-none"
                            />
                        </div>
                        <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-end gap-2">
                            <button
                                onClick={() => copyToClipboard(selectedEmail.html)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" /> Copy Text
                            </button>
                            <button
                                onClick={() => setSelectedEmail(null)}
                                className="px-4 py-2 border rounded-lg hover:bg-slate-100 font-bold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
