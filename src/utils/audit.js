import prisma from "../config/db.js";

export const createAuditLog = async ({
  userId,
  action,
  entity,
  entityId = null,
  metadata = null,
  ipAddress = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata,
        ipAddress,
      },
    });
  } catch (err) {
    // audit log failure should never crash the main request
    console.error("Audit log failed:", err);
  }
};