import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";
import { generateOrderNumber } from "../../utils/generateOrderNumber.js";

const computePaymentStatus = (totalAmount, paidAmount) => {
  if (paidAmount <= 0) return "PENDING";
  if (paidAmount >= totalAmount) return "PAID";
  return "PARTIAL";
};

export const getAllPurchases = async (query) => {
  const { page, limit, search, vendorId, status, paymentStatus, from, to } = query;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(vendorId && { vendorId }),
    ...(status && { status }),
    ...(paymentStatus && { paymentStatus }),
    ...(search && {
      OR: [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
    ...(from || to) && {
      purchaseDate: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    },
  };

  const [purchases, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        paidAmount: true,
        purchaseDate: true,
        createdAt: true,
        vendor: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return {
    purchases,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getPurchaseById = async (id) => {
  const purchase = await prisma.purchaseOrder.findFirst({
    where: { id, deletedAt: null },
    include: {
      vendor: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
        },
      },
    },
  });

  if (!purchase) throw new ApiError(404, "Purchase order not found");
  return purchase;
};

export const createPurchase = async (data) => {
  const vendor = await prisma.vendor.findFirst({ where: { id: data.vendorId, deletedAt: null } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  // verify all products exist
  const productIds = data.items.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
  });
  if (products.length !== productIds.length) throw new ApiError(404, "One or more products not found");

  const orderNumber = await generateOrderNumber("PO", "purchaseOrder");
  const totalAmount = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const purchase = await prisma.purchaseOrder.create({
    data: {
      orderNumber,
      vendorId: data.vendorId,
      totalAmount,
      notes: data.notes,
      invoiceUrl: data.invoiceUrl,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
      expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
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
      vendor: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
        },
      },
    },
  });

  return purchase;
};

export const updatePurchase = async (id, data) => {
  const purchase = await prisma.purchaseOrder.findFirst({ where: { id, deletedAt: null } });
  if (!purchase) throw new ApiError(404, "Purchase order not found");
  if (purchase.status !== "DRAFT") throw new ApiError(400, "Only DRAFT orders can be edited");

  const totalAmount = data.items
    ? data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
    : purchase.totalAmount;

  return await prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      await tx.purchaseOrderItem.createMany({
        data: data.items.map(i => ({
          purchaseOrderId: id,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
        })),
      });
    }

    return await tx.purchaseOrder.update({
      where: { id },
      data: {
        totalAmount,
        notes: data.notes,
        invoiceUrl: data.invoiceUrl,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : undefined,
      },
      include: {
        vendor: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
      },
    });
  });
};

export const confirmPurchase = async (id) => {
  const purchase = await prisma.purchaseOrder.findFirst({
    where: { id, deletedAt: null },
    include: { items: true },
  });
  if (!purchase) throw new ApiError(404, "Purchase order not found");
  if (purchase.status !== "DRAFT") throw new ApiError(400, "Only DRAFT orders can be confirmed");

  return await prisma.$transaction(async (tx) => {
    // increment stock for each item
    await Promise.all(
      purchase.items.map(item =>
        tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "IN",
            quantity: item.quantity,
            note: `Purchase Order ${purchase.orderNumber} confirmed`,
          },
        })
      )
    );

    return await tx.purchaseOrder.update({
      where: { id },
      data: { status: "CONFIRMED", deliveredAt: new Date() },
    });
  });
};

export const cancelPurchase = async (id) => {
  const purchase = await prisma.purchaseOrder.findFirst({
    where: { id, deletedAt: null },
    include: { items: true },
  });
  if (!purchase) throw new ApiError(404, "Purchase order not found");
  if (purchase.status === "CANCELLED") throw new ApiError(400, "Order already cancelled");

  return await prisma.$transaction(async (tx) => {
    // reverse stock only if it was confirmed
    if (purchase.status === "CONFIRMED" || purchase.status === "DELIVERED") {
      await Promise.all(
        purchase.items.map(item =>
          tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "OUT",
              quantity: item.quantity,
              note: `Purchase Order ${purchase.orderNumber} cancelled — stock reversed`,
            },
          })
        )
      );
    }

    return await tx.purchaseOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  });
};

export const updatePayment = async (id, paidAmount) => {
  const purchase = await prisma.purchaseOrder.findFirst({ where: { id, deletedAt: null } });
  if (!purchase) throw new ApiError(404, "Purchase order not found");
  if (purchase.status === "CANCELLED") throw new ApiError(400, "Cannot update payment on cancelled order");
  if (paidAmount > purchase.totalAmount) throw new ApiError(400, "Paid amount exceeds total amount");

  const paymentStatus = computePaymentStatus(purchase.totalAmount, paidAmount);

  return await prisma.purchaseOrder.update({
    where: { id },
    data: { paidAmount, paymentStatus },
    select: { id: true, orderNumber: true, totalAmount: true, paidAmount: true, paymentStatus: true },
  });
};