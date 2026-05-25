import Link from "next/link";
import styles from "./HomePage.module.css";

const popularTimes = ["06:00", "07:00", "08:00", "17:00", "18:00", "19:00", "20:00"];

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} />

      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.heroContent}>
            <p className={styles.script}>Play. Connect. Win.</p>
            <h1>
              Đặt sân Pickleball dễ dàng, nhanh chóng <span>và hiện đại</span>
            </h1>
            <p className={styles.desc}>
              Tìm sân trống, đặt Coach, đặt Combo và kết nối người chơi chỉ trong vài bước.
            </p>

            <div className={styles.heroActions}>
              <Link href="/courts" className={styles.primary}>Đặt sân ngay →</Link>
              <Link href="/coaches" className={styles.secondary}>Xem Coach</Link>
            </div>
          </div>

          <div className={styles.heroImage} aria-label="Pickleball court">
            <div className={styles.heroImageText}>
              <strong>PICKLEBALL</strong>
              <span>Play. Connect. Win.</span>
            </div>
          </div>
        </div>

        <form className={styles.searchPanel}>
          <h2>🗓️ Xem lịch & đặt sân</h2>

          <div className={styles.searchGrid}>
            <label>
              <span>Ngày chơi</span>
              <input type="date" />
            </label>

            <label>
              <span>Giờ bắt đầu</span>
              <select defaultValue="">
                <option value="" disabled>Chọn giờ</option>
                {popularTimes.map((time) => <option key={time}>{time}</option>)}
              </select>
            </label>

            <label>
              <span>Thời lượng</span>
              <select defaultValue="1">
                <option value="1">1 giờ</option>
                <option value="2">2 giờ</option>
                <option value="3">3 giờ</option>
                <option value="4">4 giờ</option>
              </select>
            </label>

            <label>
              <span>Loại đặt lịch</span>
              <select defaultValue="all">
                <option value="all">Tất cả</option>
                <option value="court">Đặt sân</option>
                <option value="combo">Combo</option>
              </select>
            </label>

            <Link href="/courts" className={styles.searchButton}>Tìm sân trống 🔍</Link>
          </div>

          <div className={styles.popular}>
            <b>Giờ phổ biến</b>
            {popularTimes.map((time) => <Link href={`/courts?time=${time}`} key={time}>{time}</Link>)}
            <Link href="/courts" className={styles.more}>Xem thêm</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
