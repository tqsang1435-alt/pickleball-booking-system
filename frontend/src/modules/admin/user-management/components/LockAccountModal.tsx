"use client";

import { useState } from "react";
import type { AdminUserItem } from "@/types/admin-user.types";
import { ModalShell } from "./RoleAssignModal";
import modalStyles from "./Modal.module.css";

interface LockAccountModalProps {
  user: AdminUserItem | null;
  loading: boolean;
  onClose: () => void;
  onLock: (userId: number, reason?: string) => Promise<void>;
  onUnlock: (userId: number) => Promise<void>;
}

export default function LockAccountModal({
  user,
  loading,
  onClose,
  onLock,
  onUnlock,
}: LockAccountModalProps) {
  const [reason, setReason] = useState("");

  if (!user) return null;

  const isLocked = user.status === "Locked";

  return (
    <ModalShell onClose={onClose}>
      <div className={modalStyles.modalHeader}>
        <div>
          <h2 className={modalStyles.modalTitle}>
            {isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
          </h2>
          <p className={modalStyles.modalSub}>{user.fullName} · {user.email}</p>
        </div>
        <button className={modalStyles.closeBtn} onClick={onClose} disabled={loading}>×</button>
      </div>

      <div className={modalStyles.modalBody}>
        {isLocked ? (
          <div className={modalStyles.infoBox}>
            <span className={modalStyles.infoIcon}>✅</span>
            <p>Tài khoản sẽ có thể đăng nhập và sử dụng hệ thống trở lại.</p>
          </div>
        ) : (
          <>
            <div className={modalStyles.warnBox}>
              <span className={modalStyles.warnIcon}>⚠️</span>
              <p>Người dùng sẽ không thể đăng nhập sau khi bị khóa.</p>
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Lý do khóa</label>
              <textarea
                rows={4}
                maxLength={500}
                value={reason}
                disabled={loading}
                onChange={(e) => setReason(e.target.value)}
                className={modalStyles.textarea}
                placeholder="Nhập lý do khóa tài khoản..."
              />
            </div>
          </>
        )}
      </div>

      <div className={modalStyles.modalFooter}>
        <button className={modalStyles.btnCancel} onClick={onClose} disabled={loading}>
          Hủy
        </button>
        {isLocked ? (
          <button
            className={modalStyles.btnPrimary}
            disabled={loading}
            onClick={() => void onUnlock(user.userId)}
          >
            {loading ? "Đang xử lý..." : "Mở khóa"}
          </button>
        ) : (
          <button
            className={modalStyles.btnDanger}
            disabled={loading}
            onClick={() => void onLock(user.userId, reason.trim() || undefined)}
          >
            {loading ? "Đang khóa..." : "Khóa tài khoản"}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
