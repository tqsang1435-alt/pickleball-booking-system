import { useState } from "react";
import { adminCreateCoach } from "@/services/coachApi";
import styles from "./AdminCoachPage.module.css";

interface Props {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CoachCreateModal({ token, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    experience: "",
    skillLevel: "Professional",
    specialty: "",
    certificate: "",
    hourlyRate: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.hourlyRate || !formData.experience) {
      setError("Vui lòng điền các trường bắt buộc (Họ tên, Email, Kinh nghiệm, Học phí)");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      await adminCreateCoach(token, {
        ...formData,
        experience: Number(formData.experience) || 0,
        hourlyRate: Number(formData.hourlyRate) || 0,
      });
      alert("Tạo Coach thành công!");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo Coach thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Tạo tài khoản Coach</h2>
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

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Kinh nghiệm (năm) *</label>
              <input type="number" name="experience" min="0" value={formData.experience} onChange={handleChange} required />
            </div>
            
            <div className={styles.formGroup}>
              <label>Học phí/giờ (VNĐ) *</label>
              <input type="number" name="hourlyRate" min="0" value={formData.hourlyRate} onChange={handleChange} required />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Trình độ</label>
            <select name="skillLevel" value={formData.skillLevel} onChange={handleChange}>
              <option value="Beginner">Mới bắt đầu</option>
              <option value="Intermediate">Trung cấp</option>
              <option value="Advanced">Nâng cao</option>
              <option value="Professional">Chuyên nghiệp</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Chuyên môn</label>
            <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Chứng chỉ (URL hoặc text)</label>
            <input type="text" name="certificate" value={formData.certificate} onChange={handleChange} />
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
