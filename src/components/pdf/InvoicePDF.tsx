import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// --- FONT REGISTRATION (Local Files) ---
// Loading fonts from public/fonts/ directory matches the files you uploaded
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 700 },
    { src: '/fonts/Roboto-Italic.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: '/fonts/Roboto-BoldItalic.ttf', fontWeight: 700, fontStyle: 'italic' }
  ]
});

Font.register({
  family: 'Pacifico',
  src: '/fonts/Pacifico-Regular.ttf',
});

// --- CONSTANTS ---
// Use 'N' for Naira currency
const CURRENCY_SIGN = 'N';
const BRAND_COLOR = '#B03050';
const TEXT_DARK = '#1E293B';
const TEXT_LIGHT = '#64748B';

// --- HARDCODED ACCOUNT DETAILS ---
const DEFAULT_ACCOUNT_DETAILS = `616423897288
Moniepoint
Bakes & More By Hafsaa`;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto', // Using your local Roboto font
    fontSize: 9,
    padding: 30,
    color: TEXT_DARK,
    backgroundColor: '#FFFFFF',
  },

  // --- HEADER ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 110,
    height: 110,
    marginRight: 18,
    borderRadius: 8,
    objectFit: 'contain'
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 14,
    fontFamily: 'Pacifico', // Using your local Pacifico font for fancy text
    color: TEXT_LIGHT,
    marginTop: 4,
  },
  companyDetails: {
    marginTop: 6,
  },
  companyText: {
    fontSize: 9,
    color: TEXT_LIGHT,
    lineHeight: 1.4,
  },

  // --- INVOICE META ---
  invoiceMetaBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: 10,
    letterSpacing: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center'
  },
  metaLabel: {
    fontSize: 9,
    color: TEXT_LIGHT,
    width: 80,
    textAlign: 'right',
    marginRight: 8,
  },
  metaValue: {
    fontSize: 10,
    color: TEXT_DARK,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  // --- INFO GRID ---
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: BRAND_COLOR,
  },
  infoCol: {
    flex: 1,
  },
  colLabel: {
    fontSize: 8,
    color: TEXT_LIGHT,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  colText: {
    fontSize: 10,
    color: TEXT_DARK,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  colSub: {
    fontSize: 9,
    color: TEXT_LIGHT,
  },

  // --- TABLE ---
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: TEXT_DARK,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  th: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // Columns
  colDesc: { width: '50%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },

  itemName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: 2
  },
  itemMeta: {
    fontSize: 9,
    color: TEXT_LIGHT,
    fontStyle: 'italic',
    marginBottom: 6,
  },

  // --- BREAKDOWN ---
  breakdownContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  breakdownLabel: {
    fontSize: 9,
    color: TEXT_LIGHT,
    paddingLeft: 8,
  },
  breakdownPrice: {
    fontSize: 9,
    color: TEXT_LIGHT,
    fontWeight: 'bold'
  },
  sectionHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // --- FOOTER & TOTALS ---
  footerSection: {
    flexDirection: 'row',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 20,
  },
  paymentBox: {
    flex: 1.5,
    paddingRight: 40,
  },
  totalsBox: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 2,
  },
  totalLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: TEXT_DARK,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND_COLOR,
    textTransform: 'uppercase',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND_COLOR,
  },

  // --- PAGE FOOTER ---
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
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});

