"use client";
import dynamic from "next/dynamic";
import { Printer } from "lucide-react";
import { useState, useEffect } from "react";
import InvoicePDF from "@/components/pdf/InvoicePDF";

const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

interface InvoicePDFButtonProps {
    order: any;
    variant?: "default" | "compact";
    className?: string;
    buttonText?: string;
}

export default function InvoicePDFButton({ order, variant = "default", className, buttonText = "Invoice" }: InvoicePDFButtonProps) {
    const [shouldGenerate, setShouldGenerate] = useState(false);
    const [hasDownloaded, setHasDownloaded] = useState(false);

    if (variant === "compact") {
        // Compact version for mobile cards
        if (!shouldGenerate) {
            return (
                <button
                    onClick={() => setShouldGenerate(true)}
                    className={className || "text-xs font-bold text-[#B03050] hover:underline flex items-center gap-1"}
                >
                    <Printer className="w-3 h-3" />
                    {buttonText}
                </button>
            );
        }

        return (
            <PDFDownloadLink
                document={<InvoicePDF order={order} />}
                fileName={`invoice-${order.id}.pdf`}
                className={className || "text-xs font-bold text-[#B03050] hover:underline flex items-center gap-1"}
            >
                {({ loading, url }) => {
                    useEffect(() => {
                        if (!loading && url && !hasDownloaded) {
                            setHasDownloaded(true);
                            // Trigger download
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `invoice-${order.id}.pdf`;
                            link.click();
                        }
                    }, [loading, url]);

                    return (
                        <>
                            <Printer className="w-3 h-3" />
                            {loading ? '...' : hasDownloaded ? '✓' : buttonText}
                        </>
                    );
                }}
            </PDFDownloadLink>
        );
    }

    // Default version for detail page
    if (!shouldGenerate) {
        return (
            <button
                onClick={() => setShouldGenerate(true)}
                className={className || "group flex items-center gap-2 px-4 py-3 bg-white border border-[#E8ECE9] rounded-full text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"}
            >
                <Printer className="w-4 h-4" />
                <span className="text-xs font-bold hidden group-hover:inline">{buttonText}</span>
            </button>
        );
    }

    return (
        <PDFDownloadLink
            document={<InvoicePDF order={order} />}
            fileName={`Invoice-${order.id}.pdf`}
            className={className || "group flex items-center gap-2 px-4 py-3 bg-white border border-[#E8ECE9] rounded-full text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"}
        >
            {({ loading, url }) => {
                useEffect(() => {
                    if (!loading && url && !hasDownloaded) {
                        setHasDownloaded(true);
                        // Trigger download
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `Invoice-${order.id}.pdf`;
                        link.click();
                    }
                }, [loading, url]);

                return (
                    <>
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                                <span className="text-xs font-bold">Generating...</span>
                            </>
                        ) : hasDownloaded ? (
                            <>
                                <Printer className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-bold text-green-600">Downloaded ✓</span>
                            </>
                        ) : (
                            <>
                                <Printer className="w-4 h-4" />
                                <span className="text-xs font-bold hidden group-hover:inline">{buttonText}</span>
                            </>
                        )}
                    </>
                );
            }}
        </PDFDownloadLink>
    );
}
