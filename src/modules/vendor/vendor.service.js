import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";
import { createAuditLog } from "../../utils/audit.js";

export const getAllVendors = async (query) => {
  const { page, limit, search, isActive } = query;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(isActive !== undefined && { isActive }),
  };

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        contactPerson: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { purchaseOrders: true, vendorProducts: true } },
      },
    }),
    prisma.vendor.count({ where }),
  ]);

  return {
    vendors,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getVendorById = async (id) => {
  const vendor = await prisma.vendor.findFirst({
    where: { id, deletedAt: null },
    include: {
      vendorProducts: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, unit: true, isActive: true },
          },
        },
      },
      purchaseOrders: {
        where: { deletedAt: null },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          expectedDelivery: true,
          deliveredAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5, // latest 5 orders
      },
    },
  });

  if (!vendor) throw new ApiError(404, "Vendor not found");

  // compute performance live
  const allOrders = await prisma.purchaseOrder.findMany({
    where: { vendorId: id, deletedAt: null },
    select: {
      totalAmount: true,
      paidAmount: true,
      status: true,
      expectedDelivery: true,
      deliveredAt: true,
    },
  });

  const orderCount = allOrders.length;
  const totalOrdered = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = allOrders.reduce((sum, o) => sum + o.paidAmount, 0);
  const outstandingBalance = totalOrdered - totalPaid;

  const deliveredOrders = allOrders.filter(o => o.status === "DELIVERED");
  const onTimeDeliveries = deliveredOrders.filter(
    o => o.deliveredAt && o.expectedDelivery && o.deliveredAt <= o.expectedDelivery
  ).length;
  const onTimeDeliveryRate = deliveredOrders.length > 0
    ? Math.round((onTimeDeliveries / deliveredOrders.length) * 100)
    : null;

  const { purchaseOrders, ...rest } = vendor;

  return {
    ...rest,
    performance: {
      orderCount,
      totalOrdered,
      totalPaid,
      outstandingBalance,
      onTimeDeliveryRate, // percentage or null if no delivered orders yet
    },
    recentOrders: purchaseOrders,
  };
};

export const createVendor = async (data, userId) => {
  if (data.email) {
    const existing = await prisma.vendor.findUnique({ where: { email: data.email } });
    if (existing) throw new ApiError(409, "Email already in use");
  }

  if (data.gstNumber) {
    const existing = await prisma.vendor.findFirst({ where: { gstNumber: data.gstNumber } });
    if (existing) throw new ApiError(409, "GST number already in use");
  }

  const vendor = await prisma.vendor.create({
    data,
    select: {
      id: true, name: true, contactPerson: true,
      email: true, phone: true, gstNumber: true,
      address: true, isActive: true, createdAt: true,
    },
  });

  await createAuditLog({
    userId,
    action: "VENDOR_CREATED",
    entity: "Vendor",
    entityId: vendor.id,
    metadata: { name: vendor.name, email: vendor.email },
  });

  return vendor;
};

export const updateVendor = async (id, data, userId) => {
  const vendor = await prisma.vendor.findFirst({ where: { id, deletedAt: null } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  if (data.email && data.email !== vendor.email) {
    const existing = await prisma.vendor.findUnique({ where: { email: data.email } });
    if (existing) throw new ApiError(409, "Email already in use");
  }

  if (data.gstNumber && data.gstNumber !== vendor.gstNumber) {
    const existing = await prisma.vendor.findFirst({ where: { gstNumber: data.gstNumber } });
    if (existing) throw new ApiError(409, "GST number already in use");
  }

  const updated = await prisma.vendor.update({
    where: { id },
    data,
    select: {
      id: true, name: true, contactPerson: true,
      email: true, phone: true, isActive: true,
    },
  });

  await createAuditLog({
    userId,
    action: "VENDOR_UPDATED",
    entity: "Vendor",
    entityId: id,
    metadata: { changes: data },
  });

  return updated;
};

export const deleteVendor = async (id, userId) => {
  const vendor = await prisma.vendor.findFirst({ where: { id, deletedAt: null } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  await prisma.vendor.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId,
    action: "VENDOR_DELETED",
    entity: "Vendor",
    entityId: id,
  });
};

export const mapProductsToVendor = async (vendorId, productIds, userId) => {
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, deletedAt: null } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  // verify all products exist
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
  });
  if (products.length !== productIds.length) {
    throw new ApiError(404, "One or more products not found");
  }

  // upsert — skip duplicates
  await prisma.vendorProduct.createMany({
    data: productIds.map(productId => ({ vendorId, productId })),
    skipDuplicates: true,
  });

  await createAuditLog({
    userId,
    action: "VENDOR_PRODUCTS_MAPPED",
    entity: "Vendor",
    entityId: vendorId,
    metadata: { productIds },
  });

  return await prisma.vendorProduct.findMany({
    where: { vendorId },
    select: {
      product: { select: { id: true, name: true, sku: true } },
    },
  });
};

export const unmapProductFromVendor = async (vendorId, productId, userId) => {
  const mapping = await prisma.vendorProduct.findUnique({
    where: { vendorId_productId: { vendorId, productId } },
  });
  if (!mapping) throw new ApiError(404, "Mapping not found");

  await prisma.vendorProduct.delete({
    where: { vendorId_productId: { vendorId, productId } },
  });

  await createAuditLog({
    userId,
    action: "VENDOR_PRODUCT_UNMAPPED",
    entity: "Vendor",
    entityId: vendorId,
    metadata: { productId },
  });
};