// Safe money formatter using simple strings
const formatMoney = (amount: any) => {
  const num = Number(amount) || 0;
  return `${CURRENCY_SIGN}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface InvoicePDFProps {
  order: any;
  settings?: any;
  allFillings?: any[];
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ order, settings, allFillings = [] }) => {

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const subTotal = (order.total_price || 0) + (order.discount || 0) - (order.tip || 0) - (order.vat_type === 'exclusive' ? (order.vat || 0) : 0);
  const balance = Math.max(0, (order.total_price || 0) - (order.amount_paid || 0));
  const isPaid = balance <= 0;

  // Determine account details: Use passed details, order details, or hardcoded default
  const accountDetailsToDisplay = order.account_details || settings?.account_details || DEFAULT_ACCOUNT_DETAILS;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.brandColumn}>
            {/* Ensure logo.png is in public/logo.png */}
            <Image src="/logo.png" style={styles.logo} />
            <View>
              <Text style={styles.brandName}>{settings?.company_name || "BAKES & MORE"}</Text>
              <Text style={styles.brandSub}>By Hafsaa</Text>
              <View style={styles.companyDetails}>
                <Text style={styles.companyText}>{settings?.company_phone}</Text>
                <Text style={styles.companyText}>{settings?.company_address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.invoiceMetaBlock}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice #:</Text>
              <Text style={styles.metaValue}>#{order.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>{formatDate(order.created_at)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due Date:</Text>
              <Text style={styles.metaValue}>{formatDate(order.delivery_date)}</Text>
            </View>
          </View>
        </View>

        {/* --- CLIENT INFO --- */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={{ ...styles.colLabel, fontSize: 12 }}>Bill To</Text>
            <Text style={{ ...styles.colText, fontSize: 13 }}>{order.customer_name}</Text>
            <Text style={{ ...styles.colSub, fontSize: 11 }}>{order.customer_phone}</Text>
            {order.customer_email && <Text style={{ ...styles.colSub, fontSize: 11 }}>{order.customer_email}</Text>}
          </View>
          <View style={styles.infoCol}>
            <Text style={{ ...styles.colLabel, fontSize: 12 }}>Address</Text>
            <Text style={{ ...styles.colSub, fontSize: 11 }}>{order.notes || 'No address provided.'}</Text>
          </View>
          <View style={[styles.infoCol, { alignItems: 'flex-end', justifyContent: 'center' }]}>
            <View style={{ backgroundColor: !isPaid ? '#FEF2F2' : '#F0FDF4', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: !isPaid ? '#FECACA' : '#BBF7D0' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: !isPaid ? '#B91C1C' : '#15803D' }}>
                {!isPaid ? 'UNPAID' : 'PAID'}
              </Text>
            </View>
          </View>
        </View>

        {/* --- ITEMS TABLE --- */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.th, styles.colTotal]}>Amount</Text>
          </View>

          {order.order_items?.map((item: any, i: number) => {
            const isDessert = !!item.dessert_id;
            const name = isDessert ? item.desserts?.name || 'Dessert' : item.recipes?.name || 'Custom Cake';

            // --- FILLINGS LOGIC ---
            let fillingTotal = 0;
            let fillingBreakdown: { name: string, price: number }[] = [];

            // Explicit Count of Fillings
            const numFillings = (item.fillings && Array.isArray(item.fillings)) ? item.fillings.length : 0;

            if (!isDessert && numFillings > 0) {
              item.fillings.forEach((fid: string | any) => {
                const idToFind = typeof fid === 'object' ? String(fid.id) : String(fid);
                let found = null;

                if (allFillings && allFillings.length > 0) {
                  found = allFillings.find((f: any) => String(f.id) === idToFind);
                }

                if (found) {
                  const price = Number(found.price) || 0;
                  fillingTotal += price;
                  fillingBreakdown.push({ name: found.name, price });
                }
                // We purposefully do NOT add "Unknown Filling" lines anymore to keep it clean.
              });
            }

            // --- BUILD DESCRIPTION ---
            let desc = isDessert
              ? item.desserts?.description
              : `${item.size_inches}" Cake (${item.layers} Layers) - ${item.recipes?.flavor || 'Standard'}`;

            // Show Count Summary in Description
            if (numFillings > 0) {
              const plural = numFillings === 1 ? 'Filling' : 'Fillings';
              desc += `\n(Includes: ${numFillings} ${plural})`;
            }

            // --- MATH LOGIC ---
            const qty = item.quantity || 1;
            const dbItemPrice = Number(item.item_price); // Price from DB (Includes Fillings)

            // Extras
            let extrasTotal = 0;
            let extrasList: any[] = [];
            if (item.custom_extras?.addons && Array.isArray(item.custom_extras.addons)) {
              extrasList = item.custom_extras.addons;
              extrasTotal = extrasList.reduce((acc: number, ex: any) => acc + (Number(ex.price) || 0), 0);
            }

            // --- BASE PRICE CALCULATION ---
            const baseUnitPrice = Math.max(0, dbItemPrice - fillingTotal);

            // Line Total
            const lineTotal = (dbItemPrice * qty) + extrasTotal;

            return (
              <View key={i} style={styles.tableRow}>
                {/* Description Column */}
                <View style={styles.colDesc}>
                  <Text style={styles.itemName}>{name}</Text>
                  <Text style={styles.itemMeta}>{desc}</Text>

                  {/* BREAKDOWN BOX */}
                  <View style={styles.breakdownContainer}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Base Price</Text>
                      <Text style={styles.breakdownPrice}>{formatMoney(baseUnitPrice)}</Text>
                    </View>

                    {/* Filling Breakdown - Shows price of each filling */}
                    {fillingBreakdown.length > 0 && (
                      <View>
                        <Text style={styles.sectionHeader}>Fillings</Text>
                        {fillingBreakdown.map((f, idx) => (
                          <View key={`fill-${idx}`} style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>+ {f.name}</Text>
                            <Text style={styles.breakdownPrice}>{formatMoney(f.price)}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Extras Breakdown */}
                    {extrasList.length > 0 && (
                      <View>
                        <Text style={styles.sectionHeader}>Extras & Toppings</Text>
                        {extrasList.map((ex, idx) => (
                          <View key={`ex-${idx}`} style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>+ {ex.name}</Text>
                            <Text style={styles.breakdownPrice}>{formatMoney(ex.price)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Columns */}
                <Text style={styles.colQty}>{qty}</Text>
                <Text style={styles.colPrice}>{formatMoney(dbItemPrice)}</Text>
                <Text style={styles.colTotal}>{formatMoney(lineTotal)}</Text>
              </View>
            );
          })}
        </View>

        {/* --- FOOTER & TOTALS --- */}
        <View style={styles.footerSection}>
          <View style={styles.paymentBox}>
            {/* CONDITIONAL PAYMENT DETAILS DISPLAY */}
            {!isPaid ? (
              <View>
                <Text style={styles.colLabel}>Payment Details</Text>
                {/* INCREASED FONT SIZE (12) & BLACK COLOR */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#000000', lineHeight: 1.5, fontFamily: 'Roboto' }}>
                  {accountDetailsToDisplay}
                </Text>
                <Text style={{ fontSize: 9, color: TEXT_LIGHT, marginTop: 4 }}>
                  Please use Order #{order.id.slice(0, 8).toUpperCase()} as reference.
                </Text>
              </View>
            ) : (
              <View style={{ padding: 10, backgroundColor: '#F0FDF4', borderRadius: 6, borderLeftWidth: 3, borderLeftColor: '#16A34A' }}>
                <Text style={{ fontSize: 9, color: '#15803D', fontWeight: 'bold', marginBottom: 2 }}>PAYMENT COMPLETE</Text>
                <Text style={{ fontSize: 8, color: '#16A34A' }}>
                  Thank you for your payment!
                </Text>
              </View>
            )}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatMoney(subTotal)}</Text>
            </View>

            {order.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: '#16A34A' }]}>- {formatMoney(order.discount)}</Text>
              </View>
            )}

            {order.vat > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>VAT (7.5%)</Text>
                <Text style={styles.totalValue}>{formatMoney(order.vat)}</Text>
              </View>
            )}

            {order.tip > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tip</Text>
                <Text style={styles.totalValue}>+ {formatMoney(order.tip)}</Text>
              </View>
            )}

            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>{formatMoney(order.total_price)}</Text>
            </View>

            {order.amount_paid > 0 && (
              <View style={[styles.totalRow, { marginTop: 6 }]}>
                <Text style={styles.totalLabel}>Amount Paid</Text>
                <Text style={[styles.totalValue, { color: '#16A34A' }]}>- {formatMoney(order.amount_paid)}</Text>
              </View>
            )}

            <View style={{ marginTop: 8, padding: 8, backgroundColor: !isPaid ? '#FEF2F2' : '#F0FDF4', borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: !isPaid ? '#B91C1C' : '#15803D' }}>
                {!isPaid ? 'BALANCE DUE' : 'PAID IN FULL'}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: !isPaid ? '#B91C1C' : '#15803D' }}>
                {formatMoney(balance)}
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