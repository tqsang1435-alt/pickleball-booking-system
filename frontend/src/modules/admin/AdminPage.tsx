import styles from "./AdminPage.module.css";

export default function AdminPage() {
  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p>Xin chào, Admin 👋</p>
          <h1>Quản trị hệ thống</h1>
          <span>
            Quản lý toàn bộ vận hành: sân, coach, doanh thu,
            khuyến mãi, chính sách hủy, phân quyền và bảo trì.
          </span>
        </div>

        <button>Hôm nay</button>
      </section>

      <section className={styles.stats}>
        <div className={styles.card}>
          <span>💰</span>
          <h2>45.250.000 đ</h2>
          <p>Doanh thu hôm nay</p>
        </div>

        <div className={styles.card}>
          <span>📅</span>
          <h2>128</h2>
          <p>Lượt đặt sân</p>
        </div>

        <div className={styles.card}>
          <span>🎾</span>
          <h2>6</h2>
          <p>Sân đang hoạt động</p>
        </div>

        <div className={styles.card}>
          <span>👨‍🏫</span>
          <h2>12</h2>
          <p>Coach đang hoạt động</p>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Lịch đặt sân hôm nay</h2>
            <button>Xem chi tiết</button>
          </div>

          <div className={styles.schedule}>
            {["Sân 01", "Sân 02", "Sân 03", "Sân 04"].map((court, index) => (
              <div className={styles.row} key={court}>
                <strong>{court}</strong>

                <div className={styles.timeline}>
                  <span />
                  <span className={index % 2 === 0 ? styles.active : ""} />
                  <span />
                  <span className={styles.active} />
                  <span />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <h2>Chức năng nhanh</h2>

          <div className={styles.quick}>
            <button>Thêm sân</button>
            <button>Tạo combo</button>
            <button>Thêm khuyến mãi</button>
            <button>Bảo trì sân</button>
            <button>Quản lý coach</button>
            <button>Phân quyền</button>
          </div>
        </div>

        <div className={styles.panel}>
          <h2>Đơn đặt mới nhất</h2>

          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khách</th>
                <th>Sân</th>
                <th>Giờ</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>#BK001</td>
                <td>Nguyễn Tuấn Anh</td>
                <td>Sân 01</td>
                <td>18:00</td>
                <td>Đã xác nhận</td>
              </tr>

              <tr>
                <td>#BK002</td>
                <td>Lê Minh Anh</td>
                <td>Sân 03</td>
                <td>19:00</td>
                <td>Chờ xác nhận</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.panel}>
          <h2>Trạng thái vận hành</h2>

          <div className={styles.statusList}>
            <p>Sân hoạt động <strong>6/6</strong></p>
            <p>Coach hoạt động <strong>12</strong></p>
            <p>Combo đang bán <strong>4</strong></p>
            <p>Khuyến mãi đang chạy <strong>3</strong></p>
          </div>
        </div>
      </section>
    </main>
  );
}