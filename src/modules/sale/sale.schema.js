import { z } from "zod";

const saleItemSchema = z.object({
  productId: z.string({ required_error: "Product ID is required" }).uuid("Invalid product ID"),
  quantity: z.number({ required_error: "Quantity is required" }).int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number({ required_error: "Unit price is required" }).min(0, "Unit price cannot be negative"),
});

export const createSaleSchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  customerEmail: z.string().email("Invalid email").trim().optional(),
  notes: z.string().optional(),
  saleDate: z.string().optional(),
  items: z.array(saleItemSchema, { required_error: "Items are required" }).min(1, "At least one item required"),
});

export const updateSaleSchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  customerEmail: z.string().email("Invalid email").trim().optional(),
  notes: z.string().optional(),
  saleDate: z.string().optional(),
  items: z.array(saleItemSchema).min(1).optional(),
});

export const updateSalePaymentSchema = z.object({
  paidAmount: z.number({ required_error: "Paid amount is required" }).min(0),
});

export const saleQuerySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v) || 1),
  limit: z.string().optional().transform(v => parseInt(v) || 10),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});