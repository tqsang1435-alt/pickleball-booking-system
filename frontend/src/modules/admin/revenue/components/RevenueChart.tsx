// frontend/src/modules/admin/revenue/components/RevenueChart.tsx

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { RevenueResponse } from "@/types/revenue.types";
import styles from "../RevenuePage.module.css";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

interface RevenueChartProps {
  data: RevenueResponse | null;
  loading: boolean;
}

export default function RevenueChart({
  data,
  loading,
}: RevenueChartProps) {
  if (loading) {
    return <div className={styles.loadingText}>Đang tải biểu đồ...</div>;
  }

  if (!data || data.chart.length === 0) {
    return <div className={styles.emptyText}>Không có dữ liệu biểu đồ.</div>;
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Doanh thu theo ngày</h2>
          <p className={styles.panelSubtitle}>Tổng tiền thanh toán thành công theo từng ngày</p>
        </div>
      </div>

      <div className={styles.chartBox}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.chart}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#64748b" />
            <YAxis tickFormatter={formatCurrency} tickLine={false} axisLine={false} stroke="#64748b" />
            <Tooltip
              formatter={(value) => [
                `${formatCurrency(Number(value))} VND`,
                "Doanh thu",
              ]}
              contentStyle={{
                border: "1px solid #cbd5e1",
                borderRadius: 10,
              }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
