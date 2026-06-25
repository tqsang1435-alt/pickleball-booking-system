"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCourts, createCourt, updateCourt, deleteCourt } from "@/services/courtApi";
import { getToken, getUser } from "@/utils/authStorage";
import type { Court } from "@/types/court";
import StateBox from "@/components/common/StateBox";
import ConfirmModal from "@/modules/staff/shared/ConfirmModal";
import SlotManager from "./SlotManager";
import styles from "./AdminCourtsPage.module.css";
import { formatCurrency } from "@/utils/formatCurrency";
import { getImageUrl } from "@/utils/image";

export default function AdminCourtsPage() {
  const router = useRouter();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedCourtForSlot, setSelectedCourtForSlot] = useState<Court | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; court: Court | null }>({
    isOpen: false,
    court: null,
  });

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");

  const [formData, setFormData] = useState({
    CourtCode: "",
    CourtName: "",
    CourtType: "Indoor",
    Location: "",
    Description: "",
    PricePerHour: 100000,
    CourtImage: "",
    Status: "Available",
    OpenTime: "05:00",
    CloseTime: "22:00",
  });

  // Verify Role and Fetch Data
  useEffect(() => {
    const userToken = getToken();
    const user = getUser();
    const role = String(
      user?.RoleName || user?.role || user?.roles?.[0] || ""
    ).toLowerCase();

    if (!userToken || !(role.includes("admin") || role.includes("manager") || role.includes("staff"))) {
      router.push("/login");
      return;
    }

    setToken(userToken);
    setIsStaff(role.includes("staff"));
    loadCourts();
  }, [router]);

  async function loadCourts() {
    try {
      setLoading(true);
      setError("");
      const userToken = getToken();
      const data = await getCourts(true, userToken || undefined);
      setCourts(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách sân");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAdd() {
    setEditingCourt(null);
    setFormData({
      CourtCode: "",
      CourtName: "",
      CourtType: "Indoor",
      Location: "",
      Description: "",
      PricePerHour: 100000,
      CourtImage: "",
      Status: "Available",
      OpenTime: "05:00",
      CloseTime: "22:00",
    });
    setSelectedFile(null);
    setImagePreview(null);
    setFileError("");
    setFormError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(court: Court) {
    setEditingCourt(court);
    setFormData({
      CourtCode: court.CourtCode,
      CourtName: court.CourtName,
      CourtType: court.CourtType,
      Location: court.Location || "",
      Description: court.Description || "",
      PricePerHour: court.PricePerHour,
      CourtImage: court.CourtImage || "",
      Status: court.Status,
      OpenTime: court.OpenTime || "05:00",
      CloseTime: court.CloseTime || "22:00",
    });
    setSelectedFile(null);
    setImagePreview(court.CourtImage ? getImageUrl(court.CourtImage, "") : null);
    setFileError("");
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (!formData.CourtCode.trim() || !formData.CourtName.trim()) {
      setFormError("Vui lòng điền đầy đủ Mã sân và Tên sân.");
      return;
    }

    if (formData.PricePerHour < 100000 || formData.PricePerHour > 1000000) {
      setFormError("Giá thuê mỗi giờ phải nằm trong khoảng từ 100,000 đ đến 1,000,000 đ.");
      return;
    }

    // Time validation (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(formData.OpenTime) || !timeRegex.test(formData.CloseTime)) {
      setFormError("Giờ mở/đóng cửa phải ở định dạng HH:mm (ví dụ: 06:00).");
      return;
    }

    if (formData.OpenTime >= formData.CloseTime) {
      setFormError("Giờ đóng cửa phải lớn hơn giờ mở cửa.");
      return;
    }

    if (fileError) {
      setFormError("Vui lòng chọn file hình ảnh hợp lệ.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      let payload: any;
      if (selectedFile) {
        const fd = new FormData();
        fd.append("CourtCode", formData.CourtCode.trim());
        fd.append("CourtName", formData.CourtName.trim());
        fd.append("CourtType", formData.CourtType);
        fd.append("Location", formData.Location.trim());
        fd.append("Description", formData.Description.trim() || "");
        fd.append("PricePerHour", String(formData.PricePerHour));
        fd.append("Status", formData.Status);
        fd.append("OpenTime", formData.OpenTime);
        fd.append("CloseTime", formData.CloseTime);
        fd.append("CourtImage", selectedFile);
        payload = fd;
      } else {
        payload = {
          CourtCode: formData.CourtCode.trim(),
          CourtName: formData.CourtName.trim(),
          CourtType: formData.CourtType,
          Location: formData.Location.trim(),
          Description: formData.Description.trim() || null,
          PricePerHour: Number(formData.PricePerHour),
          CourtImage: formData.CourtImage || null,
          Status: formData.Status,
          OpenTime: formData.OpenTime,
          CloseTime: formData.CloseTime,
        };
      }

      if (editingCourt) {
        await updateCourt(token, editingCourt.CourtID, payload);
      } else {
        await createCourt(token, payload);
      }

      setIsModalOpen(false);
      loadCourts();
    } catch (err: any) {
      setFormError(err.message || "Đã xảy ra lỗi khi lưu thông tin sân.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(court: Court) {
    if (!token) return;
    setConfirmConfig({ isOpen: true, court });
  }

  async function confirmDelete() {
    if (!token || !confirmConfig.court) return;
    const court = confirmConfig.court;

    try {
      setDeletingId(court.CourtID);
      await deleteCourt(token, court.CourtID);
      setConfirmConfig({ isOpen: false, court: null });
      loadCourts();
    } catch (err: any) {
      alert(err.message || "Không thể xóa sân. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "PricePerHour" ? Number(value) : value,
    }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileError("");

    if (!file) {
      setSelectedFile(null);
      setImagePreview(editingCourt?.CourtImage ? getImageUrl(editingCourt.CourtImage, "") : null);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError("Hình ảnh sân không được vượt quá 5MB");
      setSelectedFile(null);
      setImagePreview(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Chỉ được chọn ảnh JPG, PNG hoặc WEBP");
      setSelectedFile(null);
      setImagePreview(null);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  }

  function handleResetFile() {
    setSelectedFile(null);
    setImagePreview(editingCourt?.CourtImage ? getImageUrl(editingCourt.CourtImage, "") : null);
    setFileError("");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Quản lý Sân</h1>
          <p>Danh sách sân pickleball của hệ thống và thiết lập giờ mở cửa, bảng giá.</p>
        </div>
        {!isStaff && (
          <button onClick={handleOpenAdd} className={styles.addButton}>
            ➕ Thêm sân mới
          </button>
        )}
      </header>

      {loading ? (
        <StateBox variant="loading" title="Đang tải danh sách sân" />
      ) : error ? (
        <StateBox variant="error" title="Lỗi hệ thống" description={error} />
      ) : courts.length === 0 ? (
        <StateBox variant="empty" title="Chưa có sân nào trên hệ thống" description="Bấm nút 'Thêm sân mới' để khởi tạo." />
      ) : (
        <div className={styles.tablePanel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Thông tin sân</th>
                <th>Vị trí</th>
                <th>Giờ hoạt động</th>
                <th>Giá thuê / Giờ</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {courts.map((court) => (
                <tr key={court.CourtID}>
                  <td>
                    <div className={styles.courtInfo}>
                      <img
                        src={getImageUrl(court.CourtImage, "/images/home/court-placeholder.jpg")}
                        alt={court.CourtName}
                        className={styles.courtThumb}
                      />
                      <div className={styles.courtMeta}>
                        <span className={styles.courtName}>{court.CourtName}</span>
                        <span className={styles.courtCode}>{court.CourtCode} • {court.CourtType === "Indoor" ? "Trong nhà" : "Ngoài trời"}</span>
                      </div>
                    </div>
                  </td>
                  <td>{court.Location || "Chưa thiết lập"}</td>
                  <td>⏱️ {court.OpenTime} - {court.CloseTime}</td>
                  <td><strong>{formatCurrency(court.PricePerHour)}</strong></td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        court.Status === "Available"
                          ? styles.badgeAvailable
                          : court.Status === "Maintenance"
                          ? styles.badgeMaintenance
                          : styles.badgeInactive
                      }`}
                    >
                      {court.Status === "Available"
                        ? "Hoạt động"
                        : court.Status === "Maintenance"
                        ? "Bảo trì"
                        : "Khóa/Ngưng"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      {!isStaff && (
                        <button onClick={() => handleOpenEdit(court)} className={styles.editButton}>
                          ✏️ Sửa
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedCourtForSlot(court)}
                        className={styles.slotButton}
                      >
                        📅 Lịch slot
                      </button>
                      {!isStaff && (
                        <button
                          onClick={() => handleDelete(court)}
                          className={styles.deleteButton}
                          disabled={deletingId === court.CourtID}
                        >
                          {deletingId === court.CourtID ? "Đang xóa..." : "🗑️ Xóa"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingCourt ? "Cập nhật thông tin sân" : "Thêm sân pickleball mới"}</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeButton}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, flex: 1 }}>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorMsg}>{formError}</div>}

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Mã sân *</label>
                    <input
                      type="text"
                      name="CourtCode"
                      value={formData.CourtCode}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: COURT-01"
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tên sân *</label>
                    <input
                      type="text"
                      name="CourtName"
                      value={formData.CourtName}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Sunrise Court 01"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Loại sân</label>
                    <select
                      name="CourtType"
                      value={formData.CourtType}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="Indoor">Trong nhà (Indoor)</option>
                      <option value="Outdoor">Ngoài trời (Outdoor)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Giá thuê mỗi giờ (VNĐ) *</label>
                    <input
                      type="number"
                      name="PricePerHour"
                      value={formData.PricePerHour}
                      onChange={handleInputChange}
                      min="100000"
                      max="1000000"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Giờ mở cửa (HH:mm) *</label>
                    <input
                      type="text"
                      name="OpenTime"
                      value={formData.OpenTime}
                      onChange={handleInputChange}
                      placeholder="05:00"
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Giờ đóng cửa (HH:mm) *</label>
                    <input
                      type="text"
                      name="CloseTime"
                      value={formData.CloseTime}
                      onChange={handleInputChange}
                      placeholder="22:00"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Trạng thái</label>
                    <select
                      name="Status"
                      value={formData.Status}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="Available">Hoạt động (Available)</option>
                      <option value="Maintenance">Bảo trì (Maintenance)</option>
                      <option value="Inactive">Khóa/Ngưng hoạt động (Inactive)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Địa chỉ / Vị trí</label>
                    <input
                      type="text"
                      name="Location"
                      value={formData.Location}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Tầng 3, tòa nhà A"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Hình ảnh sân</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className={styles.input}
                  />
                  {fileError && (
                    <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                      {fileError}
                    </div>
                  )}
                  {imagePreview && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                      />
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={handleResetFile}
                          style={{
                            fontSize: "12px",
                            color: "#3b82f6",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            textDecoration: "underline"
                          }}
                        >
                          Xóa chọn ảnh
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Mô tả chi tiết</label>
                  <textarea
                    name="Description"
                    value={formData.Description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chất lượng sân, lưới, loại thảm..."
                    className={styles.textarea}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.cancelButton}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.submitButton} disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slot Manager Panel */}
      {selectedCourtForSlot && token && (
        <SlotManager
          court={selectedCourtForSlot}
          token={token}
          onClose={() => setSelectedCourtForSlot(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmConfig.isOpen && confirmConfig.court && (
        <ConfirmModal
          title="Xác nhận xóa sân"
          message={`Bạn có chắc muốn xóa sân "${confirmConfig.court.CourtName}" không? Sân sẽ bị ẩn khỏi hệ thống (xóa mềm) và không thể đặt lịch.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmConfig({ isOpen: false, court: null })}
          confirmLabel="Xóa sân"
          cancelLabel="Hủy"
          variant="danger"
          loading={deletingId === confirmConfig.court.CourtID}
        />
      )}
    </div>
  );
}
