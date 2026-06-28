import React, { useState } from "react";
import { FaStar, FaTimes } from "react-icons/fa";
import styles from "./ReviewModal.module.css";
import { reviewApi } from "@/services/reviewApi";
import Toast from "@/modules/staff/shared/Toast";
import { getToken } from "@/utils/authStorage";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: number; // Optional. If omitted, it checks courtId/coachId or does Club Review
  courtId?: number;
  coachId?: number;
  title: string;
  onSuccess: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  bookingId,
  courtId,
  coachId,
  title,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Vui lòng chọn số sao đánh giá.");
      return;
    }
    if (comment.trim().length < 5) {
      setError("Bình luận phải có ít nhất 5 ký tự.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const token = getToken();
      if (!token) throw new Error("Vui lòng đăng nhập để đánh giá.");

      await reviewApi.createReview({
        bookingId,
        courtId,
        coachId,
        rating,
        comment: comment.trim(),
      }, token);
      setToast({ message: "Đánh giá thành công!", type: "success" });
      setTimeout(() => {
        setRating(0);
        setComment("");
        setToast(null);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi gửi đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          {toast && <Toast message={toast.message} type={toast.type} visible={true} onClose={() => setToast(null)} />}
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.ratingSection}>
            <p>Bạn đánh giá trải nghiệm này thế nào?</p>
            <div className={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  size={32}
                  className={star <= (hover || rating) ? styles.starFilled : styles.starEmpty}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                />
              ))}
            </div>
          </div>

          <div className={styles.commentSection}>
            <label>Nội dung đánh giá</label>
            <textarea
              placeholder="Chia sẻ trải nghiệm của bạn (tối thiểu 5 ký tự)..."
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              rows={5}
            />
            <div className={styles.charCount}>
              {comment.length}/500 ký tự
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}
