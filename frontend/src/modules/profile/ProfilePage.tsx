"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMyBookingHistory,
  getMyProfile,
  updateMyProfile,
} from "@/services/profileApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import type { BookingHistory, Profile } from "@/types/profile";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        getMyBookingHistory(token),
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
          <h2>Lịch sử booking</h2>
          <p>UC-19: Xem lịch sử đặt sân và thanh toán</p>
        </div>

        {bookings.length === 0 ? (
          <div className={styles.empty}>Bạn chưa có booking nào.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Mã booking</th>
                  <th>Loại</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Booking</th>
                  <th>Thanh toán</th>
                  <th>Check-in</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.BookingID}>
                    <td>{booking.BookingCode}</td>
                    <td>{booking.BookingType}</td>
                    <td>{new Date(booking.BookingDate).toLocaleDateString("vi-VN")}</td>
                    <td>{formatCurrency(booking.TotalAmount)}</td>
                    <td>{booking.BookingStatus}</td>
                    <td>{booking.PaymentStatus}</td>
                    <td>{booking.CheckInStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}