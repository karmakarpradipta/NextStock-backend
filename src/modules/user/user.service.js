import bcrypt from "bcryptjs";
import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";
import { createAuditLog } from "../../utils/audit.js";

export const getAllUsers = async (adminId) => {
  return await prisma.user.findMany({
    where: {
      deletedAt: null,
      id: { not: adminId },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};
// export const createUser = async ({ name, email, password, role }) => {
//   const existing = await prisma.user.findUnique({ where: { email } });
//   if (existing) throw new ApiError(409, "Email already in use");

//   const hashed = await bcrypt.hash(password, 10);

//   const user = await prisma.user.create({
//     data: { name, email, password: hashed, role },
//     select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
//   });

//   return user;
// };

export const createUser = async (data, adminId) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "Email already in use");

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { ...data, password: hashed },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  await createAuditLog({
    userId: adminId,
    action: "USER_CREATED",
    entity: "User",
    entityId: user.id,
    metadata: { name: user.name, email: user.email, role: user.role },
  });

  return user;
};

// export const updateUser = async (id, data) => {
//   const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
//   if (!user) throw new ApiError(404, "User not found");

//   if (data.email && data.email !== user.email) {
//     const existing = await prisma.user.findUnique({ where: { email: data.email } });
//     if (existing) throw new ApiError(409, "Email already in use");
//   }

//   const updated = await prisma.user.update({
//     where: { id },
//     data,
//     select: { id: true, name: true, email: true, role: true, isActive: true },
//   });

//   return updated;
// };

export const updateUser = async (id, data, adminId) => {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new ApiError(404, "User not found");

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ApiError(409, "Email already in use");
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  await createAuditLog({
    userId: adminId,
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    metadata: { changes: data },
  });

  return updated;
};

// export const toggleUserStatus = async (id) => {
//   const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
//   if (!user) throw new ApiError(404, "User not found");

//   const updated = await prisma.user.update({
//     where: { id },
//     data: { isActive: !user.isActive },
//     select: { id: true, name: true, isActive: true },
//   });

//   return updated;
// };

export const toggleUserStatus = async (id, adminId) => {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new ApiError(404, "User not found");

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, isActive: true },
  });

  await createAuditLog({
    userId: adminId,
    action: "USER_STATUS_TOGGLED",
    entity: "User",
    entityId: id,
    metadata: { isActive: updated.isActive },
  });

  return updated;
};

// export const resetUserPassword = async (id, newPassword) => {
//   const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
//   if (!user) throw new ApiError(404, "User not found");

//   const hashed = await bcrypt.hash(newPassword, 10);

//   await prisma.user.update({
//     where: { id },
//     data: { password: hashed },
//   });
// };

export const resetUserPassword = async (id, newPassword, adminId) => {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new ApiError(404, "User not found");

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { password: hashed } });

  await createAuditLog({
    userId: adminId,
    action: "USER_PASSWORD_RESET",
    entity: "User",
    entityId: id,
  });
};

