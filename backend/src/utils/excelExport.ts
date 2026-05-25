import { Response } from 'express';
import ExcelJS from 'exceljs';
import { prisma } from '../config/db';

/**
 * Generates a Stock Valuation Report spreadsheet and streams it to the response.
 */
export async function generateStockValuationReport(res: Response): Promise<void> {
  const ingredients = await prisma.ingredients.findMany({
    orderBy: { name: 'asc' },
    include: {
      batches: {
        where: { quantity_remaining: { gt: 0 } },
      },
    },
  });

  const data = ingredients.map((ing) => {
    const currentStock = ing.batches.reduce((sum, batch) => {
      return sum + Number(batch.quantity_remaining);
    }, 0);

    const estimatedValuation = ing.batches.reduce((sum, batch) => {
      return sum + Number(batch.quantity_remaining) * Number(batch.cost_per_unit);
    }, 0);

    return {
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      low_stock_threshold: Number(ing.low_stock_threshold),
      current_stock: currentStock,
      estimated_valuation: estimatedValuation,
    };
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Stock Valuation');

  worksheet.columns = [
    { header: 'Ingredient ID', key: 'id', width: 40 },
    { header: 'Ingredient Name', key: 'name', width: 25 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Low Stock Threshold', key: 'low_stock_threshold', width: 22 },
    { header: 'Current Stock', key: 'current_stock', width: 18 },
    { header: 'Estimated Valuation', key: 'estimated_valuation', width: 22 },
  ];

  // Header Row Formatting
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' }, // Dark Slate
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFBDC3C7' } },
      left: { style: 'thin', color: { argb: 'FFBDC3C7' } },
      bottom: { style: 'medium', color: { argb: 'FF2C3E50' } },
      right: { style: 'thin', color: { argb: 'FFBDC3C7' } },
    };
  });

  // Data Rows
  data.forEach((row, idx) => {
    const newRow = worksheet.addRow(row);
    newRow.height = 20;

    newRow.getCell('id').alignment = { horizontal: 'left', vertical: 'middle' };
    newRow.getCell('name').alignment = { horizontal: 'left', vertical: 'middle' };
    newRow.getCell('unit').alignment = { horizontal: 'center', vertical: 'middle' };

    const threshCell = newRow.getCell('low_stock_threshold');
    threshCell.alignment = { horizontal: 'right', vertical: 'middle' };
    threshCell.numFmt = '#,##0.000';

    const stockCell = newRow.getCell('current_stock');
    stockCell.alignment = { horizontal: 'right', vertical: 'middle' };
    stockCell.numFmt = '#,##0.000';

    const valCell = newRow.getCell('estimated_valuation');
    valCell.alignment = { horizontal: 'right', vertical: 'middle' };
    valCell.numFmt = '$#,##0.00';

    // Zebra striping
    const bgArgb = idx % 2 === 1 ? 'FFF5F7FA' : 'FFFFFFFF';
    newRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // Summary Row
  const totalRowIdx = data.length + 2;
  const totalRow = worksheet.addRow({
    id: 'Total Valuation Summary',
    name: '',
    unit: '',
    low_stock_threshold: '',
    current_stock: { formula: `SUM(E2:E${totalRowIdx - 1})` },
    estimated_valuation: { formula: `SUM(F2:F${totalRowIdx - 1})` },
  });
  totalRow.height = 24;

  totalRow.getCell('id').alignment = { horizontal: 'left', vertical: 'middle' };
  
  const totStockCell = totalRow.getCell('current_stock');
  totStockCell.numFmt = '#,##0.000';
  totStockCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const totValCell = totalRow.getCell('estimated_valuation');
  totValCell.numFmt = '$#,##0.00';
  totValCell.alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF2C3E50' } },
      bottom: { style: 'double', color: { argb: 'FF2C3E50' } },
    };
  });

  // Adjust Column Widths to fit data perfectly
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const val = cell.value;
      if (val !== null && val !== undefined) {
        let str = '';
        if (typeof val === 'object' && 'formula' in val) {
          str = '0.000'; // Formula placeholder
        } else {
          str = String(val);
        }
        if (str.length > maxLength) {
          maxLength = str.length;
        }
      }
    });
    column.width = Math.max(column.width || 10, maxLength + 4);
  });

  // Stream directly to HTTP response
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=Stock_Valuation_Report.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Generates a Product Profitability Report spreadsheet and streams it to the response.
 */
