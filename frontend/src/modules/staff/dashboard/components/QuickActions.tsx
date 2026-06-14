"use client";

import { useRouter } from "next/navigation";
import styles from "./QuickActions.module.css";

interface QuickActionItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  colorClass: string;
}

const CheckInIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const WalkInIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="2" />
    <path d="M6 20l1-6 3 3 2-7" />
    <path d="M16 8l2 2-4 3" />
    <circle cx="18" cy="6" r="1.5" />
  </svg>
);

const CourtStatusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ACTIONS: QuickActionItem[] = [
  {
    icon: <CheckInIcon />,
    title: "Bắt đầu Check-in",
    subtitle: "Xem và xử lý khách đến sân",
    href: "/staff/operations",
    colorClass: "blue",
  },
  {
    icon: <SearchIcon />,
    title: "Tra cứu lịch đặt sân",
    subtitle: "Tìm theo ngày, mã, tên, SĐT",
    href: "/staff/operations",
    colorClass: "teal",
  },
  {
    icon: <WalkInIcon />,
    title: "Đặt sân trực tiếp",
    subtitle: "Tạo booking tại quầy cho khách vãng lai",
    href: "/staff/walk-in-booking",
    colorClass: "purple",
  },
  {
    icon: <CourtStatusIcon />,
    title: "Tình trạng sân",
    subtitle: "Theo dõi sân đang sử dụng trong ca",
    href: "/staff/courts",
    colorClass: "green",
  },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>Chức năng nhanh</h3>
      <div className={styles.list}>
        {ACTIONS.map((action) => (
          <button
            key={action.href + action.title}
            className={`${styles.card} ${styles[action.colorClass]}`}
            onClick={() => router.push(action.href)}
          >
            <div className={`${styles.iconWrap} ${styles[`icon_${action.colorClass}`]}`}>
              {action.icon}
            </div>
            <div className={styles.text}>
              <span className={styles.title}>{action.title}</span>
              <span className={styles.subtitle}>{action.subtitle}</span>
            </div>
            <div className={styles.arrow}>
              <ArrowRight />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
