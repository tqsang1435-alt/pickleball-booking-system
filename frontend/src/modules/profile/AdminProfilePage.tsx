"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getMyProfile, updateMyProfile } from "@/services/profileApi";
import { getToken } from "@/utils/authStorage";
import type { Profile } from "@/types/profile";

import styles from "./AdminProfilePage.module.css";

export default function AdminProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
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
    async function loadProfile() {
      try {
        setLoading(true);

        const token = getToken();

        if (!token) {
          router.push("/login");
          return;
        }

        const data = await getMyProfile(token);

        setProfile(data);

        setForm({
          fullName: data.FullName || "",
          phoneNumber: data.PhoneNumber || "",
          gender: data.Gender || "",
          dateOfBirth: data.DateOfBirth
            ? data.DateOfBirth.slice(0, 10)
            : "",
          address: data.Address || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được hồ sơ.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
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
      setSuccess("Cập nhật hồ sơ admin thành công.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.state}>Đang tải hồ sơ admin...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className={styles.page}>
        <div className={styles.state}>Không tìm thấy thông tin admin.</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrapper}>
        <section className={styles.header}>
          <div>
            <span>Admin Profile</span>
            <h1>Hồ sơ quản trị viên</h1>
            <p>Quản lý thông tin cá nhân của tài khoản admin.</p>
          </div>

          <button onClick={() => router.push("/admin")} className={styles.backBtn}>
            ← Quay lại Dashboard
          </button>
        </section>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <section className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.avatarBox}>
              {profile.AvatarURL ? (
                <img src={profile.AvatarURL} alt={profile.FullName} />
              ) : (
                <span>{profile.FullName?.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <h2>{profile.FullName}</h2>
            <p>{profile.Email}</p>

            <div className={styles.roleBadge}>
              {profile.Roles || "Admin"}
            </div>

            <div className={styles.infoList}>
              <div>
                <span>Trạng thái</span>
                <strong>{profile.Status}</strong>
              </div>

              <div>
                <span>Số điện thoại</span>
                <strong>{profile.PhoneNumber || "Chưa cập nhật"}</strong>
              </div>

              <div>
                <span>Địa chỉ</span>
                <strong>{profile.Address || "Chưa cập nhật"}</strong>
              </div>
            </div>
          </aside>

          <form className={styles.formCard} onSubmit={handleSubmit}>
            <h2>Cập nhật thông tin</h2>

            <div className={styles.formGrid}>
              <label>
                Họ và tên
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
                  onChange={(e) =>
                    setForm({ ...form, gender: e.target.value })
                  }
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

              <label className={styles.full}>
                Địa chỉ
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </label>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>
                Hủy
              </button>

              <button type="submit" disabled={saving} className={styles.saveBtn}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}