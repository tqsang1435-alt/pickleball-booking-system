"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCourtSlots,
  createSlot,
  updateSlotStatus,
  deleteSlot,
  generateSlots,
  type CourtSlot,
} from "@/services/courtApi";
import type { Court } from "@/types/court";
import { formatCurrency } from "@/utils/formatCurrency";
import ConfirmModal from "@/modules/staff/shared/ConfirmModal";
import styles from "./SlotManager.module.css";

const AUTO_REFRESH_SEC = 30;

interface Props {
  court: Court;
  token: string;
  onClose: () => void;
}

// Dùng locale sv-SE để có format YYYY-MM-DD theo múi giờ VN
function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

export default function SlotManager({ court, token, onClose }: Props) {
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState<CourtSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SEC);

  // Panel state
  const [showForm, setShowForm] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  // Form thêm 1 slot
  const [formData, setFormData] = useState({
    startTime: "06:00",
    endTime: "07:00",
    price: court.PricePerHour,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form sinh slot hàng loạt
  const [genData, setGenData] = useState({ durationMinutes: 60, price: court.PricePerHour });
  const [genError, setGenError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");
  const [generating, setGenerating] = useState(false);

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkActing, setBulkActing] = useState(false);

  // Single action
  const [actioningId, setActioningId] = useState<number | null>(null);

  // Custom confirm state
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  } | null>(null);

  // ─── Load slots ─────────────────────────────────────────────
  const loadSlots = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getCourtSlots(court.CourtID, date);
      setSlots(data);
      setSelectedIds(new Set());
    } catch {
      if (!silent) setSlots([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [court.CourtID, date]);

  useEffect(() => {
    loadSlots();
    setCountdown(AUTO_REFRESH_SEC);
    setGenSuccess("");
  }, [loadSlots]);

  // ─── Auto-refresh 30s ────────────────────────────────────────
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

  // ─── Helpers ─────────────────────────────────────────────────
  function resetCountdown() { setCountdown(AUTO_REFRESH_SEC); }

  function getStatusLabel(status: string) {
    const map: Record<string, string> = {
      Available: "Trống", Blocked: "Đã khóa", Booked: "Đã đặt",
      Holding: "Đang giữ", Maintenance: "Bảo trì", Cancelled: "Đã xóa",
    };
    return map[status] ?? status;
  }

  function getStatusClass(status: string) {
    const map: Record<string, string> = {
      Available: styles.statusAvailable, Blocked: styles.statusBlocked,
      Maintenance: styles.statusMaintenance, Booked: styles.statusBooked,
      Holding: styles.statusHolding,
    };
    return map[status] ?? "";
  }

  const visibleSlots = slots.filter((s) => s.Status !== "Cancelled");
  const actionable = visibleSlots.filter(
    (s) => s.Status !== "Booked" && s.Status !== "Holding"
  );
  const allSelected = actionable.length > 0 && selectedIds.size === actionable.length;

  // ─── Single status change ────────────────────────────────────
  async function handleStatusChange(slotId: number, newStatus: string) {
    try {
      setActioningId(slotId);
      await updateSlotStatus(token, slotId, newStatus);
      await loadSlots(true);
      resetCountdown();
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật trạng thái slot");
    } finally {
      setActioningId(null);
    }
  }

  // ─── Delete slot ─────────────────────────────────────────────
  function handleDeleteSlot(slotId: number) {
    setConfirmConfig({
      title: "Xác nhận xóa slot",
      message: "Bạn có chắc muốn xóa slot này không?",
      variant: "danger",
      onConfirm: () => executeDeleteSlot(slotId),
    });
  }

  async function executeDeleteSlot(slotId: number) {
    try {
      setActioningId(slotId);
      await deleteSlot(token, slotId);
      await loadSlots(true);
      resetCountdown();
    } catch (err: any) {
      alert(err.message || "Không thể xóa slot");
    } finally {
      setActioningId(null);
    }
  }

  // ─── Bulk actions ─────────────────────────────────────────────
  function toggleSelect(slotId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(slotId) ? next.delete(slotId) : next.add(slotId);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedIds(
      allSelected ? new Set() : new Set(actionable.map((s) => s.SlotID))
    );
  }

  function handleBulkStatus(newStatus: string) {
    if (selectedIds.size === 0) return;
    const label = { Available: "mở", Blocked: "khóa", Maintenance: "bảo trì" }[newStatus] ?? newStatus;
    setConfirmConfig({
      title: `Xác nhận ${label === "mở" ? "mở" : label === "khóa" ? "khóa" : "bảo trì"} slot`,
      message: `Bạn muốn ${label} ${selectedIds.size} slot đã chọn?`,
      variant: newStatus === "Available" ? "info" : "warning",
      onConfirm: () => executeBulkStatus(newStatus),
    });
  }

  async function executeBulkStatus(newStatus: string) {
    try {
      setBulkActing(true);
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          updateSlotStatus(token, id, newStatus).catch(() => null)
        )
      );
      await loadSlots(true);
      resetCountdown();
    } finally {
      setBulkActing(false);
    }
  }

  // ─── Create single slot ──────────────────────────────────────
  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (formData.startTime >= formData.endTime) {
      setFormError("Giờ kết thúc phải lớn hơn giờ bắt đầu");
      return;
    }
    if (formData.price < 100000 || formData.price > 1000000) {
      setFormError("Giá phải từ 100.000 đ đến 1.000.000 đ");
      return;
    }
    try {
      setSubmitting(true);
      await createSlot(token, {
        courtId: court.CourtID, slotDate: date,
        startTime: formData.startTime, endTime: formData.endTime, price: formData.price,
      });
      setShowForm(false);
      setFormData({ startTime: "06:00", endTime: "07:00", price: court.PricePerHour });
      await loadSlots(true);
      resetCountdown();
    } catch (err: any) {
      setFormError(err.message || "Không thể tạo slot");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Generate slots hàng loạt ────────────────────────────────
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenError(""); setGenSuccess("");
    if (genData.price < 100000 || genData.price > 1000000) {
      setGenError("Giá phải từ 100.000 đ đến 1.000.000 đ");
      return;
    }
    try {
      setGenerating(true);
      const res = await generateSlots(token, {
        courtId: court.CourtID, slotDate: date,
        durationMinutes: genData.durationMinutes, price: genData.price,
      });
      setGenSuccess(
        `Đã tạo ${res.created} slot mới` +
        (res.skipped > 0 ? `, bỏ qua ${res.skipped} slot đã tồn tại` : ".")
      );
      await loadSlots(true);
      resetCountdown();
    } catch (err: any) {
      setGenError(err.message || "Không thể sinh slot hàng loạt");
    } finally {
      setGenerating(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>

        {/* Header */}
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Quản lý Slot — {court.CourtName}</h2>
            <p className={styles.panelSub}>{court.CourtCode} · {court.OpenTime} – {court.CloseTime}</p>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.refreshBadge} title="Tự động làm mới">
              {countdown}s
            </span>
            <button onClick={onClose} className={styles.closeBtn}>×</button>
          </div>
        </div>

        {/* Date + Action bar */}
        <div className={styles.dateRow}>
          <label className={styles.dateLabel}>Ngày:</label>
          <input
            type="date"
            value={date}
            min={todayStr()}
            onChange={(e) => { setDate(e.target.value); setGenSuccess(""); }}
            className={styles.dateInput}
          />
          <div className={styles.dateActions}>
            <button
              onClick={() => { setShowGenerate(!showGenerate); setShowForm(false); setGenError(""); setGenSuccess(""); }}
              className={styles.generateBtn}
            >
              {showGenerate ? "Đóng" : "Sinh slot loạt"}
            </button>
            <button
              onClick={() => { setShowForm(!showForm); setShowGenerate(false); setFormError(""); }}
              className={styles.addSlotBtn}
            >
              {showForm ? "Đóng" : "Thêm slot"}
            </button>
          </div>
        </div>

        {/* Generate form */}
        {showGenerate && (
          <form onSubmit={handleGenerate} className={styles.addForm}>
            <div className={styles.genHeader}>
              <span className={styles.genTitle}>Sinh slot hàng loạt</span>
              <span className={styles.genHint}>Sân mở {court.OpenTime} – {court.CloseTime}</span>
            </div>
            {genError && <div className={styles.formError}>{genError}</div>}
            {genSuccess && <div className={styles.formSuccess}>{genSuccess}</div>}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Thời lượng mỗi slot</label>
                <select
                  value={genData.durationMinutes}
                  onChange={(e) => setGenData((p) => ({ ...p, durationMinutes: Number(e.target.value) }))}
                  className={styles.formInput}
                >
                  <option value={30}>30 phút</option>
                  <option value={60}>60 phút (1 giờ)</option>
                  <option value={90}>90 phút (1.5 giờ)</option>
                  <option value={120}>120 phút (2 giờ)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Giá mỗi slot (VNĐ)</label>
                <input
                  type="number"
                  value={genData.price}
                  onChange={(e) => setGenData((p) => ({ ...p, price: Number(e.target.value) }))}
                  min={100000} max={1000000} step={10000}
                  className={styles.formInput}
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelFormBtn}
                onClick={() => { setShowGenerate(false); setGenError(""); setGenSuccess(""); }}>
                Đóng
              </button>
              <button type="submit" className={styles.generateSubmitBtn} disabled={generating}>
                {generating ? "Đang sinh..." : "Sinh tất cả slot"}
              </button>
            </div>
          </form>
        )}

        {/* Single slot form */}
        {showForm && (
          <form onSubmit={handleCreateSlot} className={styles.addForm}>
            {formError && <div className={styles.formError}>{formError}</div>}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Giờ bắt đầu</label>
                <input type="time" value={formData.startTime}
                  onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
                  className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label>Giờ kết thúc</label>
                <input type="time" value={formData.endTime}
                  onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
                  className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label>Giá (VNĐ)</label>
                <input type="number" value={formData.price}
                  onChange={(e) => setFormData((p) => ({ ...p, price: Number(e.target.value) }))}
                  min={100000} max={1000000} className={styles.formInput} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelFormBtn}
                onClick={() => { setShowForm(false); setFormError(""); }}>Hủy</button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? "Đang tạo..." : "Tạo slot"}
              </button>
            </div>
          </form>
        )}

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>Đã chọn {selectedIds.size} slot</span>
            <div className={styles.bulkActions}>
              <button onClick={() => handleBulkStatus("Available")} disabled={bulkActing} className={styles.bulkBtnOpen}>
                Mở
              </button>
              <button onClick={() => handleBulkStatus("Blocked")} disabled={bulkActing} className={styles.bulkBtnLock}>
                Khóa
              </button>
              <button onClick={() => handleBulkStatus("Maintenance")} disabled={bulkActing} className={styles.bulkBtnMaint}>
                Bảo trì
              </button>
              <button onClick={() => setSelectedIds(new Set())} disabled={bulkActing} className={styles.bulkBtnClear}>
                Hủy chọn
              </button>
            </div>
          </div>
        )}

        {/* Slot list */}
        <div className={styles.slotList}>
          {loading ? (
            <div className={styles.emptyMsg}>Đang tải...</div>
          ) : visibleSlots.length === 0 ? (
            <div className={styles.emptyMsg}>
              Chưa có slot nào trong ngày này. Bấm <strong>Sinh slot loạt</strong> để tạo nhanh.
            </div>
          ) : (
            <>
              {/* Select-all header */}
              {actionable.length > 0 && (
                <div className={styles.selectAllRow}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={allSelected} onChange={handleSelectAll} />
                    <span>Chọn tất cả ({actionable.length} slot)</span>
                  </label>
                  <span className={styles.slotCount}>{visibleSlots.length} slot trong ngày</span>
                </div>
              )}

              {visibleSlots.map((slot) => {
                const isBooked = slot.Status === "Booked" || slot.Status === "Holding";
                const isActioning = actioningId === slot.SlotID;
                const isSelected = selectedIds.has(slot.SlotID);

                return (
                  <div
                    key={slot.SlotID}
                    className={`${styles.slotItem} ${isSelected ? styles.slotSelected : ""}`}
                  >
                    {/* Checkbox (chỉ khi có thể action) */}
                    {!isBooked && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(slot.SlotID)}
                        className={styles.slotCheckbox}
                        disabled={isActioning || bulkActing}
                      />
                    )}

                    <div className={styles.slotTime}>{slot.StartTime} – {slot.EndTime}</div>
                    <div className={styles.slotPrice}>{formatCurrency(slot.Price)}</div>

                    <span className={`${styles.statusBadge} ${getStatusClass(slot.Status)}`}>
                      {getStatusLabel(slot.Status)}
                    </span>

                    {isBooked ? (
                      <span className={styles.bookedNote}>Không thể thay đổi</span>
                    ) : (
                      <div className={styles.slotActions}>
                        {/* Nút action theo trạng thái hiện tại */}
                        {slot.Status !== "Available" && (
                          <button
                            onClick={() => handleStatusChange(slot.SlotID, "Available")}
                            disabled={isActioning || bulkActing}
                            className={styles.btnUnlock}
                          >
                            {isActioning ? "..." : "Mở"}
                          </button>
                        )}
                        {slot.Status !== "Blocked" && (
                          <button
                            onClick={() => handleStatusChange(slot.SlotID, "Blocked")}
                            disabled={isActioning || bulkActing}
                            className={styles.btnLock}
                          >
                            {isActioning ? "..." : "Khóa"}
                          </button>
                        )}
                        {slot.Status !== "Maintenance" && (
                          <button
                            onClick={() => handleStatusChange(slot.SlotID, "Maintenance")}
                            disabled={isActioning || bulkActing}
                            className={styles.btnMaintenance}
                          >
                            {isActioning ? "..." : "Bảo trì"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSlot(slot.SlotID)}
                          disabled={isActioning || bulkActing}
                          className={styles.btnDeleteSlot}
                          title="Xóa slot"
                        >
                          {isActioning ? "..." : "Xóa"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
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
