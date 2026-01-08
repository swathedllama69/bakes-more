import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// --- FONT REGISTRATION ---
// Using Noto Sans as it has excellent unicode support for currency symbols like Naira
Font.register({
    family: 'Noto Sans',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNr5TRA.ttf', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/notosans/v27/o-0NIpQlx3QUlC5A4PNjXhFVZNyB.ttf', fontWeight: 700 }
    ]
});

// A nice serif font for headers
Font.register({
    family: 'Playfair Display',
    src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.ttf'
});

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Noto Sans',
        fontSize: 9,
        padding: 30,
        color: '#334155',
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },

    // --- BACKGROUND SHAPES ---
    shapeTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 8,
        backgroundColor: '#B03050',
    },
    watermark: {
        position: 'absolute',
        top: 300,
        left: 100,
        fontSize: 100,
        color: '#F1F5F9',
        transform: 'rotate(-45deg)',
        zIndex: -1,
        fontFamily: 'Playfair Display',
        opacity: 0.5,
    },

    // --- HEADER ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        marginTop: 10,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    brandBlock: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 80, // Increased size
        height: 80,
        marginRight: 15,
        borderRadius: 8,
        objectFit: 'contain',
    },
    brandName: {
        fontSize: 24,
        fontFamily: 'Playfair Display', // Elegant font for brand
        color: '#B03050',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    brandSub: {
        fontSize: 10,
        fontStyle: 'italic', // Styled subtitle
        color: '#64748B',
        marginBottom: 6,
        fontFamily: 'Playfair Display',
    },
    contactInfo: {
        fontSize: 8,
        color: '#94A3B8',
        lineHeight: 1.3,
    },

    invoiceTitleBlock: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    invoiceTitle: {
        fontSize: 32,
        fontFamily: 'Playfair Display',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: 2,
    },
    invoiceMeta: {
        fontSize: 9,
        color: '#64748B',
        textAlign: 'right',
        marginTop: 2,
    },

    // --- INFO GRID ---
    infoGrid: {
        flexDirection: 'row',
        marginBottom: 25,
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 6,
    },
    infoCol: {
        flex: 1,
    },
    label: {
        fontSize: 8,
        color: '#94A3B8',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    value: {
        fontSize: 10,
        color: '#0F172A',
        fontWeight: 'bold',
    },
    valueSmall: {
        fontSize: 9,
        color: '#334155',
        marginTop: 1,
    },

    // --- TABLE ---
    table: {
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    th: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },

    // Columns
    colDesc: { width: '55%' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '17.5%', textAlign: 'right' },
    colTotal: { width: '17.5%', textAlign: 'right' },

    itemName: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 2,
    },
    itemMeta: {
        fontSize: 8,
        color: '#64748B',
        marginBottom: 4,
        fontStyle: 'italic',
    },

    // Breakdown
    breakdown: {
        marginTop: 2,
        paddingLeft: 8,
        borderLeftWidth: 1.5,
        borderLeftColor: '#E2E8F0',
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    breakdownLabel: {
        fontSize: 8,
        color: '#64748B',
    },
    breakdownPrice: {
        fontSize: 8,
        color: '#475569',
    },

    // --- FOOTER & TOTALS ---
    footerSection: {
        flexDirection: 'row',
        marginTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#B03050',
        paddingTop: 15,
    },
    paymentInfo: {
        flex: 1,
        paddingRight: 40,
    },
    totalsInfo: {
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        paddingBottom: 2,
    },
    totalLabel: {
        fontSize: 9,
        color: '#64748B',
    },
    totalValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    grandTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    grandTotalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#B03050',
        textTransform: 'uppercase',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#B03050',
    },
    balanceBlock: {
        marginTop: 10,
        backgroundColor: '#F1F5F9',
        padding: 8,
        borderRadius: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // Page Footer
    pageFooter: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 8,
        color: '#94A3B8',
    }
});

