"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getCourts, getCourtSlots, type CourtSlot } from "@/services/courtApi";
import type { Court } from "@/types/court";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import styles from "./CourtsPage.module.css";

const AUTO_REFRESH_SEC = 30;

// Trả về ngày hôm nay theo múi giờ Việt Nam, format YYYY-MM-DD
function todayVN() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

// ─────────────────────────────────────────────────────────────
// UC-12: Drawer xem lịch sân dành cho Player (Read-only)
// ─────────────────────────────────────────────────────────────
function CourtScheduleDrawer({
  court,
  onClose,
}: {
  court: Court;
  onClose: () => void;
}) {
  const [date, setDate] = useState(todayVN());
  const [slots, setSlots] = useState<CourtSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SEC);

  const loadSlots = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const data = await getCourtSlots(court.CourtID, date);
        setSlots(data);
      } catch {
        if (!silent) setSlots([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [court.CourtID, date]
  );

  // Load lại khi đổi ngày
  useEffect(() => {
    loadSlots();
    setCountdown(AUTO_REFRESH_SEC);
  }, [loadSlots]);

  // Auto-refresh mỗi 30 giây
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadSlots(true);
          return AUTO_REFRESH_SEC;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [loadSlots]);

  // Lọc bỏ slot đã xóa mềm
  const visibleSlots = slots.filter((s) => s.Status !== "Cancelled");

  function getSlotClass(status: string) {
    if (status === "Available") return styles.slotAvailable;
    if (status === "Booked" || status === "Holding") return styles.slotBooked;
    return styles.slotBlocked; // Blocked, Maintenance
  }

  function getSlotLabel(status: string) {
    const map: Record<string, string> = {
      Available:   "Còn trống",
      Blocked:     "Đã khóa",
      Booked:      "Đã đặt",
      Holding:     "Đang giữ chỗ",
      Maintenance: "Bảo trì",
    };
    return map[status] ?? status;
  }

  function handleBookSlot(slot: CourtSlot) {
    alert(
      `Chức năng đặt sân sẽ sớm ra mắt! 🎾\n\n` +
      `Sân: ${court.CourtName}\n` +
      `Ngày: ${date}\n` +
      `Giờ: ${slot.StartTime} – ${slot.EndTime}\n` +
      `Giá: ${formatCurrency(slot.Price)}`
    );
  }

  const availableCount = visibleSlots.filter((s) => s.Status === "Available").length;

  return (
    <div className={styles.scheduleOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.schedulePanel}>

        {/* Header */}
        <div className={styles.schedulePanelHeader}>
          <div className={styles.schedulePanelInfo}>
            <h2 className={styles.schedulePanelTitle}>{court.CourtName}</h2>
            <p className={styles.schedulePanelSub}>
              {court.CourtCode} · {court.CourtType === "Indoor" ? "Trong nhà" : "Ngoài trời"} · ⏱ {court.OpenTime}–{court.CloseTime}
            </p>
          </div>
          <div className={styles.scheduleHeaderRight}>
            <span className={styles.scheduleRefreshBadge} title="Tự động làm mới">
              🔄 {countdown}s
            </span>
            <button onClick={onClose} className={styles.scheduleCloseBtn}>×</button>
          </div>
        </div>

        {/* Date picker + summary */}
        <div className={styles.scheduleDateRow}>
          <div className={styles.scheduleDateLeft}>
            <label className={styles.scheduleDateLabel}>📅 Chọn ngày xem lịch:</label>
            <input
              type="date"
              value={date}
              min={todayVN()}
              onChange={(e) => setDate(e.target.value)}
              className={styles.scheduleDateInput}
            />
          </div>
          {!loading && visibleSlots.length > 0 && (
            <div className={styles.scheduleAvailCount}>
              <span>{availableCount}</span>
              <small>slot còn trống</small>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className={styles.scheduleLegend}>
          <span className={styles.legendItem}>
            <i className={styles.dotAvailable} /> Còn trống
          </span>
          <span className={styles.legendItem}>
            <i className={styles.dotBooked} /> Đã đặt / Đang giữ
          </span>
          <span className={styles.legendItem}>
            <i className={styles.dotBlocked} /> Không khả dụng
          </span>
        </div>

        {/* Slot grid */}
        <div className={styles.scheduleSlotList}>
          {loading ? (
            <div className={styles.scheduleEmpty}>
              <span className={styles.scheduleEmptyIcon}>⏳</span>
              <p>Đang tải lịch sân...</p>
            </div>
          ) : visibleSlots.length === 0 ? (
            <div className={styles.scheduleEmpty}>
              <span className={styles.scheduleEmptyIcon}>📭</span>
              <p>Chưa có lịch sân trong ngày này.</p>
              <small>Quản trị viên sẽ sớm mở slot cho ngày bạn chọn.</small>
            </div>
          ) : (
            <div className={styles.slotGrid}>
              {visibleSlots.map((slot) => {
                const isAvailable = slot.Status === "Available";
                return (
                  <div
                    key={slot.SlotID}
                    className={`${styles.slotCard} ${getSlotClass(slot.Status)}`}
                  >
                    <div className={styles.slotCardTime}>
                      {slot.StartTime} – {slot.EndTime}
                    </div>
                    <div className={styles.slotCardPrice}>
                      {formatCurrency(slot.Price)}
                    </div>
                    <div className={styles.slotCardStatusLabel}>
                      {getSlotLabel(slot.Status)}
                    </div>
                    {isAvailable && (
                      <button
                        className={styles.slotBookBtn}
                        onClick={() => handleBookSlot(slot)}
                      >
                        Đặt sân →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className={styles.scheduleFooter}>
          <p className={styles.scheduleFooterNote}>
            💡 Giá hiển thị là giá mỗi slot. Nhấn <strong>Đặt sân</strong> trên slot còn trống để tiến hành đặt lịch.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Trang danh sách sân — Player
// ─────────────────────────────────────────────────────────────
export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [type, setType] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UC-12: Drawer lịch sân
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCourts() {
      try {
        setLoading(true);
        setError("");
        const data = await getCourts();
        if (mounted) setCourts(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Không tải được sân.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCourts();
    return () => { mounted = false; };
  }, []);

  const filteredCourts = useMemo(() => {
    return courts.filter((court) => {
      const matchType = type === "all" || court.CourtType === type;
      const searchText = [court.CourtName, court.CourtCode, court.Location, court.Description, court.CourtType]
        .filter(Boolean).join(" ").toLowerCase();
      return matchType && searchText.includes(keyword.toLowerCase());
    });
  }, [courts, keyword, type]);

  function resetFilter() { setKeyword(""); setType("all"); }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.badge}>Find your perfect court</span>
              <h1>
                Chọn sân phù hợp <span>đặt lịch nhanh chóng</span>
              </h1>
              <p>
                Xem danh sách sân Pickleball, kiểm tra thông tin giá thuê,
                giờ hoạt động và đặt lịch chỉ trong vài bước.
              </p>
              <div className={styles.searchBox}>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo tên sân, khu vực, loại sân..."
                />
                <button type="button">🔍</button>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroImage}>
                <img src="/images/courts/san1.png" alt="Pickleball court" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`container ${styles.filterPanel}`}>
        <label>
          <span>Loại sân</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="Indoor">Sân trong nhà</option>
            <option value="Outdoor">Sân ngoài trời</option>
          </select>
        </label>
        <label>
          <span>Trạng thái</span>
          <select defaultValue="Available">
            <option value="Available">Còn trống</option>
            <option value="Maintenance">Bảo trì</option>
          </select>
        </label>
        <label>
          <span>Sắp xếp</span>
          <select defaultValue="popular">
            <option value="popular">Phổ biến nhất</option>
            <option value="priceAsc">Giá thấp đến cao</option>
            <option value="priceDesc">Giá cao đến thấp</option>
          </select>
        </label>
        <button type="button" onClick={resetFilter}>Bộ lọc</button>
      </section>

      <section className={`container ${styles.content}`}>
        <div className={styles.resultHeader}>
          <div>
            <h2>Danh sách sân</h2>
            <p>Hiển thị <strong>{filteredCourts.length}</strong> sân phù hợp</p>
          </div>
        </div>

        {loading ? (
          <StateBox variant="loading" title="Đang tải sân" description="Đang lấy dữ liệu sân từ backend." />
        ) : error ? (
          <StateBox variant="error" title="Không tải được dữ liệu" description={error} />
        ) : courts.length === 0 ? (
          <StateBox variant="empty" title="Chưa có sân nào trên hệ thống" description="Hệ thống hiện tại chưa có dữ liệu sân." />
        ) : filteredCourts.length === 0 ? (
          <StateBox variant="empty" title="Không có sân phù hợp" description="Bạn thử đổi bộ lọc hoặc từ khóa tìm kiếm." />
        ) : (
          <div className={styles.grid}>
            {filteredCourts.map((court) => (
              <article className={styles.card} key={court.CourtID}>
                <div className={styles.imageWrap}>
                  <img
                    src={court.CourtImage || "/images/courts/san1.png"}
                    alt={court.CourtName}
                  />
                  <span className={styles.status}>
                    {court.Status === "Available" ? "Còn trống"
                      : court.Status === "Maintenance" ? "Bảo trì"
                      : "Không hoạt động"}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <div>
                      <h3>{court.CourtName}</h3>
                      <p>📍 {court.Location || "Chưa cập nhật vị trí"}</p>
                    </div>
                    <strong>
                      {formatCurrency(court.PricePerHour)}
                      <small>/giờ</small>
                    </strong>
                  </div>

                  <p className={styles.desc}>
                    {court.Description || "Sân Pickleball tiêu chuẩn."}
                  </p>

                  <div className={styles.meta}>
                    <span>{court.CourtType === "Indoor" ? "Sân trong nhà" : "Sân ngoài trời"}</span>
                    <span>⏱ {court.OpenTime} - {court.CloseTime}</span>
                  </div>

                  <div className={styles.actions}>
                    {/* UC-12: Nút mở drawer lịch sân */}
                    <button
                      type="button"
                      onClick={() => setSelectedCourt(court)}
                      disabled={court.Status !== "Available"}
                      title={court.Status !== "Available" ? "Sân hiện không hoạt động" : "Xem lịch sân theo ngày"}
                    >
                      📅 Xem lịch & đặt sân
                    </button>
                    <button type="button" className={styles.outline}>
                      Chi tiết
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* UC-12: Drawer xem lịch sân */}
      {selectedCourt && (
        <CourtScheduleDrawer
          court={selectedCourt}
          onClose={() => setSelectedCourt(null)}
        />
      )}
    </main>
  );
}