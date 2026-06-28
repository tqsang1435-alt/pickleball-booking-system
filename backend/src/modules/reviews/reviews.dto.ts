import { z } from "zod";

export const createReviewSchema = z.object({
  bookingId: z.number().int().positive("BookingID không hợp lệ").optional(),
  courtId: z.number().int().positive().optional(),
  coachId: z.number().int().positive().optional(),
  rating: z.number().int().min(1, "Rating phải từ 1 đến 5 sao").max(5, "Rating phải từ 1 đến 5 sao"),
  comment: z.string().min(5, "Bình luận phải có ít nhất 5 ký tự").max(500, "Bình luận tối đa 500 ký tự"),
});

export type CreateReviewDTO = z.infer<typeof createReviewSchema>;
