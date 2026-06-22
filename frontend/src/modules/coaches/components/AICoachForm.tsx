import React, { useState } from 'react';
import styles from './AICoachForm.module.css';

export type AICoachPayload = {
  goal: string;
  level: string;
  budget: string;
  availableTime: string;
  description: string;
};

interface AICoachFormProps {
  onSubmit: (data: AICoachPayload) => void;
  isLoading: boolean;
}

const AICoachForm: React.FC<AICoachFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<AICoachPayload>({
    goal: '',
    level: 'Beginner',
    budget: '200.000đ - 500.000đ',
    availableTime: 'Buổi tối (18h - 22h)',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={styles.aiFormCard}>
      <div className={styles.header}>
        <h3>🤖 AI Recommendation</h3>
        <span className={styles.badge}>BETA</span>
      </div>
      <p className={styles.desc}>Tìm HLV phù hợp nhất với mục tiêu học của bạn</p>

      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Mục tiêu của bạn là gì?</label>
            <input 
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              placeholder="VD: Cải thiện kỹ thuật dink..." 
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Trình độ hiện tại</label>
            <select name="level" value={formData.level} onChange={handleChange}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Professional">Professional</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Ngân sách / giờ</label>
            <select name="budget" value={formData.budget} onChange={handleChange}>
              <option value="Dưới 200.000đ">Dưới 200.000đ</option>
              <option value="200.000đ - 500.000đ">200.000đ - 500.000đ</option>
              <option value="500.000đ - 1.000.000đ">500.000đ - 1.000.000đ</option>
              <option value="Trên 1.000.000đ">Trên 1.000.000đ</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Thời gian rảnh</label>
            <select name="availableTime" value={formData.availableTime} onChange={handleChange}>
              <option value="Sáng (6h - 12h)">Sáng (6h - 12h)</option>
              <option value="Chiều (12h - 18h)">Chiều (12h - 18h)</option>
              <option value="Buổi tối (18h - 22h)">Buổi tối (18h - 22h)</option>
              <option value="Cuối tuần">Cuối tuần</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Mô tả mong muốn</label>
            <input 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="VD: Coach kiên nhẫn..." 
            />
          </div>
          <div className={styles.submitGroup}>
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              ✨ {isLoading ? 'Đang phân tích...' : 'Phân tích bằng AI'}
            </button>
          </div>
        </div>
      </form>

      <div className={styles.footer}>
        <div className={styles.footerItem}>
          <span>🟢 AI sử dụng <a href="#">Gemini</a> để phân tích nhu cầu của bạn</span>
        </div>
        <div className={styles.footerItem}>
          <span>⚙️ Kết quả dựa trên 805+ HLV đã được đánh giá</span>
        </div>
        <div className={styles.footerItem}>
          <span>🔒 Bảo mật thông tin tuyệt đối</span>
        </div>
      </div>
    </div>
  );
};

export default AICoachForm;
