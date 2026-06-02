"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCoachById, getCoachSchedulesPublic } from "@/services/coachApi";
import { getImageUrl } from "@/utils/image";
import type { Coach, CoachSchedule } from "@/types/coach";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import CoachBookingModal from "./CoachBookingModal";
import styles from "./CoachDetailPage.module.css";

const todayVN = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

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

  const [date, setDate] = useState(todayVN());
  const [schedules, setSchedules] = useState<CoachSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<CoachSchedule | null>(null);

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

  useEffect(() => {
    if (!coach) return;
    let mounted = true;

    async function loadSchedules() {
      try {
        setLoadingSchedules(true);
        const data = await getCoachSchedulesPublic(coach!.CoachID, date);
        if (mounted) setSchedules(data);
      } catch (err) {
        console.error("Failed to load coach schedules", err);
      } finally {
        if (mounted) setLoadingSchedules(false);
      }
    }

    loadSchedules();
    return () => {
      mounted = false;
    };
  }, [coach, date]);

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
              src={getImageUrl(coach.AvatarURL)}
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

          <a href="#booking-section" className={styles.bookBtn}>
            📅 Đặt lịch học
          </a>
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
                    {coach.Certifications.startsWith("/uploads") ? (
                      <a
                        href={getImageUrl(coach.Certifications)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#0070f3", textDecoration: "underline" }}
                      >
                        Xem ảnh chứng chỉ
                      </a>
                    ) : (
                      coach.Certifications
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Picker */}
          <div id="booking-section" className={styles.section}>
            <h2>Lịch dạy của HLV</h2>
            <div className={styles.scheduleTools}>
              <label>📅 Chọn ngày:</label>
              <input 
                type="date" 
                value={date} 
                min={todayVN()} 
                onChange={(e) => setDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>

            {loadingSchedules ? (
              <div className={styles.loadingSlots}>Đang tải lịch học...</div>
            ) : schedules.length === 0 ? (
              <div className={styles.emptySlots}>HLV chưa có lịch trống trong ngày này.</div>
            ) : (
              <div className={styles.slotsGrid}>
                {schedules.map((sch) => (
                  <div key={sch.CoachScheduleID} className={styles.slotCard}>
                    <div className={styles.slotTime}>{sch.StartTime} - {sch.EndTime}</div>
                    <button 
                      className={styles.slotBookBtn}
                      onClick={() => setSelectedSchedule(sch)}
                    >
                      Đặt lịch
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedSchedule && coach && (
        <CoachBookingModal 
          coach={coach}
          schedule={selectedSchedule}
          bookingDate={date}
          onClose={() => setSelectedSchedule(null)}
          onSuccess={() => {
            setSelectedSchedule(null);
            // Refresh schedules
            getCoachSchedulesPublic(coach.CoachID, date).then(setSchedules);
            router.push("/profile");
          }}
        />
      )}
    </main>
  );
}
