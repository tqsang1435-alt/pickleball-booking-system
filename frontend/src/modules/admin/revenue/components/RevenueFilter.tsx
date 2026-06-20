// frontend/src/modules/admin/revenue/components/RevenueFilter.tsx

"use client";

import {
  FormEvent,
  useState,
} from "react";
import type {
  RevenueFilterParams,
  RevenueServiceType,
} from "@/types/revenue.types";
import styles from "../RevenuePage.module.css";

interface RevenueFilterProps {
  filters: RevenueFilterParams;
  loading: boolean;
  onApply: (
    filters: RevenueFilterParams
  ) => void | Promise<void>;
}

export default function RevenueFilter({
  filters,
  loading,
  onApply,
}: RevenueFilterProps) {
  const [
    fromDate,
    setFromDate,
  ] = useState(
    filters.fromDate ?? ""
  );
  const [
    toDate,
    setToDate,
  ] = useState(
    filters.toDate ?? ""
  );
  const [
    serviceType,
    setServiceType,
  ] = useState<
    RevenueServiceType | ""
  >(filters.serviceType ?? "");

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    void onApply({
      fromDate:
        fromDate || undefined,
      toDate:
        toDate || undefined,
      serviceType:
        serviceType || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.filterCard}
    >
      <div className={styles.filterGrid}>
        <div className={styles.field}>
          <label>
            Từ ngày
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(event) =>
              setFromDate(
                event.target.value
              )
            }
          />
        </div>

        <div className={styles.field}>
          <label>
            Đến ngày
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(event) =>
              setToDate(
                event.target.value
              )
            }
          />
        </div>

        <div className={styles.field}>
          <label>
            Loại dịch vụ
          </label>
          <select
            value={serviceType}
            onChange={(event) =>
              setServiceType(
                event.target.value as
                  | RevenueServiceType
                  | ""
              )
            }
          >
            <option value="">Tất cả</option>
            <option value="Court">Đặt sân</option>
            <option value="Coach">Thuê Coach</option>
            <option value="Combo">Combo</option>
          </select>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={styles.filterButton}
          >
            {loading
              ? "Đang lọc..."
              : "Lọc doanh thu"}
          </button>
        </div>
      </div>
    </form>
  );
}
