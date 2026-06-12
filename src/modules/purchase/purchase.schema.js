import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string({ required_error: "Product ID is required" }).uuid("Invalid product ID"),
  quantity: z.number({ required_error: "Quantity is required" }).int().min(1),
  unitPrice: z.number({ required_error: "Unit price is required" }).min(0),
  requisitionId: z.string().uuid("Invalid requisition ID").optional(),
});

export const createPurchaseSchema = z.object({
  vendorId: z.string({ required_error: "Vendor is required" }).uuid("Invalid vendor ID"),
  expectedDelivery: z.string().optional(),
  invoiceUrl: z.string().url("Invalid invoice URL").optional(),
  notes: z.string().optional(),
  purchaseDate: z.string().optional(),
  items: z.array(orderItemSchema, { required_error: "Items are required" }).min(1, "At least one item required"),
});

export const updatePurchaseSchema = z.object({
  expectedDelivery: z.string().optional(),
  invoiceUrl: z.string().url("Invalid invoice URL").optional(),
  notes: z.string().optional(),
  purchaseDate: z.string().optional(),
  items: z.array(orderItemSchema).min(1).optional(),
});

export const updatePaymentSchema = z.object({
  paidAmount: z.number({ required_error: "Paid amount is required" }).min(0),
});

export const purchaseQuerySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v) || 1),
  limit: z.string().optional().transform(v => parseInt(v) || 10),
  search: z.string().optional(),
  vendorId: z.string().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "DELIVERED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});