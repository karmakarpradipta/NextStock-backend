import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";
import { generateOrderNumber } from "../../utils/generateOrderNumber.js";

const computePaymentStatus = (totalAmount, paidAmount) => {
  if (paidAmount <= 0) return "PENDING";
  if (paidAmount >= totalAmount) return "PAID";
  return "PARTIAL";
};

const getLiveStock = async (productId, tx = prisma) => {
  const movements = await tx.stockMovement.findMany({
    where: { productId },
    select: { type: true, quantity: true },
  });
  return movements.reduce((total, m) => {
    if (m.type === "IN") return total + m.quantity;
    if (m.type === "OUT") return total - m.quantity;
    if (m.type === "ADJUSTMENT") return total + m.quantity;
    return total;
  }, 0);
};

export const getAllSales = async (query) => {
  const { page, limit, search, status, paymentStatus, from, to } = query;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(paymentStatus && { paymentStatus }),
    ...(search && {
      OR: [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
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

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        paymentStatus: true,
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        paidAmount: true,
        saleDate: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    sales,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getSaleById = async (id) => {
  const sale = await prisma.sale.findFirst({
    where: { id, deletedAt: null },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
        },
      },
    },
  });
  if (!sale) throw new ApiError(404, "Sale not found");
  return sale;
};

export const createSale = async (data) => {
  const productIds = data.items.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
  });
  if (products.length !== productIds.length) throw new ApiError(404, "One or more products not found");

  const invoiceNumber = await generateOrderNumber("INV", "sale");
  const totalAmount = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return await prisma.sale.create({
    data: {
      invoiceNumber,
      totalAmount,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      notes: data.notes,
      saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
      items: {
        create: data.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
        },
      },
    },
  });
};

export const updateSale = async (id, data) => {
  const sale = await prisma.sale.findFirst({ where: { id, deletedAt: null } });
  if (!sale) throw new ApiError(404, "Sale not found");
  if (sale.status !== "DRAFT") throw new ApiError(400, "Only DRAFT sales can be edited");

  const totalAmount = data.items
    ? data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
    : sale.totalAmount;

  return await prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.saleItem.deleteMany({ where: { saleId: id } });
      await tx.saleItem.createMany({
        data: data.items.map(i => ({
          saleId: id,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
        })),
      });
    }

    return await tx.sale.update({
      where: { id },
      data: {
        totalAmount,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        notes: data.notes,
        saleDate: data.saleDate ? new Date(data.saleDate) : undefined,
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
      },
    });
  });
};

export const confirmSale = async (id) => {
  const sale = await prisma.sale.findFirst({
    where: { id, deletedAt: null },
    include: { items: true },
  });
  if (!sale) throw new ApiError(404, "Sale not found");
  if (sale.status !== "DRAFT") throw new ApiError(400, "Only DRAFT sales can be confirmed");

  return await prisma.$transaction(async (tx) => {
    // check stock availability for all items first
    for (const item of sale.items) {
      const currentStock = await getLiveStock(item.productId, tx);
      if (currentStock < item.quantity) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });
        throw new ApiError(400, `Insufficient stock for ${product.name}. Available: ${currentStock}`);
      }
    }

    // deduct stock for each item
    await Promise.all(
      sale.items.map(item =>
        tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "OUT",
            quantity: item.quantity,
            note: `Sale ${sale.invoiceNumber} confirmed`,
          },
        })
      )
    );

    return await tx.sale.update({
      where: { id },
      data: { status: "CONFIRMED" },
    });
  });
};

export const cancelSale = async (id) => {
  const sale = await prisma.sale.findFirst({
    where: { id, deletedAt: null },
    include: { items: true },
  });
  if (!sale) throw new ApiError(404, "Sale not found");
  if (sale.status === "CANCELLED") throw new ApiError(400, "Sale already cancelled");

  return await prisma.$transaction(async (tx) => {
    // reverse stock only if confirmed
    if (sale.status === "CONFIRMED") {
      await Promise.all(
        sale.items.map(item =>
          tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "IN",
              quantity: item.quantity,
              note: `Sale ${sale.invoiceNumber} cancelled — stock reversed`,
            },
          })
        )
      );
    }

    return await tx.sale.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  });
};

export const updateSalePayment = async (id, paidAmount) => {
  const sale = await prisma.sale.findFirst({ where: { id, deletedAt: null } });
  if (!sale) throw new ApiError(404, "Sale not found");
  if (sale.status === "CANCELLED") throw new ApiError(400, "Cannot update payment on cancelled sale");
  if (paidAmount > sale.totalAmount) throw new ApiError(400, "Paid amount exceeds total amount");

  const paymentStatus = computePaymentStatus(sale.totalAmount, paidAmount);

  return await prisma.sale.update({
    where: { id },
    data: { paidAmount, paymentStatus },
    select: { id: true, invoiceNumber: true, totalAmount: true, paidAmount: true, paymentStatus: true },
  });
};