interface InvoicePDFProps {
    order: any;
    settings?: any;
    allFillings?: any[]; // Passed from parent to lookup names
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ order, settings, allFillings = [] }) => {

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const formatCurrency = (amount: any) => {
        const num = Number(amount) || 0;
        // Using Unicode Character for Naira. 
        // Noto Sans font supports this.
        return `₦${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const subTotal = (order.total_price || 0) + (order.discount || 0) - (order.tip || 0) - (order.vat_type === 'exclusive' ? (order.vat || 0) : 0);
    const balance = Math.max(0, (order.total_price || 0) - (order.amount_paid || 0));

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Decor */}
                <View style={styles.shapeTop} fixed />
                <Text style={styles.watermark} fixed>BAKES</Text>

                {/* 1. Header */}
                <View style={styles.header}>
                    <View style={styles.brandBlock}>
                        {/* Logo */}
                        <Image src="/logo.png" style={styles.logo} />
                        <View>
                            <Text style={styles.brandName}>BAKES & MORE</Text>
                            <Text style={styles.brandSub}>By Hafsaa</Text>
                            <Text style={styles.contactInfo}>{settings?.company_phone}</Text>
                            <Text style={styles.contactInfo}>{settings?.company_address}</Text>
                        </View>
                    </View>
                    <View style={styles.invoiceTitleBlock}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={styles.invoiceMeta}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.invoiceMeta}>Date: {formatDate(order.created_at)}</Text>
                    </View>
                </View>

                {/* 2. Client Info */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                        <Text style={styles.label}>Bill To</Text>
                        <Text style={styles.value}>{order.customer_name}</Text>
                        <Text style={styles.valueSmall}>{order.customer_phone}</Text>
                        {order.customer_email && <Text style={styles.valueSmall}>{order.customer_email}</Text>}
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={styles.label}>Notes</Text>
                        <Text style={styles.valueSmall}>{order.notes || 'No notes'}</Text>
                    </View>
                    <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: balance > 0 ? '#B03050' : '#16A34A' }}>
                            {balance > 0 ? 'UNPAID' : 'PAID'}
                        </Text>
                        <Text style={styles.valueSmall}>Due: {formatDate(order.delivery_date)}</Text>
                    </View>
                </View>

                {/* 3. Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, styles.colDesc]}>Description</Text>
                        <Text style={[styles.th, styles.colQty]}>Qty</Text>
                        <Text style={[styles.th, styles.colPrice]}>Price</Text>
                        <Text style={[styles.th, styles.colTotal]}>Total</Text>
                    </View>

                    {order.order_items?.map((item: any, i: number) => {
                        const isDessert = !!item.desserts;
                        const name = isDessert ? item.desserts?.name : item.recipes?.name || 'Custom Cake';
                        const desc = isDessert ? item.desserts?.description : `${item.size_inches}" Cake (${item.layers} Layers)`;

                        // Calc Extras
                        let extrasTotal = 0;
                        let extrasList: any[] = [];
                        if (item.custom_extras?.addons && Array.isArray(item.custom_extras.addons)) {
                            extrasList = item.custom_extras.addons;
                            extrasTotal = extrasList.reduce((acc: number, ex: any) => acc + (Number(ex.price) || 0), 0);
                        }

                        // Calc Fillings (Exact logic from OrderDetails)
                        let fillingPrice = 0;
                        let fillingNames: string[] = [];

                        if (!isDessert && item.fillings) {
                            if (Array.isArray(item.fillings)) {
                                item.fillings.forEach((fid: string | any) => {
                                    // fid can be ID string or object
                                    const fId = typeof fid === 'string' ? fid : fid.id;

                                    // Try finding in passed allFillings list
                                    const found = allFillings.find((f: any) => f.id === fId);

                                    if (found) {
                                        fillingNames.push(found.name);
                                        fillingPrice += (Number(found.price) || 0);
                                    } else if (typeof fid === 'object' && fid.name) {
                                        // Fallback if the array already contains objects
                                        fillingNames.push(fid.name);
                                        fillingPrice += (Number(fid.price) || 0);
                                    }
                                });
                            } else if (typeof item.fillings === 'object' && item.fillings !== null) {
                                fillingNames.push(item.fillings.name);
                                fillingPrice = Number(item.fillings.price) || 0;
                            }
                        }

                        // Base Price Calculation
                        const unitTotal = Number(item.item_price);
                        const baseUnit = Math.max(0, unitTotal - fillingPrice - extrasTotal);

                        return (
                            <View key={i} style={styles.tableRow}>
                                <View style={styles.colDesc}>
                                    <Text style={styles.itemName}>{name}</Text>
                                    <Text style={styles.itemMeta}>{desc}</Text>

                                    {/* Detailed Breakdown */}
                                    <View style={styles.breakdown}>
                                        <View style={styles.breakdownRow}>
                                            <Text style={styles.breakdownLabel}>Base Price</Text>
                                            <Text style={styles.breakdownPrice}>{formatCurrency(baseUnit)}</Text>
                                        </View>

                                        {/* Filling Breakdown */}
                                        {fillingNames.map((fname, idx) => (
                                            <View key={`fill-${idx}`} style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>+ Filling: {fname}</Text>
                                                {/* Individual filling price isn't always available here if aggregated, showing total below is safer */}
                                            </View>
                                        ))}
                                        {fillingPrice > 0 && (
                                            <View style={styles.breakdownRow}>
                                                <Text style={[styles.breakdownLabel, { fontStyle: 'italic' }]}>  (Fillings Total)</Text>
                                                <Text style={styles.breakdownPrice}>{formatCurrency(fillingPrice)}</Text>
                                            </View>
                                        )}

                                        {/* Extras Breakdown */}
                                        {extrasList.map((ex, idx) => (
                                            <View key={`ex-${idx}`} style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>+ {ex.name}</Text>
                                                <Text style={styles.breakdownPrice}>{formatCurrency(ex.price)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                <Text style={[styles.colQty, { paddingTop: 4 }]}>{item.quantity}</Text>
                                <Text style={[styles.colPrice, { paddingTop: 4 }]}>{formatCurrency(unitTotal)}</Text>
                                <Text style={[styles.colTotal, { paddingTop: 4, fontWeight: 'bold' }]}>
                                    {formatCurrency(unitTotal * item.quantity)}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* 4. Footer & Totals */}
                <View style={styles.footerSection}>
                    <View style={styles.paymentInfo}>
                        <Text style={styles.label}>Payment Details</Text>
                        <Text style={{ fontSize: 9, color: '#334155', lineHeight: 1.5 }}>
                            {order.account_details || "Please contact us for payment instructions."}
                        </Text>
                    </View>

                    <View style={styles.totalsInfo}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>{formatCurrency(subTotal)}</Text>
                        </View>
                        {order.discount > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Discount</Text>
                                <Text style={[styles.totalValue, { color: '#16A34A' }]}>- {formatCurrency(order.discount)}</Text>
                            </View>
                        )}
                        {order.vat > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>VAT (7.5%)</Text>
                                <Text style={styles.totalValue}>{formatCurrency(order.vat)}</Text>
                            </View>
                        )}
                        {order.tip > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Tip</Text>
                                <Text style={styles.totalValue}>+ {formatCurrency(order.tip)}</Text>
                            </View>
                        )}

                        <View style={styles.grandTotal}>
                            <Text style={styles.grandTotalLabel}>Total Due</Text>
                            <Text style={styles.grandTotalValue}>{formatCurrency(order.total_price)}</Text>
                        </View>

                        {order.amount_paid > 0 && (
                            <View style={[styles.totalRow, { marginTop: 4 }]}>
                                <Text style={styles.totalLabel}>Amount Paid</Text>
                                <Text style={[styles.totalValue, { color: '#16A34A' }]}>- {formatCurrency(order.amount_paid)}</Text>
                            </View>
                        )}

                        <View style={styles.balanceBlock}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: balance > 0 ? '#B91C1C' : '#15803D' }}>
                                {balance > 0 ? 'BALANCE DUE' : 'PAID IN FULL'}
                            </Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: balance > 0 ? '#B91C1C' : '#15803D' }}>
                                {formatCurrency(balance)}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.pageFooter} fixed>
                    <Text style={styles.footerText}>Thank you for choosing Bakes & More! We appreciate your business.</Text>
                </View>

            </Page>
        </Document>
    );
};

export default InvoicePDF;