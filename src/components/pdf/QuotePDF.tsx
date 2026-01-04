import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
  docTitle: {
    fontSize: 32,
    color: '#1E293B',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  docMeta: {
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
  colDesc: { width: '60%' },
  colQty: { width: '15%', textAlign: 'center' },
  colTotal: { width: '25%', textAlign: 'right' },

  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  rowText: {
    fontSize: 10,
    color: '#334155',
  },
  totals: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 10,
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
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 10,
    color: '#334155',
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

interface QuotePDFProps {
  customerName: string;
  date: string;
  items: any[]; // Simplified items for quote
  totalPrice: number;
  notes?: string;
  type?: 'QUOTE' | 'ESTIMATE';
}

const QuotePDF: React.FC<QuotePDFProps> = ({ customerName, date, items, totalPrice, notes, type = 'QUOTE' }) => {
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
          </View>
          <View>
            <Text style={styles.docTitle}>{type}</Text>
            <View style={styles.docMeta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date:</Text>
                <Text style={styles.metaValue}>{formatDate(date)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Valid Until:</Text>
                <Text style={styles.metaValue}>{formatDate(new Date(new Date(date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.sectionTitle}>Prepared For:</Text>
          <Text style={styles.customerName}>{customerName || 'Valued Customer'}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDesc]}>Description</Text>
            <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
            <Text style={[styles.headerText, styles.colTotal]}>Amount</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.rowText}>{item.name}</Text>
                {item.description && <Text style={{ fontSize: 8, color: '#94A3B8', marginTop: 2 }}>{item.description}</Text>}
              </View>
              <Text style={[styles.rowText, styles.colQty]}>{item.qty || 1}</Text>
              <Text style={[styles.rowText, styles.colTotal]}>{formatCurrency(item.price || 0)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(totalPrice)}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>This is a {type.toLowerCase()}, not an invoice.</Text>
          <Text style={styles.footerText}>Prices are subject to change after 7 days.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default QuotePDF;
