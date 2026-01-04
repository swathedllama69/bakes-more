"use client";

import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'info';
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    confirmText = "Confirm",
    cancelText = "Cancel"
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const colors = {
        danger: {
            bg: 'bg-red-50',
            icon: 'text-red-600',
            button: 'bg-red-600 hover:bg-red-700',
            iconComponent: AlertTriangle
        },
        success: {
            bg: 'bg-green-50',
            icon: 'text-green-600',
            button: 'bg-green-600 hover:bg-green-700',
            iconComponent: CheckCircle
        },
        info: {
            bg: 'bg-blue-50',
            icon: 'text-blue-600',
            button: 'bg-slate-900 hover:bg-slate-800',
            iconComponent: Info
        }
    };

    const theme = colors[type];
    const Icon = theme.iconComponent;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${theme.bg} ${theme.icon}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all ${theme.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
