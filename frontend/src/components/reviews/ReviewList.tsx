import React from "react";
import { FaStar, FaCheckCircle, FaUserCircle } from "react-icons/fa";
import styles from "./ReviewList.module.css";
import { Review } from "@/types/review";

interface ReviewListProps {
  reviews: Review[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ReviewList({ reviews, loading, page, totalPages, onPageChange }: ReviewListProps) {
  if (loading) {
    return (
      <div className={styles.listContainer}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonAvatar}></div>
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonLine} style={{ width: "40%" }}></div>
              <div className={styles.skeletonLine} style={{ width: "80%" }}></div>
              <div className={styles.skeletonLine} style={{ width: "60%" }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Chưa có đánh giá nào.</p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {reviews.map((review) => (
        <div key={review.ReviewID} className={styles.reviewCard}>
          <div className={styles.reviewHeader}>
            <div className={styles.userInfo}>
              {review.AvatarURL ? (
                <img src={review.AvatarURL} alt={review.FullName} className={styles.avatar} />
              ) : (
                <FaUserCircle className={styles.defaultAvatar} />
              )}
              <div className={styles.meta}>
                <h4>{review.FullName}</h4>
                <span className={styles.date}>
                  {new Date(review.CreatedAt).toLocaleDateString("vi-VN")}
                </span>
                {review.BookingID && (
                  <span className={styles.verified}>
                    <FaCheckCircle /> Đã xác thực
                  </span>
                )}
              </div>
            </div>
            <div className={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={i < review.Rating ? styles.starFilled : styles.starEmpty} />
              ))}
            </div>
          </div>
          <p className={styles.comment}>{review.Comment}</p>
        </div>
      ))}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            disabled={page === 1} 
            onClick={() => onPageChange(page - 1)}
            className={styles.pageBtn}
          >
            Trước
          </button>
          <span className={styles.pageInfo}>Trang {page} / {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => onPageChange(page + 1)}
            className={styles.pageBtn}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
