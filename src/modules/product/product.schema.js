import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(2).trim(),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  unit: z.string({ required_error: "Unit is required" }).trim(),
  minStockThreshold: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  categoryId: z.string({ required_error: "Category is required" }).uuid("Invalid category ID"),
  sku: z.string().optional(), // if provided, use it; otherwise auto-generate
});

export const updateProductSchema = z.object({
  name: z.string().min(2).trim().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  unit: z.string().trim().optional(),
  minStockThreshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
});

export const productQuerySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v) || 1),
  limit: z.string().optional().transform(v => parseInt(v) || 10),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.string().optional().transform(v => v === "true" ? true : v === "false" ? false : undefined),
  lowStock: z.string().optional().transform(v => v === "true"),
});