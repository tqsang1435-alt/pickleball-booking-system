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

// ─── UC-60: thêm mới ─────────────────────────────────────────────────────────

export const lockAccountSchema = z.object({
  userId: z.number().int().positive("UserID không hợp lệ"),
  isLocked: z.boolean(),
  reason: z.string().min(5, "Lý do phải có ít nhất 5 ký tự").optional(),
}).refine(
  (data) => !data.isLocked || !!data.reason,
  { message: "Phải nhập lý do khi khóa tài khoản", path: ["reason"] }
);

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isLocked: z.enum(["true", "false"]).transform(v => v === "true").optional(),
});