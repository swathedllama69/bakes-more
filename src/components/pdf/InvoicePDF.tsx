import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts for better unicode support (including currency)
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
});
Font.register({
  family: 'Roboto-Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
  fontWeight: 'bold',
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Roboto',
    paddingBottom: 60, // Space for footer
  },
  headerContainer: {
    backgroundColor: '#FAF5FF', // Light purple background for header
    padding: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
    marginBottom: 10,
  },
  companyCol: {
    flexDirection: 'column',
    maxWidth: 250,
  },
  companyName: {
    fontSize: 24,
    color: '#7E22CE', // Purple-700
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 1.4,
  },
  invoiceCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  invoiceTitle: {
    fontSize: 36,
    color: '#1E293B',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  metaContainer: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 4,
    width: 200,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 10,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  
  // Content Body
  bodyContainer: {
    paddingHorizontal: 40,
  },
  billToSection: {
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  customerDetail: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },

  // Table
  tableContainer: {
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '17.5%', textAlign: 'right' },
  colTotal: { width: '17.5%', textAlign: 'right' },
  
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  rowItemName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  rowItemDetails: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 3,
  },
  rowText: {
    fontSize: 11,
    color: '#334155',
  },

  // Totals Area
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  totalContainer: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 11,
    color: '#334155',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#7E22CE',
  },
  grandTotalLabel: {
    fontSize: 14,
    color: '#7E22CE',
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 16,
    color: '#7E22CE',
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  footerText: {
    fontSize: 9,
    color: '#64748B',
    marginHorizontal: 10,
  },
  paymentInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0F9FF', // Light Blue
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 4,
  },
  paymentDetails: {
    fontSize: 9,
    color: '#334155',
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
    // Using NGN code or symbol if font supports it
    // With Roboto registered, ₦ should render.
    // Fallback included just in case
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header Block */}
        <View style={styles.headerContainer}>
          <View style={styles.companyCol}>
            {/* Logo Image - Make sure /logo.png exists in your public folder */}
            <Image 
              src="/logo.png" 
              style={styles.logo} 
            />
            <Text style={styles.companyName}>Bakes & More</Text>
            <Text style={styles.companyDetails}>+234 901 567 0411</Text>
            <Text style={styles.companyDetails}>bakesandmore.com.ng</Text>
          </View>
          
          <View style={styles.invoiceCol}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice #:</Text>
                <Text style={styles.metaValue}>{order.id.slice(0, 8).toUpperCase()}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date:</Text>
                <Text style={styles.metaValue}>{formatDate(order.created_at)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bodyContainer}>
          {/* Bill To */}
          <View style={styles.billToSection}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.customerName}>{order.customer_name}</Text>
            {order.customer_phone && <Text style={styles.customerDetail}>{order.customer_phone}</Text>}
            {order.customer_email && <Text style={styles.customerDetail}>{order.customer_email}</Text>}
          </View>

          {/* Notes */}
          {(order.customer_notes || order.notes) && (
            <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#FEF2F2', borderRadius: 4 }}>
              <Text style={{ ...styles.sectionTitle, color: '#991B1B' }}>Notes</Text>
              {order.customer_notes && <Text style={{ fontSize: 10, color: '#7F1D1D', marginBottom: 2 }}>Customer Note: {order.customer_notes}</Text>}
              {order.notes && <Text style={{ fontSize: 10, color: '#7F1D1D' }}>Admin Note: {order.notes}</Text>}
            </View>
          )}

          {/* Items Table */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.colDesc]}>Description</Text>
              <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
              <Text style={[styles.headerText, styles.colPrice]}>Price</Text>
              <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
            </View>

            {order.order_items?.map((item: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={styles.rowItemName}>
                    {item.recipes?.name || item.fillings?.name || 'Custom Item'}
                  </Text>
                  <Text style={styles.rowItemDetails}>
                    {item.size_inches && `${item.size_inches}"`}
                    {item.layers && ` • ${item.layers} Layers`}
                    {item.custom_extras?.length > 0 && ` • +${item.custom_extras.length} extras`}
                  </Text>
                </View>
                <Text style={[styles.rowText, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.rowText, styles.colPrice]}>{formatCurrency(item.item_price)}</Text>
                <Text style={[styles.rowText, styles.colTotal]}>{formatCurrency(item.item_price * item.quantity)}</Text>
              </View>
            ))}
          </View>

          {/* Totals & Payment */}
          <View style={styles.totalSection}>
            <View style={styles.totalContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>{formatCurrency(order.total_price)}</Text>
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Total Due:</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(order.total_price)}</Text>
              </View>

              {order.account_details && (
                <View style={{ marginTop: 20 }}>
                     <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>Payment Details:</Text>
                     <Text style={{ fontSize: 10, color: '#334155' }}>
                        {order.account_details.replace(/\n/g, ' ')}
                     </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>bakesandmore.com.ng</Text>
          <Text style={styles.footerText}>•</Text>
          <Text style={styles.footerText}>Thank you for your business!</Text>
        </View>

      </Page>
    </Document>
  );
};

export default InvoicePDF;
