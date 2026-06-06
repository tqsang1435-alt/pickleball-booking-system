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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      setError("Vui lòng điền các trường bắt buộc (Họ tên, Email)");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      await adminCreateStaff(token, formData);
      alert("Tạo Staff thành công!");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo Staff thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Tạo tài khoản Staff</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Họ và tên *</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
          </div>
          
          <div className={styles.formGroup}>
            <label>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className={styles.formGroup}>
            <label>Số điện thoại</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Mật khẩu (mặc định: 123456)</label>
            <input type="password" name="password" placeholder="123456" value={formData.password} onChange={handleChange} />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.btnCancel} disabled={loading}>Hủy</button>
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? "Đang tạo..." : "Xác nhận tạo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
