import type { BookingFilters } from "@/types/staff.types";
import styles from "./BookingFilters.module.css";

interface BookingFiltersProps {
  filters: BookingFilters;
  onChange: (f: BookingFilters) => void;
  totalCount: number;
  loading: boolean;
}

const STATUS_OPTIONS = [
  { value: "All", label: "Tất cả" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "CheckedIn", label: "Đã check-in" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
  { value: "NoShow", label: "Vắng mặt" },
];

function getDateRange() {
  const now = new Date();
  const min = new Date(now);
  min.setDate(min.getDate() - 90);
  const max = new Date(now);
  max.setDate(max.getDate() + 90);
  const fmt = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  return { min: fmt(min), max: fmt(max) };
}

export default function BookingFiltersBar({ filters, onChange, totalCount, loading }: BookingFiltersProps) {
  const { min, max } = getDateRange();

  return (
    <div className={styles.bar}>
      <div className={styles.inputs}>
        <input
          type="date"
          className={styles.dateInput}
          value={filters.date}
          min={min}
          max={max}
          onChange={(e) => onChange({ ...filters, date: e.target.value })}
        />

        <select
          className={styles.select}
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as BookingFilters["status"] })}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Mã booking, tên, SĐT, tên sân..."
            value={filters.searchText}
            onChange={(e) => onChange({ ...filters, searchText: e.target.value })}
          />
          {filters.searchText && (
            <button className={styles.clearBtn} onClick={() => onChange({ ...filters, searchText: "" })}>×</button>
          )}
        </div>
      </div>

      {!loading && (
        <span className={styles.countBadge}>{totalCount} booking</span>
      )}
    </div>
  );
}
