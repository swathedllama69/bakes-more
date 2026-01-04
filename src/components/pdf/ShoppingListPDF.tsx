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
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#B03050',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    color: '#B03050',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  date: {
    fontSize: 10,
    color: '#64748B',
  },
  table: {
    width: '100%',
    marginTop: 20,
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
    alignItems: 'center',
  },
  colCheck: { width: '10%' },
  colItem: { width: '50%' },
  colQty: { width: '20%', textAlign: 'center' },
  colCost: { width: '20%', textAlign: 'right' },

  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  rowText: {
    fontSize: 10,
    color: '#334155',
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#B03050',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B03050',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B03050',
  }
});

interface ShoppingListPDFProps {
  items: any[];
  totalCost: number;
}

const ShoppingListPDF: React.FC<ShoppingListPDFProps> = ({ items, totalCost }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Shopping List</Text>
          <Text style={styles.date}>Generated on {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colCheck]}>Check</Text>
            <Text style={[styles.headerText, styles.colItem]}>Item</Text>
            <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
            <Text style={[styles.headerText, styles.colCost]}>Est. Cost</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colCheck}>
                <View style={styles.checkbox} />
              </View>
              <Text style={[styles.rowText, styles.colItem]}>{item.name}</Text>
              <Text style={[styles.rowText, styles.colQty]}>
                {Math.ceil(item.requiredAmount)} {item.unit}
              </Text>
              <Text style={[styles.rowText, styles.colCost]}>
                ₦{(item.costToRestock || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Estimated Cost:</Text>
          <Text style={styles.totalValue}>₦{totalCost.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ShoppingListPDF;
