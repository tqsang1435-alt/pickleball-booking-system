import { z } from "zod";

export const createRoleSchema = z.object({
  roleName: z.string().min(2, "Tên role phải có ít nhất 2 ký tự"),
  description: z.string().optional(),
});

export const updateRoleSchema = z.object({
  roleName: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const assignRoleSchema = z.object({
  userId: z.number().int().positive(),
  roleId: z.number().int().positive(),
});