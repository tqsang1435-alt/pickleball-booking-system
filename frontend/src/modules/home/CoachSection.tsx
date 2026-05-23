"use client";
import styles from "@/styles/Home.module.css";

const coaches = [
  { name: "Minh Anh", rating: "4.9", exp: "5 năm kinh nghiệm", price: "300.000đ/giờ" },
  { name: "Hoàng Nam", rating: "4.8", exp: "4 năm kinh nghiệm", price: "280.000đ/giờ" },
  { name: "Thanh Trúc", rating: "4.9", exp: "3 năm kinh nghiệm", price: "250.000đ/giờ" },
  { name: "Đức Phát", rating: "4.7", exp: "6 năm kinh nghiệm", price: "350.000đ/giờ" },
];

export default function CoachSection() {
  return (
    <section className={styles.cardSection}>
      <div className={styles.sectionTitle}>
        <h2>Huấn luyện viên nổi bật</h2>
        <a>Xem tất cả ›</a>
      </div>

      <div className={styles.coachGrid}>
        {coaches.map((coach, index) => (
          <article className={styles.coachCard} key={coach.name}>
            <div className={styles.avatar}>{coach.name.charAt(0)}</div>
            <h3>{coach.name}</h3>
            <p>⭐ {coach.rating}</p>
            <span>{coach.exp}</span>
            <strong>{coach.price}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}