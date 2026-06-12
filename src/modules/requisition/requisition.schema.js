import { z } from "zod";

export const createRequisitionSchema = z.object({
  productId: z.string({ required_error: "Product is required" }).uuid("Invalid product ID"),
  quantity: z.number({ required_error: "Quantity is required" }).int().min(1, "Quantity must be at least 1"),
  reason: z.string().trim().optional(),
});

export const reviewRequisitionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"], { required_error: "Action is required" }),
  rejectionNote: z.string().trim().optional(),
}).refine(data => {
  if (data.action === "REJECT" && !data.rejectionNote) {
    return false;
  }
  return true;
}, { message: "Rejection note is required when rejecting", path: ["rejectionNote"] });

export const requisitionQuerySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v) || 1),
  limit: z.string().optional().transform(v => parseInt(v) || 10),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ORDERED"]).optional(),
  productId: z.string().optional(),
});