import Link from "next/link";
import { getImageUrl } from "@/utils/image";
import StateBox from "@/components/common/StateBox";
import type { Coach } from "@/types/coach";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./HomePage.module.css";

type Props = {
  coaches: Coach[];
  loading: boolean;
  error: string;
};

export default function FeaturedCoaches({ coaches, loading, error }: Props) {
  return (
    <section className="container section">
      <div className="sectionTitleRow">
        <h2>Coach nổi bật</h2>
        <Link href="/coaches">Xem tất cả Coach →</Link>
      </div>

      {loading ? (
        <StateBox variant="loading" title="Đang tải Coach" description="Đang lấy dữ liệu Coach từ backend." />
      ) : error ? (
        <StateBox variant="error" title="Không tải được Coach" description={error} />
      ) : coaches.length === 0 ? (
        <StateBox variant="empty" title="Chưa có Coach khả dụng" />
      ) : (
        <div className={styles.coachGrid}>
          {coaches.map((coach) => (
            <article className={styles.coachCard} key={coach.CoachID}>
              <img src={getImageUrl(coach.AvatarURL)} alt={coach.FullName} />

              <div className={styles.coachInfo}>
                <h3>{coach.FullName}</h3>
                <p>⭐ {Number(coach.AverageRating || 0).toFixed(1)} ({coach.TotalStudents || 0})</p>
                <p>Chuyên môn: {coach.Specialization || "Pickleball cơ bản"}</p>
                <p>Kinh nghiệm: {coach.ExperienceYears || 0} năm</p>
                <strong>{formatCurrency(coach.HourlyRate)} / giờ</strong>
              </div>

              <div className={styles.coachActions}>
                <Link href={`/coaches/${coach.CoachID}`}>Đặt Coach</Link>
                <button type="button">♡</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
