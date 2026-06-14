import type { UpcomingBooking } from "@/types/staff.types";
import styles from "./PendingCheckInMonitor.module.css";

interface PendingCheckInMonitorProps {
  bookings: UpcomingBooking[];
  onCheckIn: (bookingId: number) => void;
  loading: boolean;
}

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function PendingCheckInMonitor({ bookings, onCheckIn, loading }: PendingCheckInMonitorProps) {
  const isAlert = bookings.length >= 3;

  if (loading) return null;
  if (bookings.length === 0) return null;

  return (
    <div className={`${styles.wrapper} ${isAlert ? styles.alert : ""}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {isAlert && <span className={styles.alertIcon}><AlertIcon /></span>}
          <h3 className={styles.heading}>
            Chờ check-in
            <span className={styles.badge}>{bookings.length}</span>
          </h3>
        </div>
        <p className={styles.hint}>Khách đang trong cửa sổ check-in (±15 phút)</p>
      </div>

      <div className={styles.list}>
        {bookings.map((b) => (
          <div key={b.bookingId} className={styles.row}>
            <div className={styles.info}>
              <span className={styles.code}>{b.bookingCode}</span>
              <span className={styles.customer}>{b.customerName}</span>
              <span className={styles.court}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                </svg>
                {b.courtName}
              </span>
              <span className={styles.time}>{b.startTime} – {b.endTime}</span>
            </div>
            <button
              className={styles.checkInBtn}
              onClick={() => onCheckIn(b.bookingId)}
            >
              Check-in
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
