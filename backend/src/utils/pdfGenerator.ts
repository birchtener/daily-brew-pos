import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToStream,
  Font,
} from '@react-pdf/renderer';
import { Response } from 'express';

// Register Roboto font from a reliable CDN to support Unicode characters like the Philippine Peso sign (₱)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/fonts/Roboto/Roboto-Medium.ttf', fontWeight: 'bold' }
  ]
});

// Define layout styling utilizing React-PDF flex properties
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#2D3748',
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#1A202C',
    paddingBottom: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1A202C',
  },
  headerMeta: {
    fontSize: 9,
    color: '#718096',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#718096',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1A202C',
  },
  table: {
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 6,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
    padding: 6,
  },
  col1: { flex: 2, textAlign: 'left' },
  col2: { flex: 1, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderTopWidth: 1,
    borderTopColor: '#BDC3C7',
    padding: 6,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
  },
  poHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 15,
    marginBottom: 20,
  },
  companyDetails: {
    flexDirection: 'column',
    gap: 2,
  },
  supplierDetails: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1A202C',
  },
  supplierName: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  poMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
  colItem: { flex: 3, textAlign: 'left' },
  colUnit: { flex: 1, textAlign: 'center' },
  colQty: { flex: 1.2, textAlign: 'right' },
  colCost: { flex: 1.5, textAlign: 'right' },
  colSub: { flex: 1.8, textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#A0AEC0',
    fontSize: 8,
  },
});

export type ZReportData = {
  date: string;
  grossSales: number;
  discounts: number;
  netCollected: number;
  payments: {
    method: string;
    amount: number;
  }[];
};

export const ZReportPdfDocument = (props: { data: ZReportData }) => {
  const { data } = props;
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header block
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.headerTitle }, 'Daily Z-Report'),
          React.createElement(
            Text,
            { style: { fontSize: 8, color: '#718096', marginTop: 2 } },
            'Daily POS Operations Summary'
          )
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.headerMeta }, `Date: ${data.date}`),
          React.createElement(
            Text,
            { style: styles.headerMeta },
            `Export Time: ${new Date().toLocaleTimeString()}`
          )
        )
      ),

      // Summary Cards
      React.createElement(Text, { style: styles.sectionTitle }, 'Daily Financial Metrics'),
      React.createElement(
        View,
        { style: styles.summaryGrid },
        React.createElement(
          View,
          { style: styles.summaryCard },
          React.createElement(Text, { style: styles.summaryLabel }, 'Gross Sales'),
          React.createElement(Text, { style: styles.summaryValue }, `₱${data.grossSales.toFixed(2)}`)
        ),
        React.createElement(
          View,
          { style: styles.summaryCard },
          React.createElement(Text, { style: styles.summaryLabel }, 'Discounts Applied'),
          React.createElement(Text, { style: styles.summaryValue }, `₱${data.discounts.toFixed(2)}`)
        ),
        React.createElement(
          View,
          { style: styles.summaryCard },
          React.createElement(Text, { style: styles.summaryLabel }, 'Net Collected'),
          React.createElement(
            Text,
            { style: [styles.summaryValue, { color: '#2B6CB0' }] },
            `₱${data.netCollected.toFixed(2)}`
          )
        )
      ),

      // Table Breakdown
      React.createElement(Text, { style: styles.sectionTitle }, 'Settlement breakdown by Payment Method'),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: styles.col1 }, 'Payment Method'),
          React.createElement(Text, { style: styles.col2 }, 'Amount')
        ),
        data.payments.map((p, idx) =>
          React.createElement(
            View,
            {
              key: p.method,
              style: [styles.tableRow, idx % 2 === 1 ? { backgroundColor: '#F8FAFC' } : {}],
            },
            React.createElement(Text, { style: styles.col1 }, p.method.toUpperCase()),
            React.createElement(Text, { style: styles.col2 }, `₱${p.amount.toFixed(2)}`)
          )
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.col1 }, 'Total Collections'),
          React.createElement(
            Text,
            { style: styles.col2 },
            `₱${data.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}`
          )
        )
      ),

      // Standard footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(Text, null, 'Daily Brew POS Operational Report'),
        React.createElement(Text, {
          render: ({ pageNumber, totalPages }: any) => `Page ${pageNumber} of ${totalPages}`,
        })
      )
    )
  );
};

export type PurchaseOrderData = {
  poId: string;
  orderDate: string;
  orderedBy: string;
  supplier: {
    name: string;
    contactName: string;
    contactNumber: string;
  };
  items: {
    ingredientName: string;
    unit: string;
    quantityReceived: number;
    unitCost: number;
    subtotal: number;
  }[];
  grandTotal: number;
};

