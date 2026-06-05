import { z } from "zod";

export const registerSchema = z.object({
  name: z.string({ error: "Name is required" }).min(2, { error: "Name must be at least 2 characters" }).trim(),
  email: z.email({ error: "Invalid email address" }).trim(),
  password: z.string({ error: "Password is required" }).min(6, { error: "Password must be at least 6 characters" }),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
});

export const loginSchema = z.object({
  email: z.email({ error: "Invalid email address" }).trim(),
  password: z.string({ error: "Password is required" }).min(1, { error: "Password is required" }),
});