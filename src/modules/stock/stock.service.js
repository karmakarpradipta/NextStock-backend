import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";
import { createAuditLog } from "../../utils/audit.js";

export const addStockMovement = async (data, userId) => {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, deletedAt: null },
    include: {
      stockMovements: { select: { type: true, quantity: true } },
    },
  });

  if (!product) throw new ApiError(404, "Product not found");

  // prevent stock going negative on OUT
  if (data.type === "OUT") {
    const currentStock = product.stockMovements.reduce((total, m) => {
      if (m.type === "IN") return total + m.quantity;
      if (m.type === "OUT") return total - m.quantity;
      if (m.type === "ADJUSTMENT") return total + m.quantity;
      return total;
    }, 0);

    if (currentStock < data.quantity) {
      throw new ApiError(400, `Insufficient stock. Current stock: ${currentStock}`);
    }
  }

  const movement = await prisma.stockMovement.create({
    data: {
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      note: data.note,
    },
    select: {
      id: true,
      type: true,
      quantity: true,
      note: true,
      createdAt: true,
      product: { select: { id: true, name: true, sku: true } },
    },
  });

  await createAuditLog({
    userId,
    action: "STOCK_MOVEMENT_ADDED",
    entity: "StockMovement",
    entityId: movement.id,
    metadata: { 
      type: movement.type, 
      quantity: movement.quantity, 
      productName: movement.product.name 
    },
  });

  return movement;
};

export const getStockMovementsByProduct = async (productId, query) => {
  const { page, limit, type } = query;
  const skip = (page - 1) * limit;

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) throw new ApiError(404, "Product not found");

  const where = {
    productId,
    ...(type && { type }),
  };

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        quantity: true,
        note: true,
        createdAt: true,
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCurrentStock = async (productId) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: {
      id: true,
      name: true,
      sku: true,
      minStockThreshold: true,
      unit: true,
      stockMovements: { select: { type: true, quantity: true } },
    },
  });

  if (!product) throw new ApiError(404, "Product not found");

  const currentStock = product.stockMovements.reduce((total, m) => {
    if (m.type === "IN") return total + m.quantity;
    if (m.type === "OUT") return total - m.quantity;
    if (m.type === "ADJUSTMENT") return total + m.quantity;
    return total;
  }, 0);

  const { stockMovements, ...rest } = product;

  return {
    ...rest,
    currentStock,
    isLowStock: currentStock <= product.minStockThreshold,
  };
};