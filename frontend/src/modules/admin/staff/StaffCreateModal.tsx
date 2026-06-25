import { useState } from "react";
import { adminCreateStaff } from "@/services/userApi";
import styles from "./AdminStaffPage.module.css";

interface Props {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffCreateModal({ token, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError("Vui lòng điền họ tên và email.");
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);
      await adminCreateStaff(token, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo Staff thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalTitleRow}>
          <h2>Tạo tài khoản nhân viên</h2>
          <button className={styles.modalCloseBtn} onClick={onClose} disabled={loading}>×</button>
        </div>

        {success ? (
          <div className={styles.successBox}>
            <div>
              <p className={styles.successTitle}>Tạo tài khoản thành công!</p>
              <p className={styles.successSub}>Nhân viên có thể đăng nhập ngay bây giờ.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Họ và tên <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  required
                  disabled={loading}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0901234567"
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Email <span className={styles.required}>*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nhanvien@pickleclub.vn"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Mật khẩu <span className={styles.required}>*</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 8 ký tự"
                  required
                  disabled={loading}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Xác nhận mật khẩu <span className={styles.required}>*</span></label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.passwordHint}>
              Mật khẩu sẽ được mã hóa an toàn. Nhân viên nên đổi mật khẩu sau lần đăng nhập đầu tiên.
            </div>

            {error && <div className={styles.errorText}>{error}</div>}

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.btnCancel}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={loading || !formData.fullName || !formData.email || !formData.password || !formData.confirmPassword}
              >
                {loading ? "Đang tạo..." : "Tạo tài khoản"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
