// frontend/src/app/admin/revenue/page.tsx

"use client";

import RevenueStats from "@/modules/admin/revenue/components/RevenueStats";
import RevenueChart from "@/modules/admin/revenue/components/RevenueChart";
import RevenueFilter from "@/modules/admin/revenue/components/RevenueFilter";
import RevenueServiceBreakdown from "@/modules/admin/revenue/components/RevenueServiceBreakdown";
import RevenueTransactionTable from "@/modules/admin/revenue/components/RevenueTransactionTable";
import { useRevenue } from "@/modules/admin/revenue/hooks/useRevenue";
import styles from "@/modules/admin/revenue/RevenuePage.module.css";

export default function AdminRevenuePage() {
  const {
    data,
    filters,
    loading,
    error,
    applyFilters,
  } = useRevenue();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Revenue dashboard</p>
          <h1 className={styles.title}>Quản lý doanh thu</h1>
          <p className={styles.subtitle}>
            Theo dõi doanh thu đặt sân, thuê coach, combo và giao dịch thanh toán.
          </p>
        </div>
        <span className={styles.headerBadge}>
          Dữ liệu thanh toán
        </span>
      </header>

      <RevenueFilter
        filters={filters}
        loading={loading}
        onApply={applyFilters}
      />

      <RevenueStats
        data={data}
        loading={loading}
        error={error}
      />

      <section className={styles.analyticsGrid}>
        <RevenueChart
          data={data}
          loading={loading}
        />

        <RevenueServiceBreakdown
          data={data}
          loading={loading}
        />
      </section>

      <RevenueTransactionTable
        data={data}
        loading={loading}
      />
    </main>
  );
}
