"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Phone, MapPin, User, Edit, Trash2, Save, X, FileText, ChevronLeft, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CustomersPage() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get('id');

    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        email: "",
        address: "",
        notes: ""
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (initialId && customers.length > 0) {
            const customer = customers.find(c => c.id.toString() === initialId);
            if (customer) {
                handleEdit(customer);
            }
        }
    }, [initialId, customers]);

    const fetchCustomers = async () => {
        const { data } = await supabase
            .from("customers")
            .select("*, orders(id, created_at, total_price, status, delivery_date)")
            .order("full_name");

        if (data) {
            // Process to find last order date
            const processed = data.map(c => {
                const orders = c.orders || [];
                // Sort orders by date descending
                orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                const lastOrder = orders.length > 0 ? orders[0] : null;
                return {
                    ...c,
                    orders, // Keep full history
                    last_order_date: lastOrder ? lastOrder.created_at : null
                };
            });
            setCustomers(processed);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.full_name) return alert("Name is required");

        if (editingCustomer) {
            const { error } = await supabase
                .from("customers")
                .update(formData)
                .eq("id", editingCustomer.id);
            if (error) alert("Error updating customer");
        } else {
            const { error } = await supabase
                .from("customers")
                .insert([formData]);
            if (error) alert("Error creating customer");
        }

        setIsModalOpen(false);
        setEditingCustomer(null);
        setFormData({ full_name: "", phone: "", email: "", address: "", notes: "" });
        fetchCustomers();
    };

    const handleEdit = (customer: any) => {
        setEditingCustomer(customer);
        setFormData({
            full_name: customer.full_name,
            phone: customer.phone || "",
            email: customer.email || "",
            address: customer.address || "",
            notes: customer.notes || ""
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This will not delete their past orders.")) return;
        const { error } = await supabase.from("customers").delete().eq("id", id);
        if (!error) fetchCustomers();
    };

    const filteredCustomers = customers.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="min-h-screen p-8 text-slate-800 bg-[#FDFBF7]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-[#B03050] flex items-center gap-3">
                        <Users className="w-8 h-8" />
                        Customers
                    </h1>
                    <p className="text-slate-500 font-medium">Manage your client directory</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCustomer(null);
                        setFormData({ full_name: "", phone: "", email: "", address: "", notes: "" });
                        setIsModalOpen(true);
                    }}
                    className="bg-[#B03050] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-[#902040] transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Add Customer
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8ECE9] mb-8 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="flex-1 outline-none font-medium text-slate-700 placeholder:text-slate-300"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading Directory...</div>
            ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-[#E8ECE9]">
                    <p className="text-slate-400 mb-4">No customers found.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {paginatedCustomers.map(customer => (
                            <div key={customer.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E8ECE9] hover:border-[#B03050] hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-[#B03050] font-black">
                                            {customer.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{customer.full_name}</h3>
                                            <p className="text-xs text-slate-400">
                                                {customer.last_order_date
                                                    ? `Last Order: ${new Date(customer.last_order_date).toLocaleDateString()}`
                                                    : `Added ${new Date(customer.created_at).toLocaleDateString()}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(customer)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#B03050]">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(customer.id)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-slate-600">
                                    {customer.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-slate-300" />
                                            {customer.phone}
                                        </div>
                                    )}
                                    {customer.address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-slate-300 mt-0.5" />
                                            <span className="flex-1">{customer.address}</span>
                                        </div>
                                    )}
                                    {customer.notes && (
                                        <div className="flex items-start gap-2 bg-yellow-50 p-2 rounded-lg text-yellow-800 text-xs mt-3">
                                            <FileText className="w-3 h-3 mt-0.5" />
                                            <span className="flex-1">{customer.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-full bg-white border border-[#E8ECE9] text-slate-500 disabled:opacity-50 hover:bg-[#FDFBF7] transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-bold text-slate-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-full bg-white border border-[#E8ECE9] text-slate-500 disabled:opacity-50 hover:bg-[#FDFBF7] transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl my-8 border border-[#E8ECE9]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-serif font-bold text-slate-900">
                                {editingCustomer ? "Edit Customer" : "New Customer"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                        placeholder="e.g. Amina Yusuf"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full p-3 bg-[#FAFAFA] rounded-xl font-bold text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                        placeholder="e.g. 08012345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full p-3 bg-[#FAFAFA] rounded-xl font-medium text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors min-h-[80px]"
                                        placeholder="Delivery address..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Notes (Preferences/Allergies)</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full p-3 bg-[#FAFAFA] rounded-xl font-medium text-slate-800 border border-[#E8ECE9] outline-none focus:border-[#B03050] transition-colors"
                                        placeholder="e.g. Likes less sugar"
                                    />
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full py-4 bg-[#B03050] text-white rounded-xl font-bold hover:bg-[#902040] transition-all mt-4 flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
                                >
                                    <Save className="w-5 h-5" /> Save Customer
                                </button>
                            </div>

                            {/* Right Column: Order History (Only if editing) */}
                            {editingCustomer && (
                                <div className="border-t md:border-t-0 md:border-l border-[#E8ECE9] md:pl-8 pt-8 md:pt-0">
                                    <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Order History
                                    </h3>

                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {editingCustomer.orders && editingCustomer.orders.length > 0 ? (
                                            editingCustomer.orders.map((order: any) => (
                                                <Link
                                                    href={`/orders/${order.id}`}
                                                    key={order.id}
                                                    className="block p-3 bg-[#FAFAFA] rounded-xl hover:bg-pink-50 transition-colors border border-[#E8ECE9] hover:border-[#B03050]"
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-slate-700">#{order.id.slice(0, 6)}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            order.status === 'Baking' ? 'bg-blue-100 text-blue-700' :
                                                                order.status === 'Ready' ? 'bg-green-100 text-green-700' :
                                                                    'bg-slate-200 text-slate-600'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                                        <span>{new Date(order.delivery_date || order.created_at).toLocaleDateString()}</span>
                                                        <span className="font-bold text-slate-600">₦{order.total_price?.toLocaleString()}</span>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-slate-400 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E8ECE9]">
                                                No past orders found.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
