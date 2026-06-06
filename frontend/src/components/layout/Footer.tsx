"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>Pickle<span>Club</span></Link>
          <p>Nền tảng đặt sân Pickleball và kết nối Coach & người chơi hàng đầu tại Việt Nam.</p>
          <div className={styles.socials}>
            <span>f</span><span>ig</span><span>yt</span><span>tt</span>
          </div>
        </div>

        <div>
          <h4>Liên kết nhanh</h4>
          <Link href="/">Trang chủ</Link>
          <Link href="/courts">Sân</Link>
          <Link href="/coaches">Coach</Link>
          <Link href="/combo">Combo</Link>
          <Link href="/matching">Tìm người chơi</Link>
        </div>

        <div>
          <h4>Hỗ trợ</h4>
          <Link href="/guide">Hướng dẫn đặt sân</Link>
          <Link href="/payments">Thanh toán</Link>
          <Link href="/faq">Câu hỏi thường gặp</Link>
          <Link href="/policy">Chính sách bảo mật</Link>
        </div>

        <div>
          <h4>Liên hệ</h4>
          <p>☎ 1900 1234</p>
          <p>✉ support@pickleclub.vn</p>
          <p>⌖ Đà Nẵng, Việt Nam</p>
        </div>
      </div>
    </footer>
  );
}
