"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  getMyCoachProfile,
  updateMyProfile,
  updateMyExpertise,
  updateMyTeachingFee,
  getMySchedules,
  createMySchedule,
  updateMySchedule,
  deleteMySchedule,
  getMyReceivedBookings,
} from "@/services/coachApi";
import { cancelBookingByCoach } from "@/services/bookingApi";
import type { Coach, CoachSchedule } from "@/types/coach";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import styles from "./CoachDashboard.module.css";
import { getImageUrl } from "@/utils/image";

type Tab = "profile" | "expertise" | "fee" | "schedules" | "bookings";

const SKILL_OPTIONS = [
  { value: "Beginner", label: "Beginner — Mới bắt đầu" },
  { value: "Intermediate", label: "Intermediate — Trung cấp" },
  { value: "Advanced", label: "Advanced — Nâng cao" },
  { value: "Professional", label: "Professional — Chuyên nghiệp" },
];

const STATUS_LABELS: Record<string, string> = {
  Available: "Có thể dạy",
  Holding: "Đang giữ chỗ",
  Booked: "Đã được đặt",
  Cancelled: "Đã hủy",
  Unavailable: "Không có mặt",
};

function todayStr() {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

interface Props {
  token: string;
}

export default function CoachDashboard({ token }: Props) {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") || "profile") as Tab;

  // ── File upload states ────────────────────────────────────
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");

  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [certError, setCertError] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setAvatarError("❌ Ảnh đại diện không được vượt quá 3MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError("❌ Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WEBP");
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleCancelAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarError("");
  };

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setCertError("❌ Chứng chỉ không được vượt quá 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setCertError("❌ Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WEBP");
      return;
    }

    setCertFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCertPreview(previewUrl);
  };

  const handleCancelCert = () => {
    setCertFile(null);
    if (certPreview) {
      URL.revokeObjectURL(certPreview);
    }
    setCertPreview(null);
    setCertError("");
  };

  const [coach, setCoach] = useState<Coach | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  // ── Profile form ──────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    experienceYears: 0,
    biography: "",
    specialization: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // ── Expertise form ────────────────────────────────────────
  const [expertiseForm, setExpertiseForm] = useState({
    skillLevel: "",
    specialization: "",
    certifications: "",
    experienceYears: 0,
  });
  const [expertiseSaving, setExpertiseSaving] = useState(false);
  const [expertiseMsg, setExpertiseMsg] = useState("");

  // ── Fee form ──────────────────────────────────────────────
  const [hourlyRate, setHourlyRate] = useState(150000);
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeMsg, setFeeMsg] = useState("");

  // ── Schedules ─────────────────────────────────────────────
  const [schedules, setSchedules] = useState<CoachSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    workingDate: todayStr(),
    startTime: "08:00",
    endTime: "09:00",
  });
  const [scheduleFormError, setScheduleFormError] = useState("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleActionId, setScheduleActionId] = useState<number | null>(null);

  // ── Bookings ──────────────────────────────────────────────
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingActionId, setBookingActionId] = useState<number | null>(null);

  // ── Load profile ──────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      setProfileError("");
      const data = await getMyCoachProfile(token);
      setCoach(data);
      setProfileForm({
        experienceYears: data.ExperienceYears || 0,
        biography: data.Biography || "",
        specialization: data.Specialization || "",
      });
      setExpertiseForm({
        skillLevel: data.SkillLevel || "",
        specialization: data.Specialization || "",
        certifications: data.Certifications || "",
        experienceYears: data.ExperienceYears || 0,
      });
      setHourlyRate(data.HourlyRate || 150000);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Không tải được hồ sơ"
      );
    }
  }, [token]);

  useEffect(() => {
    let mounted = true;
    setLoadingProfile(true);
    loadProfile().finally(() => {
      if (mounted) setLoadingProfile(false);
    });
    return () => {
      mounted = false;
    };
  }, [loadProfile]);

  // ── Load schedules ────────────────────────────────────────
  const loadSchedules = useCallback(async () => {
    try {
      setSchedulesLoading(true);
      const data = await getMySchedules(token);
      setSchedules(data);
    } catch {
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "schedules") {
      loadSchedules();
    }
  }, [activeTab, loadSchedules]);

  // ── Load bookings ─────────────────────────────────────────
  const loadBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      const data = await getMyReceivedBookings(token);
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "bookings") {
      loadBookings();
    }
  }, [activeTab, loadBookings]);

  // ── Save profile ──────────────────────────────────────────
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg("");

    if (profileForm.biography.length > 1000) {
      setProfileMsg("❌ Giới thiệu tối đa 1000 ký tự");
      return;
    }
    if (profileForm.specialization.length > 500) {
      setProfileMsg("❌ Chuyên môn tối đa 500 ký tự");
      return;
    }
    if (
      profileForm.experienceYears < 0 ||
      profileForm.experienceYears > 50
    ) {
      setProfileMsg("❌ Số năm kinh nghiệm phải từ 0 đến 50");
      return;
    }

    try {
      setProfileSaving(true);
      if (avatarFile) {
        const formData = new FormData();
        formData.append("experienceYears", String(profileForm.experienceYears));
        formData.append("biography", profileForm.biography || "");
        formData.append("specialization", profileForm.specialization || "");
        formData.append("avatar", avatarFile);

        await updateMyProfile(token, formData);
      } else {
        await updateMyProfile(token, {
          experienceYears: profileForm.experienceYears,
          biography: profileForm.biography || null,
          specialization: profileForm.specialization || null,
        });
      }
      setProfileMsg("✅ Cập nhật hồ sơ thành công!");
      handleCancelAvatar();
      await loadProfile();
    } catch (err) {
      setProfileMsg(
        "❌ " + (err instanceof Error ? err.message : "Cập nhật thất bại")
      );
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Save expertise ────────────────────────────────────────
  async function handleSaveExpertise(e: React.FormEvent) {
    e.preventDefault();
    setExpertiseMsg("");

    if (!expertiseForm.skillLevel) {
      setExpertiseMsg("❌ Vui lòng chọn trình độ kỹ năng");
      return;
    }

    try {
      setExpertiseSaving(true);
      if (certFile) {
        const formData = new FormData();
        formData.append("skillLevel", expertiseForm.skillLevel);
        formData.append("specialization", expertiseForm.specialization || "");
        formData.append("experienceYears", String(expertiseForm.experienceYears));
        formData.append("certificate", certFile);

        await updateMyExpertise(token, formData);
      } else {
        await updateMyExpertise(token, {
          skillLevel: expertiseForm.skillLevel as any,
          specialization: expertiseForm.specialization || null,
          certifications: expertiseForm.certifications || null,
          experienceYears: expertiseForm.experienceYears,
        });
      }
      setExpertiseMsg("✅ Cập nhật chuyên môn thành công!");
      handleCancelCert();
      await loadProfile();
    } catch (err) {
      setExpertiseMsg(
        "❌ " + (err instanceof Error ? err.message : "Cập nhật thất bại")
      );
    } finally {
      setExpertiseSaving(false);
    }
  }

  // ── Save fee ──────────────────────────────────────────────
  async function handleSaveFee(e: React.FormEvent) {
    e.preventDefault();
    setFeeMsg("");

    if (hourlyRate < 150000 || hourlyRate > 2000000) {
      setFeeMsg("❌ Học phí phải từ 150.000 đ đến 2.000.000 đ");
      return;
    }

    try {
      setFeeSaving(true);
      await updateMyTeachingFee(token, hourlyRate);
      setFeeMsg("✅ Cập nhật học phí thành công!");
    } catch (err) {
      setFeeMsg(
        "❌ " + (err instanceof Error ? err.message : "Cập nhật thất bại")
      );
    } finally {
      setFeeSaving(false);
    }
  }

  // ── Create schedule ───────────────────────────────────────
  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    setScheduleFormError("");

    if (scheduleForm.startTime >= scheduleForm.endTime) {
      setScheduleFormError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }

    if (scheduleForm.workingDate < todayStr()) {
      setScheduleFormError("Không thể tạo lịch dạy trong quá khứ.");
      return;
    }

    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const nowTimeStr = [
      String(nowVN.getHours()).padStart(2, "0"),
      String(nowVN.getMinutes()).padStart(2, "0")
    ].join(":");

    if (scheduleForm.workingDate === todayStr() && scheduleForm.startTime <= nowTimeStr) {
      setScheduleFormError("Giờ bắt đầu phải lớn hơn thời gian hiện tại.");
      return;
    }

    try {
      setScheduleSubmitting(true);
      await createMySchedule(token, scheduleForm);
      setShowScheduleForm(false);
      setScheduleForm({
        workingDate: todayStr(),
        startTime: "08:00",
        endTime: "09:00",
      });
      await loadSchedules();
    } catch (err) {
      setScheduleFormError(
        err instanceof Error ? err.message : "Tạo lịch thất bại"
      );
    } finally {
      setScheduleSubmitting(false);
    }
  }

  // ── Delete schedule ───────────────────────────────────────
  async function handleDeleteSchedule(scheduleId: number) {
    if (!window.confirm("Bạn có chắc muốn xóa lịch này không?")) return;

    try {
      setScheduleActionId(scheduleId);
      await deleteMySchedule(token, scheduleId);
      await loadSchedules();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa lịch thất bại");
    } finally {
      setScheduleActionId(null);
    }
  }

  // ── Update schedule status ────────────────────────────────
  async function handleSetUnavailable(scheduleId: number) {
    try {
      setScheduleActionId(scheduleId);
      await updateMySchedule(token, scheduleId, { status: "Unavailable" });
      await loadSchedules();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cập nhật lịch thất bại");
    } finally {
      setScheduleActionId(null);
    }
  }

  async function handleSetAvailable(scheduleId: number) {
    try {
      setScheduleActionId(scheduleId);
      await updateMySchedule(token, scheduleId, { status: "Available" });
      await loadSchedules();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cập nhật lịch thất bại");
    } finally {
      setScheduleActionId(null);
    }
  }

  // ── Cancel booking ────────────────────────────────────────
  async function handleCancelBooking(bookingId: number) {
    if (!window.confirm("Bạn có chắc muốn hủy đơn đặt lịch này? Hệ thống sẽ tự động hoàn 100% tiền cho Player.")) return;
    
    try {
      setBookingActionId(bookingId);
      await cancelBookingByCoach(token, bookingId);
      alert("Hủy lịch thành công!");
      await loadBookings();
    } catch (err: any) {
      alert(err.message || "Hủy lịch thất bại");
    } finally {
      setBookingActionId(null);
    }
  }

  // ─────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className={styles.wrap}>
        <StateBox variant="loading" title="Đang tải hồ sơ Coach" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className={styles.wrap}>
        <StateBox
          variant="error"
          title="Không tải được hồ sơ"
          description={profileError}
        />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <img
          src={getImageUrl(coach?.AvatarURL)}
          alt={coach?.FullName}
          className={styles.avatar}
        />
        <div>
          <h1 className={styles.name}>{coach?.FullName}</h1>
          <p className={styles.meta}>
            ⭐ {Number(coach?.AverageRating || 0).toFixed(1)} &nbsp;·&nbsp;{" "}
            {coach?.ExperienceYears || 0}  năm kinh nghiệm &nbsp;·&nbsp;{" "}
            {coach?.TotalStudents || 0} học viên
          </p>
          <span
            className={`${styles.statusBadge} ${
              coach?.Status === "Approved"
                ? styles.statusActive
                : styles.statusPending
            }`}
          >
            {coach?.Status === "Approved"
              ? "✅ Đã được duyệt"
              : coach?.Status === "Pending"
              ? "⏳ Chờ duyệt"
              : coach?.Status === "Inactive"
              ? "🔴 Ngừng hoạt động"
              : coach?.Status}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        {/* ── Tab: Profile ─────────────────────────────── */}
        {activeTab === "profile" && (
          <form className={styles.form} onSubmit={handleSaveProfile}>
            <h2 className={styles.formTitle}>Thông tin hồ sơ</h2>

            <div className={styles.field}>
              <label htmlFor="avatar">Ảnh đại diện (Avatar)</label>
              <input
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className={styles.input}
              />
              {avatarError && <p className={styles.error} style={{ marginTop: "4px" }}>{avatarError}</p>}
              
              {(avatarPreview || coach?.AvatarURL) && (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={avatarPreview || getImageUrl(coach?.AvatarURL)}
                    alt="Avatar Preview"
                    style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "1px solid #ddd" }}
                  />
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleCancelAvatar}
                      style={{
                        display: "block",
                        marginTop: "5px",
                        fontSize: "0.85rem",
                        color: "#ff4d4f",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        padding: 0,
                        textDecoration: "underline"
                      }}
                    >
                      Hủy chọn
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="expYears">Số năm kinh nghiệm</label>
              <input
                id="expYears"
                type="number"
                min={0}
                max={50}
                value={profileForm.experienceYears}
                onChange={(e) =>
                  setProfileForm((p) => ({
                    ...p,
                    experienceYears: Number(e.target.value),
                  }))
                }
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="spec">Chuyên môn</label>
              <input
                id="spec"
                type="text"
                maxLength={500}
                value={profileForm.specialization}
                onChange={(e) =>
                  setProfileForm((p) => ({
                    ...p,
                    specialization: e.target.value,
                  }))
                }
                placeholder="Ví dụ: Kỹ thuật smash, phòng thủ nâng cao..."
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="bio">
                Giới thiệu bản thân{" "}
                <span className={styles.counter}>
                  {profileForm.biography.length}/1000
                </span>
              </label>
              <textarea
                id="bio"
                rows={6}
                maxLength={1000}
                value={profileForm.biography}
                onChange={(e) =>
                  setProfileForm((p) => ({
                    ...p,
                    biography: e.target.value,
                  }))
                }
                placeholder="Chia sẻ kinh nghiệm và phong cách dạy học của bạn..."
                className={styles.textarea}
              />
            </div>

            {profileMsg && (
              <p
                className={
                  profileMsg.startsWith("✅") ? styles.success : styles.error
                }
              >
                {profileMsg}
              </p>
            )}

            <button
              type="submit"
              className={styles.saveBtn}
              disabled={profileSaving}
            >
              {profileSaving ? "Đang lưu..." : "💾 Lưu hồ sơ"}
            </button>
          </form>
        )}

        {/* ── Tab: Expertise ───────────────────────────── */}
        {activeTab === "expertise" && (
          <form className={styles.form} onSubmit={handleSaveExpertise}>
            <h2 className={styles.formTitle}>Chuyên môn & Kỹ năng</h2>

            <div className={styles.field}>
              <label htmlFor="skillLevel">Trình độ kỹ năng</label>
              <select
                id="skillLevel"
                value={expertiseForm.skillLevel}
                onChange={(e) =>
                  setExpertiseForm((p) => ({
                    ...p,
                    skillLevel: e.target.value,
                  }))
                }
                className={styles.input}
              >
                <option value="">— Chọn trình độ —</option>
                {SKILL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="spec2">Chuyên môn</label>
              <input
                id="spec2"
                type="text"
                maxLength={500}
                value={expertiseForm.specialization}
                onChange={(e) =>
                  setExpertiseForm((p) => ({
                    ...p,
                    specialization: e.target.value,
                  }))
                }
                placeholder="Ví dụ: Kỹ thuật Dink, Serve & Return..."
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="certs">Chứng chỉ / Giải thưởng (Chọn file ảnh)</label>
              <input
                id="certs"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCertChange}
                className={styles.input}
              />
              {certError && <p className={styles.error} style={{ marginTop: "4px" }}>{certError}</p>}
              
              {(certPreview || (expertiseForm.certifications && expertiseForm.certifications.startsWith("/uploads"))) && (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={certPreview || getImageUrl(expertiseForm.certifications)}
                    alt="Certificate Preview"
                    style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "6px", objectFit: "contain", border: "1px solid #ddd" }}
                  />
                  {certPreview && (
                    <button
                      type="button"
                      onClick={handleCancelCert}
                      style={{
                        display: "block",
                        marginTop: "5px",
                        fontSize: "0.85rem",
                        color: "#ff4d4f",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        padding: 0,
                        textDecoration: "underline"
                      }}
                    >
                      Hủy chọn
                    </button>
                  )}
                </div>
              )}
              
              {expertiseForm.certifications && !expertiseForm.certifications.startsWith("/uploads") && !certPreview && (
                <p style={{ marginTop: "5px", fontSize: "0.9rem", color: "#666" }}>
                  Hiện tại: <strong>{expertiseForm.certifications}</strong>
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="expYears2">Số năm kinh nghiệm</label>
              <input
                id="expYears2"
                type="number"
                min={0}
                max={50}
                value={expertiseForm.experienceYears}
                onChange={(e) =>
                  setExpertiseForm((p) => ({
                    ...p,
                    experienceYears: Number(e.target.value),
                  }))
                }
                className={styles.input}
              />
            </div>

            {expertiseMsg && (
              <p
                className={
                  expertiseMsg.startsWith("✅") ? styles.success : styles.error
                }
              >
                {expertiseMsg}
              </p>
            )}

            <button
              type="submit"
              className={styles.saveBtn}
              disabled={expertiseSaving}
            >
              {expertiseSaving ? "Đang lưu..." : "💾 Lưu chuyên môn"}
            </button>
          </form>
        )}

        {/* ── Tab: Fee ─────────────────────────────────── */}
        {activeTab === "fee" && (
          <form className={styles.form} onSubmit={handleSaveFee}>
            <h2 className={styles.formTitle}>Cấu hình học phí</h2>

            <div className={styles.feePreview}>
              <span className={styles.feePreviewLabel}>Học phí hiện tại</span>
              <strong className={styles.feePreviewValue}>
                {formatCurrency(hourlyRate)} / giờ
              </strong>
            </div>

            <div className={styles.field}>
              <label htmlFor="rate">
                Học phí (VNĐ/giờ){" "}
                <span className={styles.hint}>
                  150.000 – 2.000.000 đ
                </span>
              </label>
              <input
                id="rate"
                type="number"
                min={150000}
                max={2000000}
                step={10000}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className={styles.input}
              />

              <div className={styles.rateSlider}>
                <input
                  type="range"
                  min={150000}
                  max={2000000}
                  step={10000}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className={styles.slider}
                />
                <div className={styles.sliderLabels}>
                  <span>150K</span>
                  <span>2.000K</span>
                </div>
              </div>
            </div>

            {feeMsg && (
              <p
                className={
                  feeMsg.startsWith("✅") ? styles.success : styles.error
                }
              >
                {feeMsg}
              </p>
            )}

            <button
              type="submit"
              className={styles.saveBtn}
              disabled={feeSaving}
            >
              {feeSaving ? "Đang lưu..." : "💾 Lưu học phí"}
            </button>
          </form>
        )}

        {/* ── Tab: Schedules ───────────────────────────── */}
        {activeTab === "schedules" && (
          <div className={styles.scheduleWrap}>
            <div className={styles.scheduleHeader}>
              <h2 className={styles.formTitle}>Lịch dạy của tôi</h2>
              <button
                type="button"
                className={styles.addScheduleBtn}
                onClick={() => {
                  setShowScheduleForm(!showScheduleForm);
                  setScheduleFormError("");
                }}
              >
                {showScheduleForm ? "✕ Đóng" : "＋ Thêm lịch"}
              </button>
            </div>

            {showScheduleForm && (
              <form
                className={styles.scheduleForm}
                onSubmit={handleCreateSchedule}
              >
                {scheduleFormError && (
                  <p className={styles.error}>{scheduleFormError}</p>
                )}

                <div className={styles.scheduleFormRow}>
                  <div className={styles.field}>
                    <label>Ngày</label>
                    <input
                      type="date"
                      value={scheduleForm.workingDate}
                      min={todayStr()}
                      onChange={(e) =>
                        setScheduleForm((p) => ({
                          ...p,
                          workingDate: e.target.value,
                        }))
                      }
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={scheduleForm.startTime}
                      onChange={(e) =>
                        setScheduleForm((p) => ({
                          ...p,
                          startTime: e.target.value,
                        }))
                      }
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Giờ kết thúc</label>
                    <input
                      type="time"
                      value={scheduleForm.endTime}
                      onChange={(e) =>
                        setScheduleForm((p) => ({
                          ...p,
                          endTime: e.target.value,
                        }))
                      }
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.scheduleFormActions}>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className={styles.cancelBtn}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={scheduleSubmitting}
                  >
                    {scheduleSubmitting ? "Đang tạo..." : "✓ Tạo lịch"}
                  </button>
                </div>
              </form>
            )}

            {schedulesLoading ? (
              <StateBox variant="loading" title="Đang tải lịch" />
            ) : schedules.length === 0 ? (
              <StateBox
                variant="empty"
                title="Chưa có lịch dạy"
                description="Bấm ＋ Thêm lịch để tạo lịch dạy đầu tiên."
              />
            ) : (
              <div className={styles.scheduleList}>
                {schedules.map((s) => {
                  const isActioning = scheduleActionId === s.CoachScheduleID;
                  const isPast = s.isExpired;
                  const canAction =
                    !isPast && s.Status !== "Booked" && s.Status !== "Holding";

                  let displayStatus = STATUS_LABELS[s.Status] || s.Status;
                  let itemClass = "";

                  if (s.Status === "Booked") {
                    itemClass = styles.scheduleBooked;
                  } else if (isPast) {
                    itemClass = styles.scheduleUnavailable; // Grey out expired slots
                    displayStatus = "Đã qua";
                  } else if (s.Status === "Available") {
                    itemClass = styles.scheduleAvailable;
                  } else {
                    itemClass = styles.scheduleUnavailable;
                  }

                  return (
                    <div
                      key={s.CoachScheduleID}
                      className={`${styles.scheduleItem} ${itemClass}`}
                    >
                      <div className={styles.scheduleDate}>
                        📅 {s.WorkingDate}
                      </div>
                      <div className={styles.scheduleTime}>
                        ⏰ {s.StartTime} – {s.EndTime}
                      </div>
                      <span className={styles.scheduleStatus}>
                        {displayStatus}
                      </span>

                      {canAction && (
                        <div className={styles.scheduleActions}>
                          {s.Status === "Available" ? (
                            <button
                              onClick={() =>
                                handleSetUnavailable(s.CoachScheduleID)
                              }
                              disabled={isActioning}
                              className={styles.btnUnavailable}
                            >
                              {isActioning ? "..." : "🔴 Bận"}
                            </button>
                          ) : s.Status === "Unavailable" ? (
                            <button
                              onClick={() =>
                                handleSetAvailable(s.CoachScheduleID)
                              }
                              disabled={isActioning}
                              className={styles.btnAvailable}
                            >
                              {isActioning ? "..." : "🟢 Mở lại"}
                            </button>
                          ) : null}
                          <button
                            onClick={() =>
                              handleDeleteSchedule(s.CoachScheduleID)
                            }
                            disabled={isActioning}
                            className={styles.btnDelete}
                          >
                            {isActioning ? "..." : "🗑️"}
                          </button>
                        </div>
                      )}

                      {!canAction && (
                        <span className={styles.lockedNote}>
                          Không thể thay đổi
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* ── Tab: Bookings ─────────────────────────────── */}
        {activeTab === "bookings" && (
          <div className={styles.scheduleWrap}>
            <div className={styles.scheduleHeader}>
              <h2 className={styles.formTitle}>Danh sách đơn đặt lịch</h2>
            </div>
            
            {bookingsLoading ? (
              <StateBox variant="loading" title="Đang tải danh sách..." />
            ) : bookings.length === 0 ? (
              <StateBox
                variant="empty"
                title="Chưa có đơn đặt lịch nào"
                description="Bạn sẽ thấy danh sách học viên đặt lịch ở đây."
              />
            ) : (
              <div className={styles.scheduleList}>
                {bookings
                  .slice()
                  .sort((a, b) => {
                    const dateA = new Date(a.BookingDate).getTime();
                    const dateB = new Date(b.BookingDate).getTime();
                    if (dateA !== dateB) return dateB - dateA; // Mới nhất lên đầu
                    
                    const timeA = a.StartTime || "00:00";
                    const timeB = b.StartTime || "00:00";
                    return timeB.localeCompare(timeA); // Giờ trễ hơn lên đầu
                  })
                  .map((b) => {
                  const canCancel = b.Status === "Confirmed";
                  const isActioning = bookingActionId === b.BookingID;
                  return (
                    <div key={b.BookingID} className={`${styles.scheduleItem} ${styles.scheduleBooked}`}>
                      <div className={styles.scheduleDate}>
                        📅 {new Date(b.BookingDate).toLocaleDateString("vi-VN")}
                      </div>
                      <div className={styles.scheduleTime}>
                        ⏰ {b.StartTime} – {b.EndTime}
                      </div>
                      
                      <div style={{ marginTop: 10, fontSize: "0.95rem" }}>
                        <strong>Mã:</strong> {b.BookingCode} <br />
                        <strong>Học viên:</strong> {b.PlayerName} <br />
                        <strong>Trạng thái:</strong> {b.Status} <br />
                        <strong>Sân:</strong> {b.CourtName || "Không kèm sân"}
                      </div>

                      {canCancel && (
                        <div className={styles.scheduleActions}>
                          <button
                            className={styles.btnDelete}
                            onClick={() => handleCancelBooking(b.BookingID)}
                            disabled={isActioning}
                          >
                            {isActioning ? "Đang hủy..." : "❌ Hủy đơn"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
