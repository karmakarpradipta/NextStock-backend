import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(2, "Name must be at least 2 characters").trim(),
  email: z.string({ required_error: "Email is required" }).email("Invalid email").trim(),
  password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "STAFF"], { required_error: "Role is required" }),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim().optional(),
  email: z.string().email("Invalid email").trim().optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string({ required_error: "New password is required" }).min(6, "Password must be at least 6 characters"),
});