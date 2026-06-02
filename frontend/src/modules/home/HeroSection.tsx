import Link from "next/link";
import styles from "./HomePage.module.css";

export default function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroCard}>
        <div className={styles.heroContent}>
          <p className={styles.script}>Play. Connect. Win.</p>

          <h1>
            Đặt sân <span>Pickleball</span>
            <br />
            nhanh chóng, dễ dàng
          </h1>

          <p className={styles.desc}>
            Kết nối cộng đồng Pickleball, trải nghiệm những khoảnh khắc thể thao
            tuyệt vời cùng Pickle Club.
          </p>

          <div className={styles.heroActions}>
            <Link href="/courts" className={styles.primary}>
              Đặt sân ngay →
            </Link>

            <Link href="/coaches" className={styles.secondary}>
              Tìm Coach
            </Link>
          </div>

          <div className={styles.heroUsers}>
            <div className={styles.userAvatars}>
              <span>VA</span>
              <span>HL</span>
              <span>MK</span>
              <span>+</span>
            </div>
            <p>
              <strong>10K+</strong> người chơi đã tham gia cùng Pickle Club
            </p>
          </div>
        </div>

        <div className={styles.heroImageWrapper}>
          <img
            src="/images/home.png"
            alt="Pickleball players"
            className={styles.heroImg}
          />
        </div>
      </div>
    </section>
  );
}
