import * as reviewsRepository from "./reviews.repository";
import { CreateReviewDTO } from "./reviews.dto";

export async function getPublicReviews(limit = 6) {
  return reviewsRepository.findPublicReviews(limit);
}

export async function getCoachReviews(coachId: number, page: number = 1, limit: number = 10) {
  const [data, total, stats] = await Promise.all([
    reviewsRepository.findCoachReviews(coachId, page, limit),
    reviewsRepository.countCoachReviews(coachId),
    reviewsRepository.getReviewStats('coach', coachId)
  ]);
  
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats
  };
}

export async function getCourtReviews(courtId: number, page: number = 1, limit: number = 10) {
  const [data, total, stats] = await Promise.all([
    reviewsRepository.findCourtReviews(courtId, page, limit),
    reviewsRepository.countCourtReviews(courtId),
    reviewsRepository.getReviewStats('court', courtId)
  ]);
  
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats
  };
}

export async function getClubReviews(page: number = 1, limit: number = 10) {
  // Use global stats for Club (average of all reviews)
  const [data, total, stats] = await Promise.all([
    reviewsRepository.findClubReviews(page, limit),
    reviewsRepository.countClubReviews(),
    reviewsRepository.getClubGlobalStats()
  ]);
  
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats
  };
}

export async function getMyReviews(userId: number, page: number = 1, limit: number = 10) {
  const [data, total] = await Promise.all([
    reviewsRepository.findMyReviews(userId, page, limit),
    reviewsRepository.countMyReviews(userId)
  ]);
  
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function createReview(userId: number, payload: CreateReviewDTO) {
  let bookingId: number;
  let courtId: number | null = null;
  let coachId: number | null = null;

  if (payload.bookingId) {
    bookingId = payload.bookingId;
    const bookingInfo = await reviewsRepository.getBookingInfoForReview(bookingId, userId);
    if (!bookingInfo) {
      throw new Error("Không tìm thấy Booking hoặc bạn không có quyền");
    }
    if (bookingInfo.Status !== 'Completed') {
      throw new Error("Chỉ Booking đã hoàn thành mới được đánh giá");
    }
    
    const isReviewed = await reviewsRepository.checkBookingReviewed(bookingId);
    if (isReviewed) {
      throw new Error("Booking này đã được đánh giá");
    }

    courtId = bookingInfo.CourtID;
    coachId = bookingInfo.CoachID;
  } else {
    // Club/Court/Coach Review logic directly from detail pages
    const unreviewedBookingId = await reviewsRepository.findUnreviewedCompletedBooking(userId, payload.courtId, payload.coachId);
    if (!unreviewedBookingId) {
      if (payload.courtId) {
        throw new Error("Bạn chưa có lượt đặt hoàn thành nào chưa được đánh giá cho sân này.");
      } else if (payload.coachId) {
        throw new Error("Bạn chưa có lượt đặt hoàn thành nào chưa được đánh giá cho HLV này.");
      } else {
        throw new Error("Bạn cần có ít nhất 1 lượt đặt dịch vụ hoàn thành chưa được đánh giá để viết đánh giá Câu lạc bộ.");
      }
    }
    bookingId = unreviewedBookingId;
    // For club review, we don't attach specific Court/Coach to the review record
    courtId = payload.courtId || null;
    coachId = payload.coachId || null;
  }

  const newReview = await reviewsRepository.createReview({
    bookingId,
    userId,
    courtId,
    coachId,
    rating: payload.rating,
    comment: payload.comment
  });

  // Calculate and update the Court or Coach AverageRating if needed.
  // We can do this in a background job or directly here.
  if (courtId) {
    // Optionally update court rating cache
  }
  if (coachId) {
    // Optionally update coach AverageRating in Coaches table. Let's do it safely.
    const stats = await reviewsRepository.getReviewStats('coach', coachId);
    const { getPool, sql } = require("@/database/connection");
    const pool = await getPool();
    await pool.request()
      .input("Avg", sql.Decimal(3, 2), stats.AverageRating)
      .input("CoachID", sql.Int, coachId)
      .query("UPDATE Coaches SET AverageRating = @Avg WHERE CoachID = @CoachID");
  }

  return newReview;
}
