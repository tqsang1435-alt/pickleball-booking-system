"use client";

import { useEffect, useState, useCallback } from "react";
import { adminGetAllStaff } from "@/services/userApi";
import { getImageUrl } from "@/utils/image";
import StateBox from "@/components/common/StateBox";
import StaffCreateModal from "./StaffCreateModal";
import styles from "./AdminStaffPage.module.css";

interface Props {
  token: string;
}

const ROLE_LABELS: Record<string, string> = {
  Admin: "Quản trị viên",
  Staff: "Nhân viên",
  Coach: "Huấn luyện viên",
  Player: "Người chơi",
};

export default function AdminStaffPage({ token }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminGetAllStaff(token);
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được danh sách staff"
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const text = `${u.FullName} ${u.Email || ""} ${u.Roles || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>👥 Quản lý Staff</h1>
          <p className={styles.pageSub}>
            Quản lý tài khoản nhân viên (Staff) trên hệ thống
          </p>
        </div>
        <button className={styles.btnCreate} onClick={() => setIsModalOpen(true)}>
          + Tạo Staff
        </button>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Tìm theo tên, email, vai trò..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <StateBox variant="loading" title="Đang tải danh sách người dùng" />
      ) : error ? (
        <StateBox
          variant="error"
          title="Không tải được dữ liệu"
          description={error}
        />
      ) : filtered.length === 0 ? (
        <StateBox
          variant="empty"
          title="Không tìm thấy người dùng"
        />
      ) : (
        <>
          <p className={styles.count}>Hiển thị {filtered.length} Người dùng</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const roles = (user.Roles || "").split(",").map((r: string) => r.trim());

                  return (
                    <tr key={user.UserID}>
                      <td>
                        <div className={styles.coachCell}>
                          <img
                            src={getImageUrl(user.AvatarURL)}
                            alt={user.FullName}
                            className={styles.coachAvatar}
                          />
                          <div>
                            <div className={styles.coachName}>
                              {user.FullName}
                            </div>
                            <div className={styles.coachEmail}>
                              {user.Email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>{user.PhoneNumber || "—"}</td>

                      <td>
                        {roles.map((r: string) => (
                          <span key={r} className={styles.skillBadge} style={{ marginRight: '4px' }}>
                            {ROLE_LABELS[r] || r}
                          </span>
                        ))}
                      </td>

                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            user.Status === "Active" ? styles.statusApproved : styles.statusInactive
                          }`}
                        >
                          {user.Status === "Active" ? "Hoạt động" : (user.Status === "Inactive" ? "Ngừng hoạt động" : "Bị khóa")}
                        </span>
                      </td>

                      <td>
                        <div className={styles.actions}>
                          {/* Nút thao tác khoá/mở khoá (sẽ được tích hợp sau nếu cần) */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isModalOpen && (
        <StaffCreateModal
          token={token}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}
