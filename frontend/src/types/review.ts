import { ApiResponse } from "./api";

export interface Review {
  ReviewID: number;
  BookingID: number;
  UserID: number;
  CourtID?: number;
  CoachID?: number;
  Rating: number;
  Comment: string;
  Status: string;
  CreatedAt: string;
  FullName: string;
  AvatarURL?: string;
  CourtName?: string;
  CoachName?: string;
}

export interface ReviewStats {
  TotalReviews: number;
  AverageRating: number;
  Star5: number;
  Star4: number;
  Star3: number;
  Star2: number;
  Star1: number;
}

export interface ReviewPaginationResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: ReviewStats;
}

export interface CreateReviewData {
  bookingId?: number;
  courtId?: number;
  coachId?: number;
  rating: number;
  comment: string;
}
