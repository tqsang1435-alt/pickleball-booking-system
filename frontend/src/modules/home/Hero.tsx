import styles from "@/styles/Home.module.css";

export default function Hero() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>
            Đặt sân <span>Pickleball</span>
            <br />
            Dễ dàng – Nhanh chóng
          </h1>

          <p>
            Đặt sân, đặt huấn luyện viên và combo chỉ với vài bước.
            Trải nghiệm Pickleball đỉnh cao dành cho bạn!
          </p>

          <div className={styles.bookingBox}>
            <div className={styles.tabs}>
              <button className={styles.activeTab}>Đặt sân</button>
              <button>Đặt HLV</button>
              <button>Combo Sân + HLV</button>
            </div>

            <div className={styles.formGrid}>
              <select>
                <option>Tất cả cơ sở</option>
              </select>

              <input type="date" defaultValue="2026-05-20" />

              <select>
                <option>Chọn thời gian</option>
              </select>

              <select>
                <option>2 người</option>
                <option>4 người</option>
              </select>
            </div>

            <button className={styles.searchBtn}>🔍 Tìm kiếm sân</button>
          </div>
        </div>
      </section>

      

      <section className={styles.why}>
        <h2>Vì sao chọn chúng tôi?</h2>

        <div className={styles.whyGrid}>
          <div>📅 <b>Đặt sân nhanh chóng</b><p>Chọn sân, chọn giờ, đặt ngay chỉ vài giây.</p></div>
          <div>👨‍🏫 <b>Kết nối HLV chất lượng</b><p>Đội ngũ HLV chuyên nghiệp, nhiều kinh nghiệm.</p></div>
          <div>🎁 <b>Combo tiết kiệm</b><p>Sân + HLV giá ưu đãi, tiết kiệm hơn.</p></div>
          <div>👥 <b>Cộng đồng Pickleball</b><p>Kết nối, giao lưu và nâng cao trình độ.</p></div>
          <div>🛡️ <b>An toàn & tin cậy</b><p>Thanh toán bảo mật, hỗ trợ tận tâm.</p></div>
        </div>
      </section>

      
    </>
  );
}