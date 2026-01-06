import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts (optional, using standard fonts for now to ensure compatibility)
// You can register custom fonts like Playfair Display if you have the .ttf files

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#B03050',
    paddingBottom: 20,
  },
  logoSection: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    color: '#B03050',
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Helvetica-Bold',
  },
  companyDetails: {
    fontSize: 10,
    color: '#64748B',
  },
  invoiceTitle: {
    fontSize: 32,
    color: '#1E293B',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  invoiceMeta: {
    marginTop: 10,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
    marginRight: 10,
  },
  metaValue: {
    fontSize: 10,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  billTo: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#B03050',
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FDFBF7',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECE9',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    padding: 10,
  },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },

  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  rowText: {
    fontSize: 10,
    color: '#334155',
  },
  rowSubText: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 2,
  },
  totals: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    width: '50%',
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748B',
    width: '50%',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    fontSize: 10,
    color: '#1E293B',
    width: '50%',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#B03050',
    width: '50%',
  },
  grandTotalLabel: {
    fontSize: 14,
    color: '#B03050',
    fontWeight: 'bold',
    width: '50%',
    textAlign: 'right',
    paddingRight: 10,
  },
  grandTotalValue: {
    fontSize: 14,
    color: '#B03050',
    fontWeight: 'bold',
    width: '50%',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E8ECE9',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
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
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.companyName}>Bakes & More</Text>
            <Text style={styles.companyDetails}>123 Bakery Lane, Sweet City</Text>
            <Text style={styles.companyDetails}>+234 800 BAKERY</Text>
            <Text style={styles.companyDetails}>hello@bakesandmore.com</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceMeta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice #:</Text>
                <Text style={styles.metaValue}>{order.id.toString().padStart(6, '0')}</Text>
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
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text style={styles.customerName}>{order.customer_name}</Text>
          {order.customer_phone && <Text style={styles.rowText}>{order.customer_phone}</Text>}
          {order.customer_email && <Text style={styles.rowText}>{order.customer_email}</Text>}
          {order.delivery_address && <Text style={styles.rowText}>{order.delivery_address}</Text>}
        </View>

        {/* Notes */}
        {(order.customer_notes || order.notes) && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Notes:</Text>
            {order.customer_notes && <Text style={styles.rowText}>{order.customer_notes}</Text>}
            {order.notes && <Text style={styles.rowText}>{order.notes}</Text>}
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDesc]}>Description</Text>
            <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
            <Text style={[styles.headerText, styles.colPrice]}>Price</Text>
            <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
          </View>

          {order.order_items?.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.rowText}>
                  {item.recipes?.name || item.fillings?.name || 'Custom Item'}
                </Text>
                <Text style={styles.rowSubText}>
                  {item.size_inches}" • {item.layers} Layers
                  {item.custom_extras && item.custom_extras.length > 0 ? ` • +${item.custom_extras.length} extras` : ''}
                </Text>
              </View>
              <Text style={[styles.rowText, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.rowText, styles.colPrice]}>{formatCurrency(item.item_price)}</Text>
              <Text style={[styles.rowText, styles.colTotal]}>{formatCurrency(item.item_price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.total_price)}</Text>
          </View>
          {/* Add Tax/Discount rows here if needed */}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(order.total_price)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerText}>Payment is due upon receipt.</Text>
          {order.account_details && (
            <Text style={{ ...styles.footerText, marginTop: 5, fontWeight: 'bold' }}>
              {order.account_details.replace(/\n/g, ' ')}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
