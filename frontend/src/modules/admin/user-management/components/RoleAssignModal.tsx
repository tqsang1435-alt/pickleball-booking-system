"use client";

import { useEffect, useState } from "react";
import type { AdminUserItem, RoleOption } from "@/types/admin-user.types";
import modalStyles from "./Modal.module.css";

interface RoleAssignModalProps {
  user: AdminUserItem | null;
  roles: RoleOption[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (userId: number, roleIds: number[]) => Promise<void>;
}

export default function RoleAssignModal({
  user,
  roles,
  loading,
  onClose,
  onSubmit,
}: RoleAssignModalProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedRoleIds(user?.roles.map((r) => r.roleId) ?? []);
  }, [user]);

  if (!user) return null;

  function toggleRole(roleId: number) {
    setSelectedRoleIds((cur) =>
      cur.includes(roleId) ? cur.filter((id) => id !== roleId) : [...cur, roleId]
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <div className={modalStyles.modalHeader}>
        <div>
          <h2 className={modalStyles.modalTitle}>Gán quyền</h2>
          <p className={modalStyles.modalSub}>{user.fullName} · {user.email}</p>
        </div>
        <button className={modalStyles.closeBtn} onClick={onClose} disabled={loading}>×</button>
      </div>

      <div className={modalStyles.modalBody}>
        <div className={modalStyles.roleList}>
          {roles.map((role) => (
            <label key={role.roleId} className={modalStyles.roleItem}>
              <input
                type="checkbox"
                className={modalStyles.checkbox}
                checked={selectedRoleIds.includes(role.roleId)}
                disabled={loading}
                onChange={() => toggleRole(role.roleId)}
              />
              <span className={modalStyles.roleLabel}>{role.roleName}</span>
              {selectedRoleIds.includes(role.roleId) && (
                <span className={modalStyles.roleSelected}>✓</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className={modalStyles.modalFooter}>
        <button className={modalStyles.btnCancel} onClick={onClose} disabled={loading}>
          Hủy
        </button>
        <button
          className={modalStyles.btnPrimary}
          disabled={loading || selectedRoleIds.length === 0}
          onClick={() => void onSubmit(user.userId, selectedRoleIds)}
        >
          {loading ? "Đang lưu..." : "Lưu quyền"}
        </button>
      </div>
    </ModalShell>
  );
}

export function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
