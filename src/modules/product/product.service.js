import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";
import { createAuditLog } from "../../utils/audit.js";

// Auto-generate SKU: PRD-00001
const generateSKU = async () => {
  const last = await prisma.product.findFirst({
    orderBy: { createdAt: "desc" },
    select: { sku: true },
  });

  if (!last) return "PRD-00001";

  const num = parseInt(last.sku.split("-")[1]) + 1;
  return `PRD-${String(num).padStart(5, "0")}`;
};

// Get live stock level from stock_movements
const getLiveStock = (movements) => {
  return movements.reduce((total, m) => {
    if (m.type === "IN") return total + m.quantity;
    if (m.type === "OUT") return total - m.quantity;
    if (m.type === "ADJUSTMENT") return total + m.quantity;
    return total;
  }, 0);
};

export const getAllProducts = async (query) => {
  const { page, limit, search, categoryId, isActive, lowStock } = query;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(isActive !== undefined && { isActive }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        sku: true,
        imageUrl: true,
        unit: true,
        minStockThreshold: true,
        isActive: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        stockMovements: { select: { type: true, quantity: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const result = products.map((p) => {
    const currentStock = getLiveStock(p.stockMovements);
    const isLowStock = currentStock <= p.minStockThreshold;
    const { stockMovements, ...rest } = p;
    return { ...rest, currentStock, isLowStock };
  });

  // filter low stock after computing
  const filtered = lowStock ? result.filter((p) => p.isLowStock) : result;

  return {
    products: filtered,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (id) => {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: { select: { id: true, name: true } },
      stockMovements: { select: { type: true, quantity: true } },
    },
  });

  if (!product) throw new ApiError(404, "Product not found");

  const currentStock = getLiveStock(product.stockMovements);
  const isLowStock = currentStock <= product.minStockThreshold;
  const { stockMovements, ...rest } = product;
  return { ...rest, currentStock, isLowStock };
};

export const createProduct = async (data, userId) => {
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, deletedAt: null, isActive: true },
  });
  if (!category) throw new ApiError(404, "Category not found or inactive");

  const sku = data.sku || (await generateSKU());

  if (data.sku) {
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) throw new ApiError(409, "SKU already in use");
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku,
      description: data.description,
      imageUrl: data.imageUrl,
      unit: data.unit,
      minStockThreshold: data.minStockThreshold,
      isActive: data.isActive,
      categoryId: data.categoryId,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
      isActive: true,
      category: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({
    userId,
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    metadata: { name: product.name, sku: product.sku },
  });

  return product;
};

export const updateProduct = async (id, data, userId) => {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  if (!product) throw new ApiError(404, "Product not found");

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, deletedAt: null },
    });
    if (!category) throw new ApiError(404, "Category not found");
  }

  const update = await prisma.product.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
      isActive: true,
      category: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({
    userId,
    action: "PRODUCT_UPDATED",
    entity: "Product",
    entityId: id,
    metadata: { changes: data },
  });

  return update;
};

export const deleteProduct = async (id, userId) => {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  if (!product) throw new ApiError(404, "Product not found");

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId,
    action: "PRODUCT_DELETED",
    entity: "Product",
    entityId: id,
  });
};
