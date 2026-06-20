// frontend/src/modules/admin/revenue/components/RevenueServiceBreakdown.tsx

"use client";

import type { RevenueResponse } from "@/types/revenue.types";
import styles from "../RevenuePage.module.css";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getServiceLabel(serviceName: string) {
  switch (serviceName) {
    case "Court":
      return "Đặt sân";
    case "Coach":
      return "Thuê Coach";
    case "Combo":
      return "Combo";
    default:
      return serviceName || "Khác";
  }
}

interface RevenueServiceBreakdownProps {
  data: RevenueResponse | null;
  loading: boolean;
}

export default function RevenueServiceBreakdown({
  data,
  loading,
}: RevenueServiceBreakdownProps) {
  if (loading) {
    return <div className={styles.loadingText}>Đang tải doanh thu theo dịch vụ...</div>;
  }

  if (!data || data.serviceRevenue.length === 0) {
    return <div className={styles.emptyText}>Không có dữ liệu doanh thu theo dịch vụ.</div>;
  }

  const total =
    data.serviceRevenue.reduce(
      (sum, item) =>
        sum + item.revenue,
      0
    ) || 1;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Doanh thu theo dịch vụ</h2>
          <p className={styles.panelSubtitle}>Tỷ trọng Court, Coach và Combo</p>
        </div>
      </div>

      <div className={styles.serviceList}>
        {data.serviceRevenue.map((item) => {
          const percent =
            Math.round(
              (item.revenue / total) * 100
            );

          return (
            <div key={item.serviceName} className={styles.serviceRow}>
              <div className={styles.serviceTop}>
                <span className={styles.serviceName}>
                  {getServiceLabel(item.serviceName)}
                </span>
                <span className={styles.serviceValue}>
                  {formatCurrency(item.revenue)}
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{
                    width: `${percent}%`,
                  }}
                />
              </div>
              <p className={styles.servicePercent}>{percent}% tổng doanh thu</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
