import React from 'react';
import type { BookingStatus } from '@/types/staff.types';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: BookingStatus | string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  Confirmed: { label: 'Đã xác nhận', className: 'confirmed' },
  CheckedIn: { label: 'Đã check-in', className: 'checkedIn' },
  Completed: { label: 'Hoàn thành', className: 'completed' },
  Cancelled: { label: 'Đã hủy', className: 'cancelled' },
  PendingPayment: { label: 'Chờ thanh toán', className: 'pending' },
  NoShow: { label: 'Vắng mặt', className: 'noShow' },
  Refunded: { label: 'Đã hoàn tiền', className: 'refunded' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'default' };
  return (
    <span className={`${styles.badge} ${styles[config.className] ?? styles.default}`}>
      {config.label}
    </span>
  );
}
