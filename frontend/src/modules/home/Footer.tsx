import styles from "@/styles/Home.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div>
        <h2>🏓 PickleBall</h2>
        <p>Nền tảng đặt sân Pickleball và kết nối huấn luyện viên hàng đầu Việt Nam.</p>
      </div>

      <div>
        <h3>Khám phá</h3>
        <p>Sân Pickleball</p>
        <p>Huấn luyện viên</p>
        <p>Combo ưu đãi</p>
        <p>Tìm người chơi</p>
      </div>

      <div>
        <h3>Hỗ trợ</h3>
        <p>Hướng dẫn đặt sân</p>
        <p>Câu hỏi thường gặp</p>
        <p>Chính sách thanh toán</p>
        <p>Liên hệ</p>
      </div>

      <div>
        <h3>Về chúng tôi</h3>
        <p>Giới thiệu</p>
        <p>Điều khoản sử dụng</p>
        <p>Chính sách bảo mật</p>
        <p>Blog</p>
      </div>
    </footer>
  );
}