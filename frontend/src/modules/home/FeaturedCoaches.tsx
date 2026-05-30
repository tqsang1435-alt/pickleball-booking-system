import Link from "next/link";
import StateBox from "@/components/common/StateBox";
import type { Coach } from "@/types/coach";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./HomePage.module.css";

type Props = {
  coaches: Coach[];
  loading: boolean;
  error: string;
};

function getCoachImage(coach: Coach) {
  return coach.AvatarURL || "/images/home/avatar-placeholder.jpg";
}

export default function FeaturedCoaches({ coaches, loading, error }: Props) {
  return (
    <section className={styles.featureSection}>
      <div className={styles.sectionTitleRow}>
        <h2>Coach nổi bật</h2>
        <Link href="/coaches">Xem tất cả Coach →</Link>
      </div>

      {loading ? (
        <StateBox
          variant="loading"
          title="Đang tải Coach"
          description="Đang lấy dữ liệu Coach từ backend."
        />
      ) : error ? (
        <StateBox
          variant="error"
          title="Không tải được Coach"
          description={error}
        />
      ) : coaches.length === 0 ? (
        <StateBox
          variant="empty"
          title="Chưa có Coach khả dụng"
        />
      ) : (
        <div className={styles.coachGrid}>
          {coaches.map((coach) => (
            <article
              className={styles.coachCard}
              key={coach.CoachID}
            >
              <div className={styles.coachImage}>
                <img
                  src={getCoachImage(coach)}
                  alt={coach.FullName}
                />

                <button type="button">♡</button>
              </div>

              <div className={styles.coachInfo}>
                <div className={styles.coachTitleRow}>
                  <h3>{coach.FullName}</h3>

                  <span className={styles.rating}>
                    ⭐ {Number(coach.AverageRating || 0).toFixed(1)}
                  </span>
                </div>

                <p className={styles.coachMeta}>
                  👥 {coach.TotalStudents || 0} học viên
                </p>

                <p className={styles.coachDesc}>
                  {coach.Specialization || "Pickleball cơ bản"}
                </p>

                <div className={styles.tags}>
                  <span>{coach.ExperienceYears || 0} năm kinh nghiệm</span>
                  <span>Đã xác thực</span>
                </div>

                <strong className={styles.price}>
                  {formatCurrency(coach.HourlyRate)}
                  <small> / giờ</small>
                </strong>

                <Link
                  href={`/coaches/${coach.CoachID}`}
                  className={styles.detailLink}
                >
                  Xem chi tiết
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}