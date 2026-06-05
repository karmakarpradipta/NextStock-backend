import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(2, "Name must be at least 2 characters").trim(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim().optional(),
  isActive: z.boolean().optional(),
});