export async function generateProductProfitabilityReport(
  startDate: Date,
  endDate: Date,
  res: Response
): Promise<void> {
  const orders = await prisma.orders.findMany({
    where: {
      order_status: 'completed',
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
          stock_deductions: true,
        },
      },
    },
  });

  type ProductRecord = {
    productName: string;
    categoryName: string;
    quantitySold: number;
    totalRevenue: number;
    totalCOGS: number;
    netProfit: number;
    profitMargin: number;
  };

  const productMap = new Map<string, ProductRecord>();

  for (const order of orders) {
    for (const item of order.items) {
      const productId = item.product_id;
      const productName = item.product.name;
      const categoryName = item.product.category.name;
      const qty = item.quantity;
      const revenue = Number(item.sub_total);

      let itemCOGS = 0;
      if (item.stock_deductions) {
        for (const deduction of item.stock_deductions) {
          itemCOGS += Number(deduction.quantity_deducted) * Number(deduction.cost_at_sale);
        }
      }

      const existing = productMap.get(productId);
      if (existing) {
        existing.quantitySold += qty;
        existing.totalRevenue += revenue;
        existing.totalCOGS += itemCOGS;
      } else {
        productMap.set(productId, {
          productName,
          categoryName,
          quantitySold: qty,
          totalRevenue: revenue,
          totalCOGS: itemCOGS,
          netProfit: 0,
          profitMargin: 0,
        });
      }
    }
  }

  const data: ProductRecord[] = Array.from(productMap.values()).map((p) => {
    const netProfit = p.totalRevenue - p.totalCOGS;
    const profitMargin = p.totalRevenue > 0 ? netProfit / p.totalRevenue : 0;
    return {
      ...p,
      netProfit,
      profitMargin,
    };
  });

  // Sort by revenue descending for premium report ordering
  data.sort((a, b) => b.totalRevenue - a.totalRevenue);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Product Profitability');

  worksheet.columns = [
    { header: 'Product Name', key: 'productName', width: 25 },
    { header: 'Category', key: 'categoryName', width: 18 },
    { header: 'Quantity Sold', key: 'quantitySold', width: 15 },
    { header: 'Total Retail Revenue', key: 'totalRevenue', width: 22 },
    { header: 'Total COGS', key: 'totalCOGS', width: 20 },
    { header: 'Net Profit', key: 'netProfit', width: 20 },
    { header: 'Profit Margin', key: 'profitMargin', width: 16 },
  ];

  // Header Row Formatting
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' }, // Dark Slate
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFBDC3C7' } },
      left: { style: 'thin', color: { argb: 'FFBDC3C7' } },
      bottom: { style: 'medium', color: { argb: 'FF2C3E50' } },
      right: { style: 'thin', color: { argb: 'FFBDC3C7' } },
    };
  });

  // Data Rows
  data.forEach((row, idx) => {
    const newRow = worksheet.addRow(row);
    newRow.height = 20;

    newRow.getCell('productName').alignment = { horizontal: 'left', vertical: 'middle' };
    newRow.getCell('categoryName').alignment = { horizontal: 'left', vertical: 'middle' };

    const qtyCell = newRow.getCell('quantitySold');
    qtyCell.alignment = { horizontal: 'right', vertical: 'middle' };
    qtyCell.numFmt = '#,##0';

    const revCell = newRow.getCell('totalRevenue');
    revCell.alignment = { horizontal: 'right', vertical: 'middle' };
    revCell.numFmt = '$#,##0.00';

    const cogsCell = newRow.getCell('totalCOGS');
    cogsCell.alignment = { horizontal: 'right', vertical: 'middle' };
    cogsCell.numFmt = '$#,##0.00';

    const profitCell = newRow.getCell('netProfit');
    profitCell.alignment = { horizontal: 'right', vertical: 'middle' };
    profitCell.numFmt = '$#,##0.00';

    const marginCell = newRow.getCell('profitMargin');
    marginCell.alignment = { horizontal: 'right', vertical: 'middle' };
    marginCell.numFmt = '0.0%';

    // Zebra striping
    const bgArgb = idx % 2 === 1 ? 'FFF5F7FA' : 'FFFFFFFF';
    newRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // Summary Row
  const totalRowIdx = data.length + 2;
  const totalRow = worksheet.addRow({
    productName: 'Total Performance Summary',
    categoryName: '',
    quantitySold: { formula: `SUM(C2:C${totalRowIdx - 1})` },
    totalRevenue: { formula: `SUM(D2:D${totalRowIdx - 1})` },
    totalCOGS: { formula: `SUM(E2:E${totalRowIdx - 1})` },
    netProfit: { formula: `SUM(F2:F${totalRowIdx - 1})` },
    profitMargin: { formula: `=(D${totalRowIdx}-E${totalRowIdx})/D${totalRowIdx}` },
  });
  totalRow.height = 24;

  totalRow.getCell('productName').alignment = { horizontal: 'left', vertical: 'middle' };

  const totQtyCell = totalRow.getCell('quantitySold');
  totQtyCell.numFmt = '#,##0';
  totQtyCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const totRevCell = totalRow.getCell('totalRevenue');
  totRevCell.numFmt = '$#,##0.00';
  totRevCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const totCogsCell = totalRow.getCell('totalCOGS');
  totCogsCell.numFmt = '$#,##0.00';
  totCogsCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const totProfitCell = totalRow.getCell('netProfit');
  totProfitCell.numFmt = '$#,##0.00';
  totProfitCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const totMarginCell = totalRow.getCell('profitMargin');
  totMarginCell.numFmt = '0.0%';
  totMarginCell.alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF2C3E50' } },
      bottom: { style: 'double', color: { argb: 'FF2C3E50' } },
    };
  });

  // Adjust Column Widths to fit data perfectly
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const val = cell.value;
      if (val !== null && val !== undefined) {
        let str = '';
        if (typeof val === 'object' && 'formula' in val) {
          str = '0.000'; // Formula placeholder
        } else {
          str = String(val);
        }
        if (str.length > maxLength) {
          maxLength = str.length;
        }
      }
    });
    column.width = Math.max(column.width || 10, maxLength + 4);
  });

  // Stream directly to HTTP response
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=Product_Profitability_Report.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
}
