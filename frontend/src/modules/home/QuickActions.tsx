import Link from "next/link";
import styles from "./HomePage.module.css";

const actions = [
  {
    icon: "🎾",
    title: "Đặt sân Pickleball",
    desc: "Tìm sân trống theo thời gian thực và đặt ngay.",
    href: "/courts",
  },
  {
    icon: "👨‍🏫",
    title: "Đặt Coach riêng",
    desc: "Chọn Coach phù hợp với trình độ và mục tiêu của bạn.",
    href: "/coaches",
  },
  {
    icon: "🤝",
    title: "Combo sân + Coach",
    desc: "Tiết kiệm hơn khi đặt sân kèm Coach.",
    href: "/combo",
  },
  {
    icon: "👥",
    title: "Tìm người chơi",
    desc: "Kết nối và tìm người chơi cùng trình độ.",
    href: "/matching",
  },
];

export default function QuickActions() {
  return (
    <section className={styles.actionSection}>
      <div className={styles.actionGrid}>
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={styles.actionCard}
          >
            <div className={styles.actionIcon}>
              {action.icon}
            </div>

            <div className={styles.actionContent}>
              <h3>{action.title}</h3>
              <p>{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}