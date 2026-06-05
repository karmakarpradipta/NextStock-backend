import { z } from "zod";

export const createVendorSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(2, "Name must be at least 2 characters").trim(),
  contactPerson: z.string().trim().optional(),
  email: z.string().email("Invalid email").trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  gstNumber: z.string().trim().optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(2).trim().optional(),
  contactPerson: z.string().trim().optional(),
  email: z.string().email("Invalid email").trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  gstNumber: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const vendorQuerySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v) || 1),
  limit: z.string().optional().transform(v => parseInt(v) || 10),
  search: z.string().optional(),
  isActive: z.string().optional().transform(v => v === "true" ? true : v === "false" ? false : undefined),
});

export const mapProductsSchema = z.object({
  productIds: z.array(z.string().uuid("Invalid product ID"), { required_error: "Product IDs are required" }).min(1, "At least one product required"),
});