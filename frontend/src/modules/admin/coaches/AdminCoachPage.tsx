"use client";

import { useEffect, useState, useCallback } from "react";
import {
  adminGetAllCoaches,
  adminGetPendingCoaches,
  adminUpdateCoachStatus,
} from "@/services/coachApi";
import { getImageUrl } from "@/utils/image";
import type { Coach, CoachStatus } from "@/types/coach";
import StateBox from "@/components/common/StateBox";
import styles from "./AdminCoachPage.module.css";

type Tab = "pending" | "all";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
  Inactive: "Ngừng hoạt động",
};

const STATUS_CLASS: Record<string, string> = {
  Pending: "statusPending",
  Approved: "statusApproved",
  Rejected: "statusRejected",
  Inactive: "statusInactive",
};

const SKILL_LABELS: Record<string, string> = {
  Beginner: "Mới bắt đầu",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
  Professional: "Chuyên nghiệp",
};

interface Props {
  token: string;
}

export default function AdminCoachPage({ token }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const loadCoaches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data =
        activeTab === "pending"
          ? await adminGetPendingCoaches(token)
          : await adminGetAllCoaches(token);
      setCoaches(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được danh sách Coach"
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, token]);

  useEffect(() => {
    loadCoaches();
  }, [loadCoaches]);

  async function handleStatusChange(coachId: number, status: CoachStatus) {
    const label = STATUS_LABELS[status] || status;
    if (
      !window.confirm(
        `Bạn muốn chuyển trạng thái Coach này sang "${label}"?`
      )
    )
      return;

    try {
      setActioningId(coachId);
      await adminUpdateCoachStatus(token, coachId, status);
      await loadCoaches();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Cập nhật trạng thái thất bại"
      );
    } finally {
      setActioningId(null);
    }
  }

  const filtered = coaches.filter((c) => {
    const text = `${c.FullName} ${c.Email || ""} ${c.Specialization || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>👨‍🏫 Quản lý Coach</h1>
          <p className={styles.pageSub}>
            Xem xét, duyệt và quản lý trạng thái Coach trên hệ thống
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "pending" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          ⏳ Chờ duyệt
        </button>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("all")}
        >
          📋 Tất cả Coach
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Tìm theo tên, email, chuyên môn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Content */}
      {loading ? (
        <StateBox variant="loading" title="Đang tải danh sách Coach" />
      ) : error ? (
        <StateBox
          variant="error"
          title="Không tải được dữ liệu"
          description={error}
        />
      ) : filtered.length === 0 ? (
        <StateBox
          variant="empty"
          title={
            activeTab === "pending"
              ? "Không có Coach nào chờ duyệt"
              : "Không tìm thấy Coach"
          }
        />
      ) : (
        <>
          <p className={styles.count}>Hiển thị {filtered.length} Coach</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Coach</th>
                  <th>Trình độ</th>
                  <th>Kinh nghiệm</th>
                  <th>Học phí/giờ</th>
                  <th>Đánh giá</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((coach) => {
                  const isActioning = actioningId === coach.CoachID;

                  return (
                    <tr key={coach.CoachID}>
                      <td>
                        <div className={styles.coachCell}>
                          <img
                            src={getImageUrl(coach.AvatarURL)}
                            alt={coach.FullName}
                            className={styles.coachAvatar}
                          />
                          <div>
                            <div className={styles.coachName}>
                              {coach.FullName}
                            </div>
                            <div className={styles.coachEmail}>
                              {coach.Email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.skillBadge}>
                          {SKILL_LABELS[coach.SkillLevel ?? ""] ||
                            coach.SkillLevel ||
                            "—"}
                        </span>
                      </td>

                      <td>{coach.ExperienceYears || 0} năm</td>

                      <td>
                        {Number(coach.HourlyRate || 0).toLocaleString("vi-VN")}{" "}
                        đ
                      </td>

                      <td>⭐ {Number(coach.AverageRating || 0).toFixed(1)}</td>

                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[
                              STATUS_CLASS[coach.Status] || "statusPending"
                            ]
                          }`}
                        >
                          {STATUS_LABELS[coach.Status] || coach.Status}
                        </span>
                      </td>

                      <td>
                        <div className={styles.actions}>
                          {coach.Status !== "Approved" && (
                            <button
                              onClick={() =>
                                handleStatusChange(coach.CoachID, "Approved")
                              }
                              disabled={isActioning}
                              className={styles.btnApprove}
                            >
                              {isActioning ? "..." : "✅ Duyệt"}
                            </button>
                          )}

                          {coach.Status !== "Rejected" &&
                            coach.Status !== "Inactive" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(coach.CoachID, "Rejected")
                                }
                                disabled={isActioning}
                                className={styles.btnReject}
                              >
                                {isActioning ? "..." : "❌ Từ chối"}
                              </button>
                            )}

                          {coach.Status === "Approved" && (
                            <button
                              onClick={() =>
                                handleStatusChange(coach.CoachID, "Inactive")
                              }
                              disabled={isActioning}
                              className={styles.btnInactive}
                            >
                              {isActioning ? "..." : "🔴 Vô hiệu"}
                            </button>
                          )}

                          {coach.Status === "Inactive" && (
                            <button
                              onClick={() =>
                                handleStatusChange(coach.CoachID, "Approved")
                              }
                              disabled={isActioning}
                              className={styles.btnApprove}
                            >
                              {isActioning ? "..." : "🟢 Kích hoạt"}
                            </button>
                          )}
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
    </div>
  );
}
