import prisma from "../../config/db.js";

const getLiveStock = (movements) => {
  return movements.reduce((total, m) => {
    if (m.type === "IN") return total + m.quantity;
    if (m.type === "OUT") return total - m.quantity;
    if (m.type === "ADJUSTMENT") return total + m.quantity;
    return total;
  }, 0);
};

// 1. Dashboard Summary
export const getDashboardSummary = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalProducts,
    totalVendors,
    totalCategories,
    todaySales,
    todayPurchases,
    lowStockProducts,
    pendingPaymentsSales,
    pendingPaymentsPurchases,
  ] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null, isActive: true } }),
    prisma.vendor.count({ where: { deletedAt: null, isActive: true } }),
    prisma.category.count({ where: { deletedAt: null, isActive: true } }),
    prisma.sale.aggregate({
      where: { status: "CONFIRMED", saleDate: { gte: today, lt: tomorrow } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.purchaseOrder.aggregate({
      where: { status: "CONFIRMED", purchaseDate: { gte: today, lt: tomorrow } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, minStockThreshold: true, stockMovements: { select: { type: true, quantity: true } } },
    }),
    prisma.sale.aggregate({
      where: { deletedAt: null, paymentStatus: { in: ["PENDING", "PARTIAL"] }, status: "CONFIRMED" },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    prisma.purchaseOrder.aggregate({
      where: { deletedAt: null, paymentStatus: { in: ["PENDING", "PARTIAL"] }, status: { in: ["CONFIRMED", "DELIVERED"] } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
  ]);

  const lowStockCount = lowStockProducts.filter(p => getLiveStock(p.stockMovements) <= p.minStockThreshold).length;

  return {
    totalProducts,
    totalVendors,
    totalCategories,
    lowStockCount,
    todaySales: {
      count: todaySales._count,
      total: todaySales._sum.totalAmount || 0,
    },
    todayPurchases: {
      count: todayPurchases._count,
      total: todayPurchases._sum.totalAmount || 0,
    },
    outstandingReceivables: (pendingPaymentsSales._sum.totalAmount || 0) - (pendingPaymentsSales._sum.paidAmount || 0),
    outstandingPayables: (pendingPaymentsPurchases._sum.totalAmount || 0) - (pendingPaymentsPurchases._sum.paidAmount || 0),
  };
};

// 2. Low Stock Report
export const getLowStockReport = async () => {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
      minStockThreshold: true,
      category: { select: { name: true } },
      stockMovements: { select: { type: true, quantity: true } },
    },
  });

  return products
    .map(p => ({ ...p, currentStock: getLiveStock(p.stockMovements), stockMovements: undefined }))
    .filter(p => p.currentStock <= p.minStockThreshold)
    .sort((a, b) => a.currentStock - b.currentStock);
};

// 3. Stock Summary Report
export const getStockSummary = async () => {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
      isActive: true,
      minStockThreshold: true,
      category: { select: { name: true } },
      stockMovements: { select: { type: true, quantity: true } },
    },
    orderBy: { name: "asc" },
  });

  return products.map(p => {
    const currentStock = getLiveStock(p.stockMovements);
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category.name,
      unit: p.unit,
      currentStock,
      minStockThreshold: p.minStockThreshold,
      isLowStock: currentStock <= p.minStockThreshold,
      isActive: p.isActive,
    };
  });
};

