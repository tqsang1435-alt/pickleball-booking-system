"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  adminGetAllCoaches,
  adminUpdateCoachStatus,
} from "@/services/coachApi";
import { getImageUrl } from "@/utils/image";
import type { Coach, CoachStatus } from "@/types/coach";
import CoachCreateModal from "./CoachCreateModal";
import StateBox from "@/components/common/StateBox";
import ConfirmModal from "@/modules/staff/shared/ConfirmModal";
import { getUser } from "@/utils/authStorage";
import styles from "./AdminCoachPage.module.css";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Inactive: "Vô hiệu hóa",
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
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // Custom confirm state
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Credentials for Header initials
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    const admin = getUser();
    if (admin) {
      setAdminName(admin.FullName || admin.fullName || "Admin");
      setAdminEmail(admin.Email || admin.email || "admin@pickleclub.vn");
    }
  }, []);

  const loadCoaches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminGetAllCoaches(token);
      setCoaches(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được danh sách Coach"
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCoaches();
  }, [loadCoaches]);

  function handleStatusChange(coachId: number, status: CoachStatus) {
    const label = STATUS_LABELS[status] || status;
    setConfirmConfig({
      title: "Xác nhận đổi trạng thái",
      message: `Bạn muốn chuyển trạng thái Coach này sang "${label}"?`,
      variant: status === "Inactive" || status === "Rejected" ? "warning" : "info",
      onConfirm: () => executeStatusChange(coachId, status),
    });
  }

  async function executeStatusChange(coachId: number, status: CoachStatus) {
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

  const filtered = useMemo(() => {
    return coaches.filter((c) => {
      const text = `${c.FullName} ${c.Email || ""} ${c.Specialization || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [coaches, search]);

  const adminInitials = useMemo(() => {
    const parts = adminName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "AD";
    return parts.map(n => n[0]).join("").slice(0, 2).toUpperCase();
  }, [adminName]);

  return (
    <div className={styles.wrapper}>
      {/* ── Sticky Top Header Bar ── */}
      <header className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumbs}>
            <span>Quản trị</span>
            <span className={styles.chevron}>/</span>
            <span className={styles.currentCrumb}>Quản lý HLV</span>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.searchBar}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, email, chuyên môn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Refresh Page */}
          <button className={styles.btnIcon} onClick={() => loadCoaches()} title="Tải lại dữ liệu">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>

          {/* "+ Tạo Coach" Primary Blue Button */}
          <button className={styles.btnCreate} onClick={() => setIsModalOpen(true)}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Tạo Coach
          </button>

          {/* User Initials Avatar */}
          <div className={styles.avatar} title={`${adminName} (${adminEmail})`}>
            {adminInitials}
          </div>
        </div>
      </header>

      {/* ── Main content area with gray background ── */}
      <div className={styles.contentArea}>
        
        {/* Title area */}
        <div className={styles.titleArea}>
          <div>
            <h1 className={styles.greetTitle}>Quản lý Huấn luyện viên</h1>
            <p className={styles.greetDesc}>Xem xét, duyệt hồ sơ đăng ký và quản lý trạng thái hoạt động của Coach trên hệ thống.</p>
          </div>
          <span className={styles.countBadge}>{filtered.length} HLV</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.skeletonCardGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : error ? (
          <StateBox
            variant="error"
            title="Không tải được dữ liệu"
            description={error}
          />
        ) : filtered.length === 0 ? (
          <StateBox
            variant="empty"
            title="Không tìm thấy Coach nào"
            description="Hãy thử nhập từ khóa khác."
          />
        ) : (
          <div className={styles.coachCardGrid}>
            {filtered.map((coach) => {
              const isActioning = actioningId === coach.CoachID;
              const coverIndex = coach.CoachID % 5;

              return (
                <div key={coach.CoachID} className={styles.coachCard}>
                  {/* Banner cover with color shift */}
                  <div className={`${styles.cardCover} ${styles[`cover_${coverIndex}`]}`}>
                    {/* Avatar wrap overlay */}
                    <div className={styles.coachAvatarWrap}>
                      <img
                        src={getImageUrl(coach.AvatarURL)}
                        alt={coach.FullName}
                        className={styles.coachAvatar}
                        onError={(e) => {
                          e.currentTarget.src = "/images/home/avatar-placeholder.jpg";
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{coach.FullName}</h3>
                      <span className={styles.cardSub}>{coach.Email}</span>
                    </div>

                    <div className={styles.cardInfo}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Trình độ:</span>
                        <span className={styles.infoVal}>
                          {SKILL_LABELS[coach.SkillLevel ?? ""] || coach.SkillLevel || "—"}
                        </span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Kinh nghiệm:</span>
                        <span className={styles.infoVal}>{coach.ExperienceYears || 0} năm</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Học phí/giờ:</span>
                        <span className={styles.priceVal}>
                          {Number(coach.HourlyRate || 0).toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Đánh giá:</span>
                        <div className={styles.ratingRow}>
                          <svg width="14" height="14" fill="#ea580c" viewBox="0 0 24 24" stroke="#ea580c" strokeWidth="1">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                          <span>{Number(coach.AverageRating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardStatusRow}>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[
                            coach.Status === "Pending" ? "statusPending" :
                            coach.Status === "Approved" ? "statusApproved" :
                            coach.Status === "Rejected" ? "statusRejected" : "statusInactive"
                          ]
                        }`}
                      >
                        {STATUS_LABELS[coach.Status] || coach.Status}
                      </span>
                    </div>
                  </div>

                  {/* Card footer actions */}
                  <div className={styles.cardFooter}>
                    {coach.Status !== "Approved" && (
                      <button
                        onClick={() => handleStatusChange(coach.CoachID, "Approved")}
                        disabled={isActioning}
                        className={styles.btnApprove}
                      >
                        {isActioning ? "..." : "Duyệt"}
                      </button>
                    )}

                    {coach.Status !== "Rejected" && coach.Status !== "Inactive" && (
                      <button
                        onClick={() => handleStatusChange(coach.CoachID, "Rejected")}
                        disabled={isActioning}
                        className={styles.btnReject}
                      >
                        {isActioning ? "..." : "Từ chối"}
                      </button>
                    )}

                    {coach.Status === "Approved" && (
                      <button
                        onClick={() => handleStatusChange(coach.CoachID, "Inactive")}
                        disabled={isActioning}
                        className={styles.btnInactive}
                      >
                        {isActioning ? "..." : "Vô hiệu"}
                      </button>
                    )}

                    {coach.Status === "Inactive" && (
                      <button
                        onClick={() => handleStatusChange(coach.CoachID, "Approved")}
                        disabled={isActioning}
                        className={styles.btnApprove}
                      >
                        {isActioning ? "..." : "Kích hoạt"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CoachCreateModal
          token={token}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadCoaches();
          }}
        />
      )}
      {confirmConfig && (
        <ConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={() => {
            confirmConfig.onConfirm();
            setConfirmConfig(null);
          }}
          onCancel={() => setConfirmConfig(null)}
          variant={confirmConfig.variant}
        />
      )}
    </div>
  );
}
