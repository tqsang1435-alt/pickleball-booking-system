import Link from "next/link";
import StateBox from "@/components/common/StateBox";
import type { Court } from "@/types/court";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./HomePage.module.css";

type Props = {
  courts: Court[];
  loading: boolean;
  error: string;
};

function getCourtImage(court: Court) {
  return court.CourtImage || "/images/home/court-placeholder.jpg";
}

function formatTime(value?: string | null) {
  if (!value) return "05:00";
  return value.slice(0, 5);
}

export default function FeaturedCourts({ courts, loading, error }: Props) {
  return (
    <section className={styles.featureSection}>
      <div className={styles.sectionTitleRow}>
        <h2>Sân nổi bật</h2>
        <Link href="/courts">Xem tất cả sân →</Link>
      </div>

      {loading ? (
        <StateBox
          variant="loading"
          title="Đang tải sân"
          description="Đang lấy dữ liệu sân từ backend."
        />
      ) : error ? (
        <StateBox
          variant="error"
          title="Không tải được sân"
          description={error}
        />
      ) : courts.length === 0 ? (
        <StateBox
          variant="empty"
          title="Chưa có sân khả dụng"
        />
      ) : (
        <div className={styles.courtGrid}>
          {courts.map((court) => (
            <article
              className={styles.courtCard}
              key={court.CourtID}
            >
              <div className={styles.courtImage}>
                <img
                  src={getCourtImage(court)}
                  alt={court.CourtName}
                />
              </div>

              <div className={styles.courtBody}>
                <div className={styles.courtTitleRow}>
                  <h3>{court.CourtName}</h3>

                  <span className={styles.rating}>
                    ⭐ {court.Rating || "4.8"}
                  </span>
                </div>

                <p className={styles.location}>
                  📍 {court.Location || "Đà Nẵng"}
                </p>

                <strong className={styles.price}>
                  {formatCurrency(court.PricePerHour)}
                  <small> / giờ</small>
                </strong>

                <div className={styles.tags}>
                  <span>
                    {court.CourtType === "Indoor"
                      ? "Trong nhà"
                      : "Ngoài trời"}
                  </span>

                  <span>
                    {formatTime(court.OpenTime)} - {formatTime(court.CloseTime)}
                  </span>
                </div>

                <Link
                  href={`/courts/${court.CourtID}`}
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