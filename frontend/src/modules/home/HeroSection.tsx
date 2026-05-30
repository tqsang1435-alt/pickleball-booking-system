import Link from "next/link";
import styles from "./HomePage.module.css";

export default function HeroSection() {
  return (
    <div className={styles.heroContainer}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.script}>Play. Connect. Win.</p>

            <h1>
              Đặt sân Pickleball dễ dàng,
              <br />
              nhanh chóng <span>và hiện đại</span>
            </h1>

            <p className={styles.desc}>
              Nền tảng đặt sân, đặt Coach và kết nối người chơi hàng đầu tại Việt Nam.
            </p>

            <div className={styles.heroActions}>
              <Link href="/courts" className={styles.primary}>
                🗓 Đặt sân ngay →
              </Link>

              <Link href="/coaches" className={styles.secondary}>
                👤 Tìm Coach
              </Link>
            </div>
          </div>

          <div className={styles.heroImageWrapper}>
            <img src="/images/home.png" alt="Pickleball Court" className={styles.heroImg} />
          </div>
        </div>
      </section>

      <div className={styles.searchPanelWrapper}>
        <form className={styles.searchPanel}>
          <label>
            <span>Ngày chơi</span>
            <button type="button">📅 Chọn ngày</button>
          </label>

          <label>
            <span>Giờ bắt đầu</span>
            <select defaultValue="">
              <option value="" disabled>
                🕘 Chọn giờ
              </option>
              <option>06:00</option>
              <option>07:00</option>
              <option>08:00</option>
              <option>17:00</option>
              <option>18:00</option>
              <option>19:00</option>
              <option>20:00</option>
            </select>
          </label>

          <label>
            <span>Số người</span>
            <select defaultValue="1">
              <option value="1">👥 1 người</option>
              <option value="2">👥 2 người</option>
              <option value="4">👥 4 người</option>
            </select>
          </label>

          <label>
            <span>Loại</span>
            <select defaultValue="all">
              <option value="all">▦ Tất cả</option>
              <option value="court">Đặt sân</option>
              <option value="coach">Đặt Coach</option>
              <option value="combo">Combo</option>
            </select>
          </label>

          <Link href="/courts" className={styles.searchButton}>
            Tìm sân trống 🔍
          </Link>
        </form>
      </div>
    </div>
  );
}