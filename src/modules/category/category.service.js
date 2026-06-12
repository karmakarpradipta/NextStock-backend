import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";
import { createAuditLog } from "../../utils/audit.js";

export const getAllCategories = async () => {
  return await prisma.category.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// export const createCategory = async ({ name }) => {
//   const existing = await prisma.category.findUnique({ where: { name } });
//   if (existing) throw new ApiError(409, "Category already exists");

//   return await prisma.category.create({
//     data: { name },
//     select: { id: true, name: true, isActive: true, createdAt: true },
//   });
// };

// export const updateCategory = async (id, data) => {
//   const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
//   if (!category) throw new ApiError(404, "Category not found");

//   if (data.name && data.name !== category.name) {
//     const existing = await prisma.category.findUnique({ where: { name: data.name } });
//     if (existing) throw new ApiError(409, "Category name already in use");
//   }

//   return await prisma.category.update({
//     where: { id },
//     data,
//     select: { id: true, name: true, isActive: true },
//   });
// };

// export const deleteCategory = async (id) => {
//   const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
//   if (!category) throw new ApiError(404, "Category not found");

//   const linkedProducts = await prisma.product.count({
//     where: { categoryId: id, deletedAt: null },
//   });
//   if (linkedProducts > 0) throw new ApiError(400, "Cannot delete category with linked products");

//   await prisma.category.update({
//     where: { id },
//     data: { deletedAt: new Date() },
//   });
// };

export const createCategory = async ({ name }, userId) => {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw new ApiError(409, "Category already exists");

  const category = await prisma.category.create({
    data: { name },
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  await createAuditLog({
    userId,
    action: "CATEGORY_CREATED",
    entity: "Category",
    entityId: category.id,
    metadata: { name },
  });

  return category;
};

export const updateCategory = async (id, data, userId) => {
  const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
  if (!category) throw new ApiError(404, "Category not found");

  if (data.name && data.name !== category.name) {
    const existing = await prisma.category.findUnique({ where: { name: data.name } });
    if (existing) throw new ApiError(409, "Category name already in use");
  }

  const updated = await prisma.category.update({
    where: { id },
    data,
    select: { id: true, name: true, isActive: true },
  });

  await createAuditLog({
    userId,
    action: "CATEGORY_UPDATED",
    entity: "Category",
    entityId: id,
    metadata: { changes: data },
  });

  return updated;
};

export const deleteCategory = async (id, userId) => {
  const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
  if (!category) throw new ApiError(404, "Category not found");

  const linkedProducts = await prisma.product.count({
    where: { categoryId: id, deletedAt: null },
  });
  if (linkedProducts > 0) throw new ApiError(400, "Cannot delete category with linked products");

  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });

  await createAuditLog({
    userId,
    action: "CATEGORY_DELETED",
    entity: "Category",
    entityId: id,
    metadata: { name: category.name },
  });
};