"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyBookings, mockPayBooking, checkInBooking } from "@/services/bookingApi";
import type { Booking } from "@/services/bookingApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Profile } from "@/types/profile";
import { getMyProfile, updateMyProfile } from "@/services/profileApi";
import CancelBookingModal from "@/modules/bookings/CancelBookingModal";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  // UC-17: Replace window.prompt với modal đẹp
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
    address: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // ✅ THAY BẰNG
        const token = getToken();

        if (!token) {
          router.push("/login");
          return;
        }

        const [profileData, bookingData] = await Promise.all([
          getMyProfile(token),
          getMyBookings(token),
        ]);

        setProfile(profileData);
        setBookings(bookingData);

        setForm({
          fullName: profileData.FullName || "",
          phoneNumber: profileData.PhoneNumber || "",
          gender: profileData.Gender || "",
          dateOfBirth: profileData.DateOfBirth
            ? profileData.DateOfBirth.slice(0, 10)
            : "",
          address: profileData.Address || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được profile.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated = await updateMyProfile(token, form);

      setProfile(updated);
      setSuccess("Cập nhật hồ sơ thành công.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMockPay(booking: Booking) {
    const token = getToken();
    if (!token) return;
    if (!window.confirm("Thanh toán giả lập cho Booking này?")) return;

    try {
      setActioningId(booking.BookingID);
      await mockPayBooking(token, booking.BookingID, "VNPay");
      const bookingData = await getMyBookings(token);
      setBookings(bookingData);
      setSuccess("Thanh toán thành công (Mock)!");
    } catch (err: any) {
      alert(err.message || "Thanh toán thất bại");
    } finally {
      setActioningId(null);
    }
  }

  async function handleCancel(booking: Booking) {
    // UC-17: Mở CancelBookingModal thay vì window.prompt
    setCancelTarget(booking);
  }

  async function handleCancelSuccess() {
    setCancelTarget(null);
    const token = getToken();
    if (token) {
      const bookingData = await getMyBookings(token);
      setBookings(bookingData);
    }
    setSuccess("Hủy booking thành công.");
  }

  async function handleCheckIn(booking: Booking) {
    const token = getToken();
    if (!token) return;

    try {
      setActioningId(booking.BookingID);
      await checkInBooking(token, booking.BookingID);
      const bookingData = await getMyBookings(token);
      setBookings(bookingData);
      setSuccess("Check-in thành công!");
    } catch (err: any) {
      alert(err.message || "Check-in thất bại");
    } finally {
      setActioningId(null);
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.state}>Đang tải hồ sơ...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className={styles.page}>
        <div className={styles.state}>Không tìm thấy thông tin người dùng.</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* UC-17: CancelBookingModal */}
      {cancelTarget && (
        <CancelBookingModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={handleCancelSuccess}
        />
      )}

      <section className={styles.hero}>
        <div>
          <span>Player Profile</span>
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin tài khoản và lịch sử đặt sân của bạn.</p>
        </div>

        <div className={styles.avatar}>
          {profile.AvatarURL ? (
            <img src={profile.AvatarURL} alt={profile.FullName} />
          ) : (
            profile.FullName.charAt(0).toUpperCase()
          )}
        </div>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}
      {success ? <div className={styles.success}>{success}</div> : null}

      <section className={styles.grid}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h2>Cập nhật thông tin</h2>

          <label>
            Họ tên
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
            />
          </label>

          <label>
            Email
            <input value={profile.Email} disabled />
          </label>

          <label>
            Số điện thoại
            <input
              value={form.phoneNumber}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
            />
          </label>

          <label>
            Giới tính
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Chọn giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
          </label>

          <label>
            Ngày sinh
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) =>
                setForm({ ...form, dateOfBirth: e.target.value })
              }
            />
          </label>

          <label>
            Địa chỉ
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>

        <div className={styles.card}>
          <h2>Thông tin tài khoản</h2>

          <div className={styles.infoRow}>
            <span>Trạng thái</span>
            <strong>{profile.Status}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>Email</span>
            <strong>{profile.Email}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>Số điện thoại</span>
            <strong>{profile.PhoneNumber || "Chưa cập nhật"}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>Địa chỉ</span>
            <strong>{profile.Address || "Chưa cập nhật"}</strong>
          </div>
        </div>
      </section>

      <section className={styles.history}>
        <div className={styles.historyHeader}>
          <div>
            <h2>Lịch sử booking gần đây</h2>
            <p>UC-19: Xem lịch sử đặt sân và thanh toán</p>
          </div>
          <a href="/bookings" className={styles.viewAllBtn}>
            Xem tất cả →
          </a>
        </div>

        {bookings.length === 0 ? (
          <div className={styles.empty}>Bạn chưa có booking nào.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã Booking</th>
                  <th>Dịch vụ</th>
                  <th>Thời gian</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => {
                  const canCancel = ["PendingPayment", "Confirmed", "Paid"].includes(booking.Status);
                  const canPay = booking.Status === "PendingPayment";
                  const canCheckIn = booking.Status === "Confirmed";
                  const isActioning = actioningId === booking.BookingID;

                  return (
                    <tr key={booking.BookingID} className={isActioning ? styles.rowActioning : ""}>
                      <td>
                        <div className={styles.bookingCode}>{booking.BookingCode}</div>
                        <div className={styles.bookingDate}>
                          Đặt ngày: {new Date(booking.CreatedAt).toLocaleDateString("vi-VN")}
                        </div>
                      </td>
                      <td>
                        <div className={styles.serviceType}>
                          {booking.BookingType === "Court" ? "🏟️ Đặt sân" : booking.BookingType === "Coach" ? "👨‍🏫 Đặt HLV" : "🔥 Combo"}
                        </div>
                        {(booking.CourtName) && <div className={styles.serviceDetail}>Sân: {booking.CourtName}</div>}
                        {(booking.CoachName) && <div className={styles.serviceDetail}>HLV: {booking.CoachName}</div>}
                      </td>
                      <td>
                        <div className={styles.playDate}>
                          📅 {new Date(booking.BookingDate).toLocaleDateString("vi-VN")}
                        </div>
                        <div className={styles.playTime}>
                          ⏱️ {booking.StartTime} - {booking.EndTime}
                        </div>
                      </td>
                      <td>
                        <div className={styles.amount}>{formatCurrency(booking.TotalAmount)}</div>
                        {booking.PaymentMethod && (
                          <div className={styles.paymentMethod}>💳 {booking.PaymentMethod}</div>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles["badge" + booking.Status]}`}>
                          {booking.Status}
                        </span>
                        {booking.CheckInTime && (
                          <div className={styles.checkInTime}>
                            Check-in: {new Date(booking.CheckInTime).toLocaleTimeString("vi-VN")}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          {canCheckIn && (
                            <button
                              className={styles.btnPay}
                              onClick={() => handleCheckIn(booking)}
                              disabled={isActioning}
                              style={{ backgroundColor: "var(--pcs-brand-primary)" }}
                            >
                              Check-In
                            </button>
                          )}
                          {canPay && (
                            <button
                              className={styles.btnPay}
                              onClick={() => handleMockPay(booking)}
                              disabled={isActioning}
                            >
                              Thanh toán
                            </button>
                          )}
                          {canCancel && (
                            <button
                              className={styles.btnCancel}
                              onClick={() => handleCancel(booking)}
                              disabled={isActioning}
                            >
                              Hủy
                            </button>
                          )}
                          {!canPay && !canCancel && !canCheckIn && <span className={styles.noAction}>-</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}