import * as reportsService from "./reports.service.js";
import { sendCSV } from "../../utils/csvExport.js";
import { createPDFReport } from "../../utils/pdfExport.js";

const dateRange = (q) => ({ from: q.from, to: q.to });

// helper to handle pdf export cleanly
const handlePDF = async (res, next, filename, title, headers, rows) => {
  try {
    await createPDFReport(res, filename, title, headers, rows);
  } catch (err) {
    next(err);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const data = await reportsService.getDashboardSummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getLowStockReport = async (req, res, next) => {
  try {
    const data = await reportsService.getLowStockReport();
    if (req.query.export === "csv") {
      return sendCSV(
        res,
        "low-stock-report",
        data.map((p) => ({
          SKU: p.sku,
          Name: p.name,
          Category: p.category.name,
          Unit: p.unit,
          "Current Stock": p.currentStock,
          "Min Threshold": p.minStockThreshold,
        })),
      );
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        "low-stock-report",
        "Low Stock Report",
        ["SKU", "Name", "Category", "Unit", "Current Stock", "Min Threshold"],
        data.map((p) => [
          p.sku,
          p.name,
          p.category.name,
          p.unit,
          p.currentStock,
          p.minStockThreshold,
        ]),
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getStockSummary = async (req, res, next) => {
  try {
    const data = await reportsService.getStockSummary();
    if (req.query.export === "csv") {
      return sendCSV(
        res,
        "stock-summary",
        data.map((p) => ({
          SKU: p.sku,
          Name: p.name,
          Category: p.category,
          Unit: p.unit,
          "Current Stock": p.currentStock,
          "Min Threshold": p.minStockThreshold,
          "Low Stock": p.isLowStock ? "Yes" : "No",
        })),
      );
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        "stock-summary",
        "Stock Summary Report",
        ["SKU", "Name", "Category", "Unit", "Stock", "Min", "Low?"],
        data.map((p) => [
          p.sku,
          p.name,
          p.category,
          p.unit,
          p.currentStock,
          p.minStockThreshold,
          p.isLowStock ? "Yes" : "No",
        ]),
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getDailyStockReport = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const data = await reportsService.getDailyStockReport(date);
    if (req.query.export === "csv") {
      return sendCSV(
        res,
        `daily-stock-${date}`,
        data.movements.map((m) => ({
          Product: m.product.name,
          SKU: m.product.sku,
          Type: m.type,
          Quantity: m.quantity,
          Note: m.note || "",
          Date: m.createdAt,
        })),
      );
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        `daily-stock-${date}`,
        `Daily Stock Report — ${date}`,
        ["Product", "SKU", "Type", "Quantity", "Note", "Date"],
        data.movements.map((m) => [
          m.product.name,
          m.product.sku,
          m.type,
          m.quantity,
          m.note || "",
          new Date(m.createdAt).toLocaleString(),
        ]),
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getMonthlyStockReport = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const data = await reportsService.getMonthlyStockReport(year, month);
    if (req.query.export === "csv") {
      return sendCSV(
        res,
        `monthly-stock-${year}-${month}`,
        data.products.map((p) => ({
          SKU: p.sku,
          Name: p.name,
          Unit: p.unit,
          "Total IN": p.totalIn,
          "Total OUT": p.totalOut,
          "Total Adjustment": p.totalAdjustment,
        })),
      );
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        `monthly-stock-${year}-${month}`,
        `Monthly Stock Report — ${year}/${month}`,
        ["SKU", "Name", "Unit", "Total IN", "Total OUT", "Adjustment"],
        data.products.map((p) => [
          p.sku,
          p.name,
          p.unit,
          p.totalIn,
          p.totalOut,
          p.totalAdjustment,
        ]),
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getPurchaseReport = async (req, res, next) => {
  try {
    const data = await reportsService.getPurchaseReport({
      ...dateRange(req.query),
      vendorId: req.query.vendorId,
    });
    if (req.query.export === "csv") {
      return sendCSV(
        res,
        "purchase-report",
        data.purchases.map((p) => ({
          "Order No": p.orderNumber,
          Vendor: p.vendor.name,
          Status: p.status,
          "Payment Status": p.paymentStatus,
          Total: p.totalAmount,
          Paid: p.paidAmount,
          Outstanding: p.totalAmount - p.paidAmount,
          Date: p.purchaseDate,
        })),
      );
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        "purchase-report",
        "Purchase Report",
        [
          "Order No",
          "Vendor",
          "Status",
          "Payment",
          "Total",
          "Paid",
          "Outstanding",
          "Date",
        ],
        data.purchases.map((p) => [
          p.orderNumber,
          p.vendor.name,
          p.status,
          p.paymentStatus,
          p.totalAmount,
          p.paidAmount,
          p.totalAmount - p.paidAmount,
          new Date(p.purchaseDate).toLocaleDateString(),
        ]),
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getSalesReport = async (req, res, next) => {
  try {
    const data = await reportsService.getSalesReport({
      ...dateRange(req.query),
      search: req.query.search,
    });
    if (req.query.export === "csv") {
      return sendCSV(
        res,
        "sales-report",
        data.sales.map((s) => ({
          "Invoice No": s.invoiceNumber,
          Customer: s.customerName || "Walk-in",
          Phone: s.customerPhone || "",
          Status: s.status,
          "Payment Status": s.paymentStatus,
          Total: s.totalAmount,
          Paid: s.paidAmount,
          Outstanding: s.totalAmount - s.paidAmount,
          Date: s.saleDate,
        })),
      );
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        "sales-report",
        "Sales Report",
        [
          "Invoice No",
          "Customer",
          "Status",
          "Payment",
          "Total",
          "Paid",
          "Date",
        ],
        data.sales.map((s) => [
          s.invoiceNumber,
          s.customerName || "Walk-in",
          s.status,
          s.paymentStatus,
          s.totalAmount,
          s.paidAmount,
          new Date(s.saleDate).toLocaleDateString(),
        ]),
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getPurchaseVsSalesReport = async (req, res, next) => {
  try {
    const data = await reportsService.getPurchaseVsSalesReport(
      dateRange(req.query),
    );
    if (req.query.export === "csv") {
      return sendCSV(
        res,
        "purchase-vs-sales",
        data.map((d) => ({
          Period: d.period,
          Purchases: d.purchases,
          Sales: d.sales,
          Profit: d.sales - d.purchases,
        })),
      );
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        "purchase-vs-sales",
        "Purchase vs Sales Report",
        ["Period", "Purchases", "Sales", "Profit"],
        data.map((d) => [
          d.period,
          d.purchases,
          d.sales,
          d.sales - d.purchases,
        ]),
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getVendorPurchaseReport = async (req, res, next) => {
  try {
    const data = await reportsService.getVendorPurchaseReport(
      dateRange(req.query),
    );
    if (req.query.export === "csv") {
      return sendCSV(
        res,
        "vendor-purchase-report",
        data.map((v) => ({
          Vendor: v.vendorName,
          "Order Count": v.orderCount,
          "Total Amount": v.totalAmount,
          "Total Paid": v.totalPaid,
          Outstanding: v.outstanding,
        })),
      );
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        "vendor-purchase-report",
        "Vendor-wise Purchase Report",
        ["Vendor", "Orders", "Total", "Paid", "Outstanding"],
        data.map((v) => [
          v.vendorName,
          v.orderCount,
          v.totalAmount,
          v.totalPaid,
          v.outstanding,
        ]),
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getProfitReport = async (req, res, next) => {
  try {
    const data = await reportsService.getProfitReport(dateRange(req.query));
    if (req.query.export === "csv") {
      return sendCSV(res, "profit-report", [
        {
          "Total Revenue": data.totalRevenue,
          "Total Cost": data.totalCost,
          "Estimated Profit": data.estimatedProfit,
          "Profit Margin %": data.profitMargin,
        },
      ]);
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        "profit-report",
        "Profit Estimation Report",
        ["Total Revenue", "Total Cost", "Estimated Profit", "Profit Margin %"],
        [
          [
            data.totalRevenue,
            data.totalCost,
            data.estimatedProfit,
            `${data.profitMargin}%`,
          ],
        ],
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getLedgerReport = async (req, res, next) => {
  try {
    const data = await reportsService.getLedgerReport();
    if (req.query.export === "csv") {
      return sendCSV(
        res,
        "ledger-report",
        data.map((v) => ({
          Vendor: v.vendorName,
          Email: v.email || "",
          Phone: v.phone || "",
          "Total Ordered": v.totalOrdered,
          "Total Paid": v.totalPaid,
          Outstanding: v.outstanding,
        })),
      );
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        "ledger-report",
        "Vendor Ledger Report",
        ["Vendor", "Email", "Orders", "Total", "Paid", "Outstanding"],
        data.map((v) => [
          v.vendorName,
          v.email || "",
          v.orderCount,
          v.totalOrdered,
          v.totalPaid,
          v.outstanding,
        ]),
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTopSellingProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await reportsService.getTopSellingProducts({
      ...dateRange(req.query),
      limit,
    });
    if (req.query.export === "csv") {
      return sendCSV(
        res,
        "top-selling-products",
        data.map((p) => ({
          SKU: p.sku,
          Name: p.name,
          Unit: p.unit,
          "Total Qty Sold": p.totalQuantity,
          "Total Revenue": p.totalRevenue,
        })),
      );
    }
    if (req.query.export === "pdf") {
      return await handlePDF(
        res,
        next,
        "top-selling-products",
        "Top Selling Products",
        ["SKU", "Name", "Unit", "Qty Sold", "Revenue"],
        data.map((p) => [
          p.sku,
          p.name,
          p.unit,
          p.totalQuantity,
          p.totalRevenue,
        ]),
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
