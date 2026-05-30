"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCoachById } from "@/services/coachApi";
import type { Coach } from "@/types/coach";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import styles from "./CoachDetailPage.module.css";

const SKILL_LABELS: Record<string, string> = {
  Beginner: "Mới bắt đầu",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
  Professional: "Chuyên nghiệp",
};

export default function CoachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    async function loadCoach() {
      try {
        setLoading(true);
        setError("");
        const data = await getCoachById(id);
        if (mounted) setCoach(data);
      } catch (err) {
        if (mounted)
          setError(
            err instanceof Error ? err.message : "Không tải được thông tin Coach."
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCoach();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className={`container ${styles.page}`}>
        <StateBox variant="loading" title="Đang tải thông tin Coach" />
      </main>
    );
  }

  if (error || !coach) {
    return (
      <main className={`container ${styles.page}`}>
        <StateBox
          variant="error"
          title="Không tìm thấy Coach"
          description={error || "Coach này không tồn tại hoặc chưa được duyệt."}
        />
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← Quay lại
        </button>
      </main>
    );
  }

  return (
    <main className={`container ${styles.page}`}>
      <button className={styles.backBtn} onClick={() => router.back()}>
        ← Quay lại danh sách
      </button>

      <div className={styles.card}>
        {/* Left: Avatar & basic */}
        <aside className={styles.sidebar}>
          <div className={styles.avatarWrap}>
            <img
              src={coach.AvatarURL || "/images/home/avatar-placeholder.jpg"}
              alt={coach.FullName}
              className={styles.avatar}
            />
            <span className={styles.skillBadge}>
              {SKILL_LABELS[coach.SkillLevel ?? ""] || coach.SkillLevel}
            </span>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>⭐ {Number(coach.AverageRating || 0).toFixed(1)}</strong>
              <span>Đánh giá</span>
            </div>
            <div className={styles.stat}>
              <strong>{coach.ExperienceYears || 0}</strong>
              <span>Năm KN</span>
            </div>
            <div className={styles.stat}>
              <strong>{coach.TotalStudents || 0}+</strong>
              <span>Học viên</span>
            </div>
          </div>

          <div className={styles.fee}>
            <span className={styles.feeLabel}>Học phí</span>
            <strong className={styles.feeValue}>
              {formatCurrency(coach.HourlyRate)}
            </strong>
            <span className={styles.feeUnit}>/ giờ</span>
          </div>

          <button className={styles.bookBtn} type="button" disabled>
            📅 Đặt lịch học (sắp có)
          </button>
        </aside>

        {/* Right: Detail */}
        <section className={styles.detail}>
          <h1 className={styles.name}>{coach.FullName}</h1>

          {coach.Specialization && (
            <p className={styles.specialization}>🎯 {coach.Specialization}</p>
          )}

          {coach.Biography && (
            <div className={styles.section}>
              <h2>Giới thiệu</h2>
              <p>{coach.Biography}</p>
            </div>
          )}

          <div className={styles.section}>
            <h2>Thông tin chuyên môn</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Trình độ</span>
                <span className={styles.infoValue}>
                  {SKILL_LABELS[coach.SkillLevel ?? ""] ||
                    coach.SkillLevel ||
                    "—"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Kinh nghiệm</span>
                <span className={styles.infoValue}>
                  {coach.ExperienceYears || 0} năm
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Chuyên môn</span>
                <span className={styles.infoValue}>
                  {coach.Specialization || "Kỹ thuật Pickleball"}
                </span>
              </div>
              {coach.Certifications && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Chứng chỉ</span>
                  <span className={styles.infoValue}>
                    {coach.Certifications}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.notice}>
            💡 Tính năng đặt lịch học Coach sẽ sớm ra mắt. Hãy theo dõi để
            không bỏ lỡ!
          </div>
        </section>
      </div>
    </main>
  );
}