// 4. Daily Stock Report
export const getDailyStockReport = async (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const movements = await prisma.stockMovement.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: {
      type: true,
      quantity: true,
      note: true,
      createdAt: true,
      product: { select: { name: true, sku: true, unit: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const summary = {
    totalIn: movements.filter(m => m.type === "IN").reduce((s, m) => s + m.quantity, 0),
    totalOut: movements.filter(m => m.type === "OUT").reduce((s, m) => s + m.quantity, 0),
    totalAdjustments: movements.filter(m => m.type === "ADJUSTMENT").length,
  };

  return { date, summary, movements };
};

// 5. Monthly Stock Report
export const getMonthlyStockReport = async (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const movements = await prisma.stockMovement.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: {
      type: true,
      quantity: true,
      createdAt: true,
      product: { select: { name: true, sku: true, unit: true } },
    },
  });

  // group by product
  const grouped = {};
  movements.forEach(m => {
    const key = m.product.sku;
    if (!grouped[key]) {
      grouped[key] = { name: m.product.name, sku: m.product.sku, unit: m.product.unit, totalIn: 0, totalOut: 0, totalAdjustment: 0 };
    }
    if (m.type === "IN") grouped[key].totalIn += m.quantity;
    if (m.type === "OUT") grouped[key].totalOut += m.quantity;
    if (m.type === "ADJUSTMENT") grouped[key].totalAdjustment += m.quantity;
  });

  return { year, month, products: Object.values(grouped) };
};

// 6. Purchase Report
export const getPurchaseReport = async ({ from, to, vendorId }) => {
  const where = {
    deletedAt: null,
    status: { not: "CANCELLED" },
    ...(vendorId && { vendorId }),
    ...((from || to) && {
      purchaseDate: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    }),
  };

  const purchases = await prisma.purchaseOrder.findMany({
    where,
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      paidAmount: true,
      purchaseDate: true,
      vendor: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { purchaseDate: "desc" },
  });

  const totalAmount = purchases.reduce((s, p) => s + p.totalAmount, 0);
  const totalPaid = purchases.reduce((s, p) => s + p.paidAmount, 0);

  return { purchases, summary: { count: purchases.length, totalAmount, totalPaid, outstanding: totalAmount - totalPaid } };
};

// 7. Sales Report
export const getSalesReport = async ({ from, to, search }) => {
  const where = {
    deletedAt: null,
    status: { not: "CANCELLED" },
    ...(search && {
      OR: [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...((from || to) && {
      saleDate: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    }),
  };

  const sales = await prisma.sale.findMany({
    where,
    select: {
      invoiceNumber: true,
      status: true,
      paymentStatus: true,
      customerName: true,
      customerPhone: true,
      totalAmount: true,
      paidAmount: true,
      saleDate: true,
      _count: { select: { items: true } },
    },
    orderBy: { saleDate: "desc" },
  });

  const totalRevenue = sales.reduce((s, p) => s + p.totalAmount, 0);
  const totalCollected = sales.reduce((s, p) => s + p.paidAmount, 0);

  return { sales, summary: { count: sales.length, totalRevenue, totalCollected, outstanding: totalRevenue - totalCollected } };
};

// 8. Purchase vs Sales Comparison
export const getPurchaseVsSalesReport = async ({ from, to }) => {
  const where = (dateField) => ({
    deletedAt: null,
    status: { not: "CANCELLED" },
    ...((from || to) && {
      [dateField]: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    }),
  });

  const [purchases, sales] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: where("purchaseDate"),
      select: { totalAmount: true, purchaseDate: true },
    }),
    prisma.sale.findMany({
      where: where("saleDate"),
      select: { totalAmount: true, saleDate: true },
    }),
  ]);

  // group by month
  const grouped = {};
  purchases.forEach(p => {
    const key = `${p.purchaseDate.getFullYear()}-${String(p.purchaseDate.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped[key]) grouped[key] = { period: key, purchases: 0, sales: 0 };
    grouped[key].purchases += p.totalAmount;
  });
  sales.forEach(s => {
    const key = `${s.saleDate.getFullYear()}-${String(s.saleDate.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped[key]) grouped[key] = { period: key, purchases: 0, sales: 0 };
    grouped[key].sales += s.totalAmount;
  });

  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
};

// 9. Vendor-wise Purchase Report
export const getVendorPurchaseReport = async ({ from, to }) => {
  const vendors = await prisma.vendor.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      purchaseOrders: {
        where: {
          deletedAt: null,
          status: { not: "CANCELLED" },
          ...((from || to) && {
            purchaseDate: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }),
        },
        select: { totalAmount: true, paidAmount: true, status: true },
      },
    },
  });

  return vendors
    .map(v => ({
      vendorId: v.id,
      vendorName: v.name,
      orderCount: v.purchaseOrders.length,
      totalAmount: v.purchaseOrders.reduce((s, o) => s + o.totalAmount, 0),
      totalPaid: v.purchaseOrders.reduce((s, o) => s + o.paidAmount, 0),
      outstanding: v.purchaseOrders.reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0),
    }))
    .filter(v => v.orderCount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);
};

// 10. Profit Estimation Report
export const getProfitReport = async ({ from, to }) => {
  const dateFilter = (field) => (from || to) ? {
    [field]: {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    },
  } : {};

  const [purchases, sales] = await Promise.all([
    prisma.purchaseOrder.aggregate({
      where: { deletedAt: null, status: { not: "CANCELLED" }, ...dateFilter("purchaseDate") },
      _sum: { totalAmount: true },
    }),
    prisma.sale.aggregate({
      where: { deletedAt: null, status: { not: "CANCELLED" }, ...dateFilter("saleDate") },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalRevenue = sales._sum.totalAmount || 0;
  const totalCost = purchases._sum.totalAmount || 0;
  const estimatedProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? Math.round((estimatedProfit / totalRevenue) * 100) : 0;

  return { totalRevenue, totalCost, estimatedProfit, profitMargin };
};

// 11. Ledger Report
export const getLedgerReport = async () => {
  const vendors = await prisma.vendor.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      purchaseOrders: {
        where: { deletedAt: null, status: { not: "CANCELLED" } },
        select: { totalAmount: true, paidAmount: true, paymentStatus: true },
      },
    },
  });

  return vendors
    .map(v => ({
      vendorId: v.id,
      vendorName: v.name,
      email: v.email,
      phone: v.phone,
      totalOrdered: v.purchaseOrders.reduce((s, o) => s + o.totalAmount, 0),
      totalPaid: v.purchaseOrders.reduce((s, o) => s + o.paidAmount, 0),
      outstanding: v.purchaseOrders.reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0),
      orderCount: v.purchaseOrders.length,
    }))
    .filter(v => v.totalOrdered > 0)
    .sort((a, b) => b.outstanding - a.outstanding);
};

// 12. Top Selling Products
export const getTopSellingProducts = async ({ from, to, limit = 10 }) => {
  const items = await prisma.saleItem.findMany({
    where: {
      sale: {
        status: "CONFIRMED",
        deletedAt: null,
        ...((from || to) && {
          saleDate: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
    },
    select: {
      quantity: true,
      totalPrice: true,
      product: { select: { id: true, name: true, sku: true, unit: true } },
    },
  });

  const grouped = {};
  items.forEach(i => {
    const key = i.product.id;
    if (!grouped[key]) grouped[key] = { ...i.product, totalQuantity: 0, totalRevenue: 0 };
    grouped[key].totalQuantity += i.quantity;
    grouped[key].totalRevenue += i.totalPrice;
  });

  return Object.values(grouped)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
};