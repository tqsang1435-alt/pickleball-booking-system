import React from "react";
import { FaStar } from "react-icons/fa";
import styles from "./ReviewStatsView.module.css";
import { ReviewStats } from "@/types/review";

interface ReviewStatsViewProps {
  stats?: ReviewStats;
}

export default function ReviewStatsView({ stats }: ReviewStatsViewProps) {
  if (!stats || stats.TotalReviews === 0) {
    return (
      <div className={styles.statsContainer}>
        <div className={styles.noStats}>Chưa có đủ dữ liệu đánh giá</div>
      </div>
    );
  }

  const { TotalReviews, AverageRating, Star5, Star4, Star3, Star2, Star1 } = stats;
  const starsArray = [
    { label: "5", count: Star5 },
    { label: "4", count: Star4 },
    { label: "3", count: Star3 },
    { label: "2", count: Star2 },
    { label: "1", count: Star1 },
  ];

  return (
    <div className={styles.statsContainer}>
      <div className={styles.averageSection}>
        <div className={styles.averageScore}>{AverageRating.toFixed(1)}</div>
        <div className={styles.stars}>
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              className={i < Math.round(AverageRating) ? styles.starFilled : styles.starEmpty}
            />
          ))}
        </div>
        <div className={styles.totalReviews}>{TotalReviews} đánh giá</div>
      </div>

      <div className={styles.barsSection}>
        {starsArray.map((star) => (
          <div key={star.label} className={styles.barRow}>
            <span className={styles.starLabel}>{star.label} <FaStar className={styles.smallStar}/></span>
            <div className={styles.barBackground}>
              <div
                className={styles.barFill}
                style={{ width: `${(star.count / TotalReviews) * 100}%` }}
              ></div>
            </div>
            <span className={styles.countLabel}>{star.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
