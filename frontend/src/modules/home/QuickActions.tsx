import Link from "next/link";
import styles from "./HomePage.module.css";

const actions = [
  {
    icon: "▱",
    title: "Đặt sân Pickleball",
    desc: "Tìm sân trống theo thời gian thực và đặt ngay.",
    href: "/courts",
    cta: "Tìm sân ngay",
  },
  {
    icon: "♙",
    title: "Đặt Coach riêng",
    desc: "Chọn Coach phù hợp với trình độ và mục tiêu.",
    href: "/coaches",
    cta: "Xem Coach",
  },
  {
    icon: "⚭",
    title: "Combo Sân + Coach",
    desc: "Tiết kiệm hơn khi đặt sân kèm Coach.",
    href: "/combo",
    cta: "Đặt combo",
  },
  {
    icon: "☷",
    title: "Tìm người chơi",
    desc: "Kết nối và tìm người chơi cùng trình độ.",
    href: "/matching",
    cta: "Tìm ngay",
  },
];

export default function QuickActions() {
  return (
    <section className="container">
      <div className={styles.actionGrid}>
        {actions.map((action) => (
          <Link href={action.href} className={styles.actionCard} key={action.title}>
            <div className={styles.actionIcon}>{action.icon}</div>
            <div>
              <h3>{action.title}</h3>
              <p>{action.desc}</p>
              <span>{action.cta} →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
