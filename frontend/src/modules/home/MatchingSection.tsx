import styles from "@/styles/Home.module.css";

const matches = [
  {
    title: "Tìm 1 người đánh đôi",
    level: "Trung bình",
    time: "20/05/2026 - 18:00",
    place: "Air Pickleball Center",
    avatar: "🏓",
  },
  {
    title: "Tìm nhóm đánh sáng cuối tuần",
    level: "Khá",
    time: "24/05/2026 - 07:00",
    place: "Sunrise Pickleball Club",
    avatar: "👥",
  },
  {
    title: "Tìm bạn luyện tập buổi tối",
    level: "Mới chơi",
    time: "26/05/2026 - 19:30",
    place: "Sky Pickleball Arena",
    avatar: "🎾",
  },
];

export default function MatchingSection() {
  return (
    <>
      <section className={styles.cardSection}>
        <div className={styles.sectionTitle}>
          <h2>Tìm người chơi cùng</h2>
          <a>Xem tất cả ›</a>
        </div>

        <div className={styles.matchList}>
          {matches.map((match) => (
            <article className={styles.matchCard} key={match.title}>
              <div className={styles.smallAvatar}>
                {match.avatar}
              </div>

              <div className={styles.matchInfo}>
                <h3>{match.title}</h3>
                <p>🏅 Trình độ: {match.level}</p>
                <p>⏰ Thời gian: {match.time}</p>
                <p>📍 Địa điểm: {match.place}</p>
              </div>

              <button className={styles.joinBtn}>
                Tham gia
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.features}>
        <div>
          📅 <b>Xem lịch trống</b>
          <span>Theo thời gian thực</span>
        </div>

        <div>
          💳 <b>Thanh toán online</b>
          <span>An toàn, nhanh chóng</span>
        </div>

        <div>
          👥 <b>Không lo double booking</b>
          <span>Giữ chỗ chính xác</span>
        </div>

        <div>
          🎧 <b>Hỗ trợ 24/7</b>
          <span>Nhanh chóng, tận tâm</span>
        </div>
      </section>

      <section className={styles.banner}>
        <div>
          <h2>Trải nghiệm Pickleball theo cách của bạn!</h2>

          <p>
            Đặt sân, đặt HLV hoặc combo ngay hôm nay.
          </p>

          <button className={styles.joinBtn}>
            Đặt ngay
          </button>
        </div>

        <div className={styles.stats}>
          <span>
            <b>50+</b>
            Sân Pickleball
          </span>

          <span>
            <b>100+</b>
            HLV chuyên nghiệp
          </span>

          <span>
            <b>10K+</b>
            Người chơi
          </span>

          <span>
            <b>4.8/5</b>
            Đánh giá trung bình
          </span>
        </div>
      </section>
    </>
  );
}