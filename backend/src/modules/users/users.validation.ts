import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự").optional(),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Số điện thoại phải gồm đúng 10 chữ số")
    .optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["Active", "Inactive", "Locked"]),
});