export const PurchaseOrderPdfDocument = (props: { data: PurchaseOrderData }) => {
  const { data } = props;
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // PO Header info
      React.createElement(
        View,
        { style: styles.poHeader },
        React.createElement(
          View,
          { style: styles.companyDetails },
          React.createElement(Text, { style: styles.companyName }, 'Daily Brew POS & Inventory'),
          React.createElement(Text, { style: { color: '#718096' } }, '123 Coffee Avenue, Roast District'),
          React.createElement(Text, { style: { color: '#718096' } }, 'Tel: (555) 123-4567'),
          React.createElement(Text, { style: { color: '#718096' } }, 'Email: orders@dailybrew.co')
        ),
        React.createElement(
          View,
          { style: styles.supplierDetails },
          React.createElement(
            Text,
            { style: { fontSize: 8, color: '#718096', textTransform: 'uppercase' } },
            'Supplier / Vendor'
          ),
          React.createElement(Text, { style: styles.supplierName }, data.supplier.name),
          React.createElement(Text, { style: { color: '#4A5568' } }, `Attn: ${data.supplier.contactName}`),
          React.createElement(Text, { style: { color: '#718096' } }, `Tel: ${data.supplier.contactNumber}`)
        )
      ),

      // PO Meta details
      React.createElement(
        View,
        { style: styles.poMeta },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: { color: '#718096', fontSize: 8, textTransform: 'uppercase' } },
            'Purchase Order ID'
          ),
          React.createElement(
            Text,
            { style: { fontSize: 11, fontFamily: 'Roboto', fontWeight: 'bold', marginTop: 2 } },
            `#${data.poId.substring(0, 8).toUpperCase()}`
          )
        ),
        React.createElement(
          View,
          { style: { alignItems: 'flex-end' } },
          React.createElement(
            Text,
            { style: { color: '#718096', fontSize: 8, textTransform: 'uppercase' } },
            'Order Details'
          ),
          React.createElement(Text, { style: { fontSize: 10, marginTop: 2 } }, `Date: ${data.orderDate}`),
          React.createElement(
            Text,
            { style: { fontSize: 9, color: '#718096', marginTop: 1 } },
            `Created by: ${data.orderedBy}`
          )
        )
      ),

      // Structured Items Table
      React.createElement(Text, { style: styles.sectionTitle }, 'Itemized Received Ingredients'),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: styles.colItem }, 'Ingredient Name'),
          React.createElement(Text, { style: styles.colUnit }, 'Unit'),
          React.createElement(Text, { style: styles.colQty }, 'Quantity'),
          React.createElement(Text, { style: styles.colCost }, 'Unit Cost'),
          React.createElement(Text, { style: styles.colSub }, 'Subtotal')
        ),
        data.items.map((item, idx) =>
          React.createElement(
            View,
            {
              key: item.ingredientName,
              style: [styles.tableRow, idx % 2 === 1 ? { backgroundColor: '#F8FAFC' } : {}],
            },
            React.createElement(Text, { style: styles.colItem }, item.ingredientName),
            React.createElement(Text, { style: styles.colUnit }, item.unit),
            React.createElement(Text, { style: styles.colQty }, item.quantityReceived.toFixed(3)),
            React.createElement(Text, { style: styles.colCost }, `₱${item.unitCost.toFixed(2)}`),
            React.createElement(Text, { style: styles.colSub }, `₱${item.subtotal.toFixed(2)}`)
          )
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: { flex: 6.7, textAlign: 'left' } }, 'Grand Total Balance'),
          React.createElement(Text, { style: styles.colSub }, `₱${data.grandTotal.toFixed(2)}`)
        )
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(Text, null, 'Daily Brew Vendor Purchase Order Log'),
        React.createElement(Text, {
          render: ({ pageNumber, totalPages }: any) => `Page ${pageNumber} of ${totalPages}`,
        })
      )
    )
  );
};

/**
 * Utility helper that converts a React-PDF document element into a Buffer
 * and streams it directly with inline inline layout headers.
 * Implements robust lifecycle events, memory-safe stream destruction,
 * and client-disconnect cleanup.
 */
export async function streamPdfResponse(doc: React.ReactElement, res: Response): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const stream = await renderToStream(doc as any);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=document.pdf');

      stream.on('error', (err) => {
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: err.message || 'PDF Streaming failed.' });
        }
        reject(err);
      });

      stream.on('end', () => {
        resolve();
      });

      stream.pipe(res);

      // Clean up native stream handles if client prematurely disconnects or request finishes
      res.on('close', () => {
        if (stream && typeof (stream as any).destroy === 'function') {
          (stream as any).destroy();
        }
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}
