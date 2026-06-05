import bcrypt from "bcryptjs";
import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";

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
export const createUser = async ({ name, email, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "Email already in use");

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return user;
};

export const updateUser = async (id, data) => {
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

  return updated;
};

export const toggleUserStatus = async (id) => {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new ApiError(404, "User not found");

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, isActive: true },
  });

  return updated;
};

export const resetUserPassword = async (id, newPassword) => {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new ApiError(404, "User not found");

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { password: hashed },
  });
};