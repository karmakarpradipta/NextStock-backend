import { z } from "zod";

export const createMovementSchema = z.object({
  productId: z.string({ required_error: "Product ID is required" }).uuid("Invalid product ID"),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"], { required_error: "Movement type is required" }),
  quantity: z.number({ required_error: "Quantity is required" }).int().refine(v => v !== 0, "Quantity cannot be zero"),
  note: z.string().optional(),
});

export const stockQuerySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v) || 1),
  limit: z.string().optional().transform(v => parseInt(v) || 10),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]).optional(),
});