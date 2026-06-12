import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";
import { createAuditLog } from "../../utils/audit.js";

export const getAllRequisitions = async (query, user) => {
  const { page, limit, status, productId } = query;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(productId && { productId }),
    // staff only sees their own, admin sees all
    ...(user.role === "STAFF" && { requestedBy: user.id }),
  };

  const [requisitions, total] = await Promise.all([
    prisma.requisition.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        quantity: true,
        reason: true,
        status: true,
        rejectionNote: true,
        createdAt: true,
        reviewedAt: true,
        product: { select: { id: true, name: true, sku: true, unit: true } },
        requester: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      },
    }),
    prisma.requisition.count({ where }),
  ]);

  return {
    requisitions,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getRequisitionById = async (id, user) => {
  const requisition = await prisma.requisition.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(user.role === "STAFF" && { requestedBy: user.id }),
    },
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true } },
      requester: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });

  if (!requisition) throw new ApiError(404, "Requisition not found");
  return requisition;
};

export const createRequisition = async (data, userId) => {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, deletedAt: null, isActive: true },
  });
  if (!product) throw new ApiError(404, "Product not found or inactive");

  const requisition = await prisma.requisition.create({
    data: {
      productId: data.productId,
      quantity: data.quantity,
      reason: data.reason,
      requestedBy: userId,
    },
    select: {
      id: true,
      quantity: true,
      reason: true,
      status: true,
      createdAt: true,
      product: { select: { id: true, name: true, sku: true, unit: true } },
      requester: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({
    userId,
    action: "REQUISITION_CREATED",
    entity: "Requisition",
    entityId: requisition.id,
    metadata: { productId: data.productId, quantity: data.quantity },
  });

  return requisition;
};

export const reviewRequisition = async (id, { action, rejectionNote }, adminId) => {
  const requisition = await prisma.requisition.findFirst({
    where: { id, deletedAt: null },
  });

  if (!requisition) throw new ApiError(404, "Requisition not found");
  if (requisition.status !== "PENDING") {
    throw new ApiError(400, `Requisition is already ${requisition.status}`);
  }

  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updated = await prisma.requisition.update({
    where: { id },
    data: {
      status: newStatus,
      rejectionNote: action === "REJECT" ? rejectionNote : null,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      rejectionNote: true,
      reviewedAt: true,
      product: { select: { id: true, name: true, sku: true } },
      requester: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({
    userId: adminId,
    action: action === "APPROVE" ? "REQUISITION_APPROVED" : "REQUISITION_REJECTED",
    entity: "Requisition",
    entityId: id,
    metadata: { status: newStatus, rejectionNote },
  });

  return updated;
};

export const cancelRequisition = async (id, userId, role) => {
  const requisition = await prisma.requisition.findFirst({
    where: { id, deletedAt: null },
  });

  if (!requisition) throw new ApiError(404, "Requisition not found");

  // staff can only cancel their own pending requisitions
  if (role === "STAFF" && requisition.requestedBy !== userId) {
    throw new ApiError(403, "You can only cancel your own requisitions");
  }

  if (requisition.status !== "PENDING") {
    throw new ApiError(400, "Only PENDING requisitions can be cancelled");
  }

  await prisma.requisition.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId,
    action: "REQUISITION_CANCELLED",
    entity: "Requisition",
    entityId: id,
  });
};

export const getApprovedRequisitions = async () => {
  return await prisma.requisition.findMany({
    where: { status: "APPROVED", deletedAt: null },
    select: {
      id: true,
      quantity: true,
      reason: true,
      createdAt: true,
      product: { select: { id: true, name: true, sku: true, unit: true } },
      requester: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
};