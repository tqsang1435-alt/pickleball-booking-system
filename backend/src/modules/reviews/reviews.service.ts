import * as reviewsRepository from "./reviews.repository";

export async function getPublicReviews(limit = 6) {
  return reviewsRepository.findPublicReviews(limit);
}
