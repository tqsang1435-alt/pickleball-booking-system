"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { getAdminPromotions, updatePromotionStatus } from "@/services/promotionApi";
import type { AdminPromotion } from "@/types/promotion";
import { getToken } from "@/utils/authStorage";
import styles from "./PromotionList.module.css";

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AdminPromotion["Status"] }) {
  const cls =
    status === "Active"
      ? styles.statusActive
      : status === "Inactive"
      ? styles.statusInactive
      : status === "Expired"
      ? styles.statusExpired
      : styles.statusInactive;

  const label =
    status === "Active"
      ? "Đang hoạt động"
      : status === "Inactive"
      ? "Tạm dừng"
      : "Đã hết hạn";

  return <span className={cls}>{label}</span>;
}

// ── Action Dropdown ───────────────────────────────────────────────────────────
function ActionMenu({
  promo,
  onToggle,
}: {
  promo: AdminPromotion;
  onToggle: (p: AdminPromotion) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        className={styles.btnIcon}
        onClick={() => setOpen((v) => !v)}
        title="Thêm tùy chọn"
      >
        ⋮
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            background: "white",
            border: "1px solid var(--pcs-neutral-200)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 50,
            minWidth: "160px",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => {
              onToggle(promo);
              setOpen(false);
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 16px",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: promo.Status === "Active" ? "var(--pcs-status-error)" : "var(--pcs-status-success)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--pcs-neutral-100)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "none")
            }
          >
            {promo.Status === "Active" ? "🔒 Khóa voucher" : "🔓 Kích hoạt lại"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page Component ────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function AdminPromotionsPage() {
  const [allPromotions, setAllPromotions] = useState<AdminPromotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters (applied on API call)
  const [statusFilter, setStatusFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  // Search (local, applied client-side for instant feedback)
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    if (!token) return;
    try {
      const data = await getAdminPromotions(token, {
        status: statusFilter || undefined,
        applyScope: scopeFilter || undefined,
      });
      setAllPromotions(data);
      setPage(1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, scopeFilter]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  async function handleToggleStatus(promo: AdminPromotion) {
    if (!confirm(`Bạn có chắc muốn đổi trạng thái voucher ${promo.PromotionCode}?`)) return;
    const newStatus = promo.Status === "Active" ? "Inactive" : "Active";
    const token = getToken();
    if (!token) return;
    try {
      await updatePromotionStatus(token, promo.PromotionID, newStatus);
      await loadPromotions();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Lỗi cập nhật trạng thái");
    }
  }

  function handleReset() {
    setStatusFilter("");
    setScopeFilter("");
    setSearchQuery("");
    setPage(1);
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filtered = allPromotions.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.PromotionCode.toLowerCase().includes(q) ||
      p.PromotionName.toLowerCase().includes(q)
    );
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  const stats = {
    total: allPromotions.length,
    active: allPromotions.filter((p) => p.Status === "Active").length,
    expired: allPromotions.filter((p) => p.Status === "Expired").length,
  };

  // ── Pagination helpers ────────────────────────────────────────────────────────
  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (safePage > 3) pages.push("...");
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
      pages.push(i);
    }
    if (safePage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <a href="/admin">Trang chủ</a>
            <span>›</span>
            <span>Khuyến mãi</span>
          </div>
          <h1 className={styles.title}>Quản lý Khuyến mãi / Voucher</h1>
        </div>
        <Link href="/admin/promotions/create" className={styles.btnCreate}>
          <span>＋</span> Tạo Voucher mới
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.purple}`}>🎟️</div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Tổng voucher</span>
            <span className={styles.statValue}>{loading ? "—" : stats.total}</span>
            <span className={styles.statSubtext}>Tất cả voucher trong hệ thống</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.green}`}>✅</div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Đang hoạt động</span>
            <span className={styles.statValue}>{loading ? "—" : stats.active}</span>
            <span className={styles.statSubtext}>Voucher hiện đang có hiệu lực</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.orange}`}>⏰</div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Đã hết hạn</span>
            <span className={styles.statValue}>{loading ? "—" : stats.expired}</span>
            <span className={styles.statSubtext}>Voucher đã quá ngày kết thúc</span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className={styles.filterBar}>
        {/* Search */}
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Tìm mã hoặc tên voucher..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.selectInput}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Đang hoạt động</option>
          <option value="Inactive">Tạm dừng</option>
          <option value="Expired">Đã hết hạn</option>
        </select>

        {/* Scope filter */}
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className={styles.selectInput}
        >
          <option value="">Tất cả phạm vi</option>
          <option value="Public">Công khai (Public)</option>
          <option value="Private">Cá nhân (Private)</option>
        </select>

        {/* Reset */}
        <button className={styles.btnReset} onClick={handleReset}>
          🔄 Làm mới
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "48px",
            textAlign: "center",
            color: "var(--pcs-neutral-500)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            border: "1px solid var(--pcs-neutral-100)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
          <p style={{ margin: 0 }}>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Tên Khuyến mãi</th>
                <th>Loại / Giá trị</th>
                <th>Phạm vi</th>
                <th>Đã dùng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.PromotionID}>
                  <td className={styles.codeCell}>{p.PromotionCode}</td>
                  <td className={styles.nameCell}>{p.PromotionName}</td>
                  <td>
                    {p.DiscountType === "Percent"
                      ? `${p.DiscountValue}%`
                      : `${p.DiscountValue.toLocaleString("vi-VN")}đ`}
                  </td>
                  <td>
                    <span className={p.ApplyScope === "Public" ? styles.badgePublic : styles.badgePrivate}>
                      {p.ApplyScope === "Public" ? "Công khai" : "Cá nhân"}
                    </span>
                  </td>
                  <td>
                    {p.UsedCount}
                    {p.UsageLimit ? ` / ${p.UsageLimit}` : " / ∞"}
                  </td>
                  <td>
                    <StatusBadge status={p.Status} />
                  </td>
                  <td>
                    <div className={styles.actionLinks}>
                      <Link href={`/admin/promotions/${p.PromotionID}`} className={styles.btnText}>
                        Chi tiết
                      </Link>
                      <Link href={`/admin/promotions/${p.PromotionID}/edit`} className={styles.btnText} style={{ color: "var(--pcs-status-info)" }}>
                        Sửa
                      </Link>
                      <ActionMenu promo={p} onToggle={handleToggleStatus} />
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🎟️</div>
                    <p style={{ margin: 0 }}>Không tìm thấy voucher nào</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ── Pagination ── */}
          {totalItems > 0 && (
            <div className={styles.paginationBar}>
              <span className={styles.pageInfo}>
                Hiển thị {startIdx + 1}–{Math.min(startIdx + pageSize, totalItems)} của{" "}
                {totalItems} kết quả
              </span>

              <div className={styles.pageControls}>
                {/* Page size selector */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className={styles.pageSizeSelect}
                >
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s} / trang
                    </option>
                  ))}
                </select>

                {/* Page buttons */}
                <div className={styles.pageButtons}>
                  <button
                    className={styles.pageBtn}
                    disabled={safePage === 1}
                    onClick={() => setPage(safePage - 1)}
                  >
                    ‹
                  </button>
                  {getPageNumbers().map((pg, idx) =>
                    pg === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "0 4px",
                          color: "var(--pcs-neutral-400)",
                        }}
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={pg}
                        className={`${styles.pageBtn} ${pg === safePage ? styles.active : ""}`}
                        onClick={() => setPage(pg as number)}
                      >
                        {pg}
                      </button>
                    )
                  )}
                  <button
                    className={styles.pageBtn}
                    disabled={safePage === totalPages}
                    onClick={() => setPage(safePage + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
