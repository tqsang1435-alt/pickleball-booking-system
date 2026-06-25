"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCourts, createCourt, updateCourt, deleteCourt } from "@/services/courtApi";
import { getToken, getUser } from "@/utils/authStorage";
import type { Court } from "@/types/court";
import StateBox from "@/components/common/StateBox";
import SlotManager from "./SlotManager";
import ConfirmModal from "@/modules/staff/shared/ConfirmModal";
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

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedCourtForSlot, setSelectedCourtForSlot] = useState<Court | null>(null);

  // Custom confirm state
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  } | null>(null);

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
      const data = await getCourts();
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
    setConfirmConfig({
      title: "Xác nhận xóa Sân Pickleball",
      message: `Bạn có chắc muốn xóa sân "${court.CourtName}" không?\nSân sẽ bị ẩn khỏi hệ thống (xóa mềm) và không thể đặt lịch.`,
      variant: "danger",
      onConfirm: () => executeDelete(court),
    });
  }

  async function executeDelete(court: Court) {
    if (!token) return;
    try {
      setDeletingId(court.CourtID);
      await deleteCourt(token, court.CourtID);
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

  const filteredCourts = courts.filter((court) => {
    const matchesSearch =
      court.CourtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      court.CourtCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (court.Location || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || court.Status === statusFilter;
    const matchesType = typeFilter === "All" || court.CourtType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Quản lý Sân Pickleball</h1>
          <p>Danh sách sân pickleball của hệ thống và thiết lập giờ mở cửa, bảng giá.</p>
        </div>
        {!isStaff && (
          <button onClick={handleOpenAdd} className={styles.addButton}>
            Thêm Sân Mới
          </button>
        )}
      </header>

      {/* Toolbar tìm kiếm & lọc */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Tìm kiếm sân theo tên, mã hoặc địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.toolbarInput}
          />
        </div>
        <div className={styles.filterWrapper}>
          <div className={styles.filterGroup}>
            <label>Trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.toolbarSelect}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Available">Đang hoạt động</option>
              <option value="Maintenance">Đang bảo trì</option>
              <option value="Inactive">Tạm ngưng</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Loại sân:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={styles.toolbarSelect}
            >
              <option value="All">Tất cả loại sân</option>
              <option value="Indoor">Trong nhà</option>
              <option value="Outdoor">Ngoài trời</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <StateBox variant="loading" title="Đang tải danh sách sân..." />
      ) : error ? (
        <StateBox variant="error" title="Lỗi hệ thống" description={error} />
      ) : filteredCourts.length === 0 ? (
        <StateBox variant="empty" title="Không tìm thấy sân nào" description="Thử thay đổi từ khóa hoặc bộ lọc của bạn." />
      ) : (
        <div className={styles.courtCardGrid}>
          {filteredCourts.map((court) => (
            <div key={court.CourtID} className={styles.courtCard}>
              <div className={styles.cardImageWrapper}>
                <img
                  src={getImageUrl(court.CourtImage, "/images/home/court-placeholder.jpg")}
                  alt={court.CourtName}
                  className={styles.cardImage}
                />
                <span className={`${styles.cardBadge} ${court.CourtType === "Indoor" ? styles.badgeIndoor : styles.badgeOutdoor}`}>
                  {court.CourtType === "Indoor" ? "Trong nhà" : "Ngoài trời"}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{court.CourtName}</h3>
                  <span className={styles.cardSub}>{court.CourtCode}</span>
                </div>
                
                <div className={styles.cardInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Vị trí:</span>
                    <span className={styles.infoVal} title={court.Location || "Chưa thiết lập"}>
                      {court.Location || "Chưa thiết lập"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Mở cửa:</span>
                    <span className={styles.infoVal}>{court.OpenTime} - {court.CloseTime}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Giá thuê/giờ:</span>
                    <span className={styles.priceVal}>{formatCurrency(court.PricePerHour)}</span>
                  </div>
                </div>

                <div className={styles.cardStatusRow}>
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
                      : "Tạm ngưng"}
                  </span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                {!isStaff && (
                  <button onClick={() => handleOpenEdit(court)} className={styles.cardEditButton}>
                    Sửa
                  </button>
                )}
                <button
                  onClick={() => setSelectedCourtForSlot(court)}
                  className={styles.cardSlotButton}
                >
                  Lịch slot
                </button>
                {!isStaff && (
                  <button
                    onClick={() => handleDelete(court)}
                    className={styles.cardDeleteButton}
                    disabled={deletingId === court.CourtID}
                  >
                    {deletingId === court.CourtID ? "Đang xóa..." : "Xóa"}
                  </button>
                )}
              </div>
            </div>
          ))}
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
