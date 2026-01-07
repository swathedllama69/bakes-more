import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register local fonts (downloaded to public/fonts)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf' },
    { src: '/fonts/Roboto-Italic.ttf', fontStyle: 'italic' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 25,
    paddingTop: 30,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
    backgroundColor: '#FDFBF7',
    padding: 18,
    borderRadius: 8,
  },
  brandColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#B03050',
    borderRadius: 12,
  },
  brandText: {
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#B03050',
    letterSpacing: 1,
    marginBottom: 4,
  },
  companySub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  invoiceMetaBox: {
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    letterSpacing: 2,
  },
  invoiceMetaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: 10,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  
  // Info Section
  infoSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#B03050',
    marginRight: 15,
  },
  infoTitle: {
    fontSize: 8,
    color: '#B03050',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.5,
  },
  infoTextBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 3,
  },
  
  // Table with more spacing
  tableSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  tableTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  table: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  
  // Columns with better spacing
  colNum: { width: '8%' },
  colDesc: { width: '52%' },
  colQty: { width: '12%', textAlign: 'center' },
  colPrice: { width: '14%', textAlign: 'right' },
  colTotal: { width: '14%', textAlign: 'right' },

  itemName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 3,
  },
  itemDetails: {
    fontSize: 9,
    color: '#64748B',
    fontStyle: 'italic',
  },
  cellText: {
    fontSize: 10,
    color: '#334155',
  },
  
  // Summary with decorative elements
  summarySection: {
    flexDirection: 'row',
    marginTop: 30,
  },
  paymentBox: {
    flex: 2,
    backgroundColor: '#FFF7ED',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
    marginRight: 15,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B45309',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  paymentText: {
    fontSize: 9,
    color: '#78350F',
    lineHeight: 1.6,
  },
  
  totalsBox: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#B03050',
    borderRadius: 8,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#94A3B8',
    lineHeight: 1.5,
  },
  footerBrand: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B03050',
    marginTop: 4,
  }
});

interface InvoicePDFProps {
  order: any;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ order }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    // Now using local Roboto fonts which support the Naira symbol
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandColumn}>
            <Image src="/logo.png" style={styles.logo} />
            <View style={styles.brandText}>
              <Text style={styles.companyName}>BAKES & MORE</Text>
              <Text style={styles.companySub}>Tel: +234 901 567 0411</Text>
              <Text style={styles.companySub}>bakesandmore.com.ng</Text>
            </View>
          </View>
          
          <View style={styles.invoiceMetaBox}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.metaLabel}>Invoice #: </Text>
              <Text style={styles.metaValue}>#{order.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.metaLabel}>Order Date: </Text>
              <Text style={styles.metaValue}>{formatDate(order.created_at)}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.metaLabel}>Delivery: </Text>
              <Text style={styles.metaValue}>{formatDate(order.delivery_date)}</Text>
            </View>
          </View>
        </View>

        {/* Info Boxes */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Bill To</Text>
            <Text style={styles.infoTextBold}>{order.customer_name}</Text>
            {order.customer_phone && <Text style={styles.infoText}>{order.customer_phone}</Text>}
            {order.customer_email && <Text style={styles.infoText}>{order.customer_email}</Text>}
          </View>
          
          {(order.customer_notes || order.notes) && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Notes</Text>
              <Text style={styles.infoText}>
                {order.customer_notes || order.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>Order Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.colNum]}>#</Text>
              <Text style={[styles.headerText, styles.colDesc]}>Item Description</Text>
              <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
              <Text style={[styles.headerText, styles.colPrice]}>Unit Price</Text>
              <Text style={[styles.headerText, styles.colTotal]}>Amount</Text>
            </View>

            {order.order_items?.map((item: any, index: number) => (
              <View key={index} style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                <Text style={[styles.cellText, styles.colNum]}>{index + 1}</Text>
                <View style={styles.colDesc}>
                  <Text style={styles.itemName}>
                    {item.recipes?.name || item.fillings?.name || 'Custom Item'}
                  </Text>
                  <Text style={styles.itemDetails}>
                    {item.size_inches && `${item.size_inches}" diameter`}
                    {item.layers && ` • ${item.layers} layers`}
                    {item.custom_extras?.length > 0 && ` • ${item.custom_extras.length} extra(s)`}
                  </Text>
                </View>
                <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.cellText, styles.colPrice]}>{formatCurrency(item.item_price)}</Text>
                <Text style={[styles.cellText, styles.colTotal, { fontWeight: 'bold' }]}>{formatCurrency(item.item_price * item.quantity)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          {/* Payment Details Box */}
          {order.account_details && (
            <View style={styles.paymentBox}>
              <Text style={styles.paymentTitle}>Payment Details</Text>
              <Text style={styles.paymentText}>{order.account_details}</Text>
            </View>
          )}

          {/* Totals */}
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total_price)}</Text>
            </View>
            {(order.amount_paid || 0) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount Paid</Text>
                <Text style={[styles.totalValue, { color: '#16A34A' }]}>-{formatCurrency(order.amount_paid || 0)}</Text>
              </View>
            )}
            {Math.max(0, order.total_price - (order.amount_paid || 0)) > 0 ? (
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>OUTSTANDING BALANCE</Text>
                <Text style={styles.grandTotalValue}>
                  {formatCurrency(Math.max(0, order.total_price - (order.amount_paid || 0)))}
                </Text>
              </View>
            ) : (order.amount_paid || 0) >= order.total_price ? (
              <View style={[styles.grandTotal, { backgroundColor: '#16A34A' }]}>
                <Text style={styles.grandTotalLabel}>PAID IN FULL</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(0)}</Text>
              </View>
            ) : (
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>TOTAL DUE</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(order.total_price)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Thank you for choosing us! We appreciate your business.</Text>
          <Text style={styles.footerBrand}>BAKES & MORE</Text>
        </View>

      </Page>
    </Document>
  );
};

export default InvoicePDF;
