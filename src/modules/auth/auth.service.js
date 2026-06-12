import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";
import { createAuditLog } from "../../utils/audit.js";

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });
};

export const registerUser = async ({ name, email, password, role }) => {
 console.log(name, email, password, role)
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "Email already in use");

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: role || "STAFF" },
  });

  return { id: user.id, name: user.name, email: user.email, role: user.role };
};

// export const loginUser = async ({ email, password }) => {
//   const user = await prisma.user.findUnique({ where: { email } });
//   if (!user || user.deletedAt) throw new ApiError(401, "Invalid credentials");
//   if (!user.isActive) throw new ApiError(403, "Account is inactive");

//   const match = await bcrypt.compare(password, user.password);
//   if (!match) throw new ApiError(401, "Invalid credentials");

//   const accessToken = generateAccessToken(user);
//   const refreshToken = generateRefreshToken(user);

//   const expiresAt = new Date();
//   expiresAt.setDate(expiresAt.getDate() + 7);

//   await prisma.refreshToken.create({
//     data: { token: refreshToken, userId: user.id, expiresAt },
//   });

//   return {
//     accessToken,
//     refreshToken,
//     user: { id: user.id, name: user.name, email: user.email, role: user.role },
//   };
// };

export const loginUser = async ({ email, password }, ipAddress) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) throw new ApiError(401, "Invalid credentials");
  if (!user.isActive) throw new ApiError(403, "Account is inactive");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(401, "Invalid credentials");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  await createAuditLog({
    userId: user.id,
    action: "USER_LOGIN",
    entity: "User",
    entityId: user.id,
    ipAddress,
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

export const refreshAccessToken = async (token) => {
  if (!token) throw new ApiError(401, "No refresh token");

  let payload;
  try {
    payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(403, "Invalid refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new ApiError(403, "Refresh token expired or not found");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw new ApiError(403, "User not found");

  const accessToken = generateAccessToken(user);
  return { accessToken };
};

// export const logoutUser = async (token) => {
//   if (!token) throw new ApiError(400, "No token provided");
//   await prisma.refreshToken.deleteMany({ where: { token } });
// };

export const logoutUser = async (token, userId) => {
  if (!token) throw new ApiError(400, "No token provided");
  await prisma.refreshToken.deleteMany({ where: { token } });

  if (userId) {
    await createAuditLog({
      userId,
      action: "USER_LOGOUT",
      entity: "User",
      entityId: userId,
    });
  }
};