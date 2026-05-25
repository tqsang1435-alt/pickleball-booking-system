import Link from "next/link";
import styles from "./HomePage.module.css";

export default function AiSection() {
  return (
    <section className="container section">
      <div className={styles.aiPanel}>
        <div className={styles.aiIntro}>
          <span>AI POWERED</span>
          <h2>AI giúp bạn chơi tốt hơn mỗi ngày</h2>
          <p>Công nghệ AI phân tích dữ liệu để mang đến gợi ý phù hợp nhất cho bạn.</p>
          <Link href="/ai">Khám phá ngay →</Link>
        </div>

        <div className={styles.aiFeature}>
          <div>♙</div>
          <h3>AI gợi ý Coach</h3>
          <p>Tìm Coach phù hợp với trình độ và mục tiêu.</p>
        </div>

        <div className={styles.aiFeature}>
          <div>▣</div>
          <h3>Smart Scheduler</h3>
          <p>Đề xuất khung giờ tối ưu theo lịch rảnh và sân trống.</p>
        </div>

        <div className={styles.aiFeature}>
          <div>☷</div>
          <h3>Player Matching</h3>
          <p>Kết nối với người chơi cùng trình độ và mục tiêu.</p>
        </div>
      </div>
    </section>
  );
}
