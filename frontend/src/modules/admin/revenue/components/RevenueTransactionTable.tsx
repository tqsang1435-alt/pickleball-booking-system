// frontend/src/modules/admin/revenue/components/RevenueTransactionTable.tsx

"use client";

import type {
  RevenueResponse,
  RevenueServiceType,
} from "@/types/revenue.types";
import styles from "../RevenuePage.module.css";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getServiceLabel(type: RevenueServiceType) {
  switch (type) {
    case "Court":
      return "Đặt sân";
    case "Coach":
      return "Thuê Coach";
    case "Combo":
      return "Combo";
    case "Tournament":
      return "Giải đấu";
    default:
      return type;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "Paid":
      return "Đã thanh toán";
    case "Refunded":
      return "Đã hoàn tiền";
    case "Pending":
      return "Đang chờ";
    case "Failed":
      return "Thất bại";
    default:
      return status;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "Paid":
      return `${styles.status} ${styles.statusPaid}`;
    case "Refunded":
      return `${styles.status} ${styles.statusRefunded}`;
    case "Pending":
      return `${styles.status} ${styles.statusPending}`;
    case "Failed":
      return `${styles.status} ${styles.statusFailed}`;
    default:
      return styles.status;
  }
}

interface RevenueTransactionTableProps {
  data: RevenueResponse | null;
  loading: boolean;
}

export default function RevenueTransactionTable({
  data,
  loading,
}: RevenueTransactionTableProps) {
  if (loading) {
    return <div className={styles.loadingText}>Đang tải giao dịch...</div>;
  }

  if (!data || data.transactions.length === 0) {
    return <div className={styles.emptyText}>Không có giao dịch.</div>;
  }

  return (
    <section className={styles.tablePanel}>
      <div className={styles.tableHeader}>
        <h2>
          Giao dịch gần đây
        </h2>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Dịch vụ</th>
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>

          <tbody>
            {data.transactions.map((item) => (
              <tr key={item.id}>
                <td className={styles.customer}>
                  {item.customerName}
                </td>
                <td>
                  {getServiceLabel(item.serviceType)}
                </td>
                <td className={styles.amount}>
                  {formatCurrency(item.amount)}
                </td>
                <td>{item.paymentMethod}</td>
                <td>
                  <span className={getStatusClass(item.status)}>
                    {getStatusLabel(item.status)}
                  </span>
                </td>
                <td>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
