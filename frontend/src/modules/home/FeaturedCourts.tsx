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

export default function FeaturedCourts({ courts, loading, error }: Props) {
  return (
    <section className="container section">
      <div className="sectionTitleRow">
        <h2>Sân nổi bật</h2>
        <Link href="/images/home.png">Xem tất cả sân →</Link>
      </div>

      {loading ? (
        <StateBox variant="loading" title="Đang tải sân" description="Đang lấy dữ liệu sân từ backend." />
      ) : error ? (
        <StateBox variant="error" title="Không tải được sân" description={error} />
      ) : courts.length === 0 ? (
        <StateBox variant="empty" title="Chưa có sân khả dụng" />
      ) : (
        <div className={styles.courtGrid}>
          {courts.map((court) => (
            <article className={styles.courtCard} key={court.CourtID}>
              <div className={styles.courtImage}>
                <img src={getCourtImage(court)} alt={court.CourtName} />
                <span>Còn trống</span>
              </div>

              <div className={styles.courtBody}>
                <div>
                  <h3>{court.CourtName}</h3>
                  <p>📍 {court.Location}</p>
                </div>
                <strong>{formatCurrency(court.PricePerHour)} <small>/ giờ</small></strong>
              </div>

              <div className={styles.tags}>
                <span>{court.CourtType === "Indoor" ? "Sân trong nhà" : "Sân ngoài trời"}</span>
                <span>{court.OpenTime} - {court.CloseTime}</span>
              </div>

              <Link href={`/courts/${court.CourtID}`} className={styles.detailLink}>Xem chi tiết →</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
