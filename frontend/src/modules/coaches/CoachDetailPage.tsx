"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCoachById, getCoachSchedulesPublic } from "@/services/coachApi";
import { getCoachImageUrl } from "@/utils/image";
import type { Coach, CoachSchedule } from "@/types/coach";
import { formatCurrency } from "@/utils/formatCurrency";
import { reviewApi } from "@/services/reviewApi";
import type { Review, ReviewStats } from "@/types/review";
import StateBox from "@/components/common/StateBox";
import CoachBookingModal from "./CoachBookingModal";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewStatsView from "@/components/reviews/ReviewStatsView";
import ReviewModal from "@/components/reviews/ReviewModal";
import styles from "./CoachDetailPage.module.css";

const todayVN = () => {
  const d = new Date();
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
};

const SKILL_LABELS: Record<string, string> = {
  Beginner: "Mới bắt đầu",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
  Professional: "Chuyên nghiệp",
};

// Custom monthly calendar component for premium booking feel
function Calendar({ selectedDate, onChange }: { selectedDate: string; onChange: (date: string) => void }) {
  const [current, setCurrent] = useState(() => {
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    }
    return new Date();
  });

  const year = current.getFullYear();
  const month = current.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrent(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrent(new Date(year, month + 1, 1));
  };

  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const firstDayOfWeek = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const formatDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <button type="button" onClick={handlePrevMonth} className={styles.monthNavBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.monthYearTitle}>{monthNames[month]} {year}</span>
        <button type="button" onClick={handleNextMonth} className={styles.monthNavBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
      <div className={styles.weekdayRow}>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
      <div className={styles.calendarDaysGrid}>
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className={styles.emptyDayCell} />;
          }

          const dateStr = formatDateString(day);
          const isSelected = dateStr === selectedDate;
          const isPast = dateStr < todayVN();

          return (
            <button
              key={`day-${day}`}
              type="button"
              disabled={isPast}
              onClick={() => onChange(dateStr)}
              className={`${styles.dayCell} ${isSelected ? styles.daySelected : ""} ${
                isPast ? styles.dayPast : ""
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

  // Review State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | undefined>(undefined);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Bottom column schedules for next 4 days
  const [upcomingSchedules, setUpcomingSchedules] = useState<{ date: string; label: string; slots: CoachSchedule[] }[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

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

  useEffect(() => {
    if (!coach) return;
    async function fetchReviews() {
      try {
        setLoadingReviews(true);
        const data = await reviewApi.getCoachReviews(coach!.CoachID, reviewPage, 5);
        setReviews(data.data);
        setReviewStats(data.stats);
        setReviewTotalPages(data.totalPages);
      } catch (err) {
        console.error("Failed to load reviews");
      } finally {
        setLoadingReviews(false);
      }
    }
    fetchReviews();
  }, [coach, reviewPage]);

  // Load upcoming 4 days schedules
  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function loadUpcoming() {
      try {
        if (mounted) setLoadingUpcoming(true);
        const daysList = [];
        const now = new Date();
        const vnDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));

        const weekdaysVI = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

        for (let i = 0; i < 4; i++) {
          const offsetDate = new Date(vnDate);
          offsetDate.setDate(vnDate.getDate() + i);
          const dateStr = offsetDate.toLocaleDateString("sv-SE");

          let label = "";
          if (i === 0) {
            label = "Hôm nay";
          } else {
            const dayIdx = offsetDate.getDay();
            label = weekdaysVI[dayIdx];
          }

          const formattedLabel = `${label} - ${String(offsetDate.getDate()).padStart(2, "0")}/${String(offsetDate.getMonth() + 1).padStart(2, "0")}`;

          const data = await getCoachSchedulesPublic(id, dateStr);
          daysList.push({
            date: dateStr,
            label: formattedLabel,
            slots: data.filter((s) => s.Status === "Available")
          });
        }
        if (mounted) setUpcomingSchedules(daysList);
      } catch (err) {
        console.error("Failed to load upcoming schedules", err);
      } finally {
        if (mounted) setLoadingUpcoming(false);
      }
    }

    loadUpcoming();
    return () => {
      mounted = false;
    };
  }, [id]);

  const activeSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (s.Status !== "Available") return false;

      // Filter out past hours for today
      const now = new Date();
      const vnDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      const todayStr = vnDate.toLocaleDateString("sv-SE");

      if (date === todayStr) {
        const currentHour = vnDate.getHours();
        const currentMin = vnDate.getMinutes();
        const currentVNTime = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
        if (s.StartTime < currentVNTime) {
          return false;
        }
      }
      return true;
    });
  }, [schedules, date]);

  const handleBookNow = () => {
    if (!selectedSchedule) return;
  };

  const handleUpcomingSlotClick = (dayDate: string, slot: CoachSchedule) => {
    setDate(dayDate);
    setSelectedSchedule(slot);
  };

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <div className="container" style={{ padding: "100px 0" }}>
          <StateBox variant="loading" title="Đang tải thông tin Coach..." />
        </div>
      </main>
    );
  }

  if (error || !coach) {
    return (
      <main className={styles.loadingPage}>
        <div className="container" style={{ padding: "100px 0" }}>
          <StateBox variant="error" title="Không tìm thấy HLV" description={error || "HLV này chưa được duyệt hoặc không tồn tại."} />
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button className={styles.backButton} onClick={() => router.push("/coaches")}>
              ← Quay lại danh sách Coach
            </button>
          </div>
        </div>
      </main>
    );
  }

  const expertiseList = coach.Specialization
    ? coach.Specialization.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Beginner Training", "Intermediate Development", "Match Strategy", "Tournament Preparation"];

  const formattedRate = formatCurrency(coach.HourlyRate);

  return (
    <main className={styles.page}>
      <div className={`container ${styles.container}`}>
        
        {/* Back navigation link */}
        <div className={styles.backBtnWrapper}>
          <button className={styles.backBtnLink} onClick={() => router.push("/coaches")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Quay lại danh sách coach
          </button>
        </div>

        {/* Banner Section */}
        <div className={styles.bannerSection}>
          <img
            src="/images/courts/c1.jpg"
            alt="Pickleball courts action banner"
            className={styles.bannerImage}
          />
        </div>

        {/* Main Grid */}
        <div className={styles.mainGrid}>
          {/* Left Column: Profile Card & Coach Details */}
          <div className={styles.leftCol}>
            
            {/* Profile Header */}
            <div className={styles.profileHeader}>
              <div className={styles.avatarWrapper}>
                <img
                  src={getCoachImageUrl(coach.AvatarURL)}
                  alt={coach.FullName}
                  className={styles.avatar}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes("hlv1.png")) {
                      target.src = "/images/coaches/hlv1.png";
                    }
                  }}
                />
                <span className={styles.availableBadge}>Available</span>
              </div>
              <div className={styles.profileMainInfo}>
                <h1 className={styles.coachName}>
                  {coach.FullName}
                  <span className={styles.verifiedBadge}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="var(--pcs-brand-primary)"/>
                      <path d="M8.5 12.5L11 15L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </h1>
                <p className={styles.coachTitle}>
                  {SKILL_LABELS[coach.SkillLevel ?? ""] || coach.SkillLevel} Pickleball Coach
                </p>
                <p className={styles.coachSubBio}>
                  Passionate about helping players of all levels improve their skills, build confidence and enjoy the game.
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
              <div className={styles.statCell}>
                <div className={styles.statVal}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--pcs-status-warning)" style={{ marginRight: "4px" }}>
                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"/>
                  </svg>
                  {Number(coach.AverageRating || 0).toFixed(1)}
                </div>
                <span className={styles.statLbl}>({reviewStats?.TotalReviews || 0} reviews)</span>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statVal}>{coach.TotalStudents || 0}+</div>
                <span className={styles.statLbl}>Students</span>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statVal}>{coach.ExperienceYears || 0}</div>
                <span className={styles.statLbl}>Years experience</span>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statVal}>PPR</div>
                <span className={styles.statLbl}>Certified</span>
              </div>
            </div>

            {/* Details Single Card */}
            <div className={styles.detailsCard}>
              {/* About Coach */}
              <section className={styles.section}>
                <h2>About Coach</h2>
                <p className={styles.bioText}>
                  {coach.Biography || `I have been coaching pickleball for over 5 years and have worked with players from beginners to advanced competitors. My coaching focuses on technique, strategy, and match mindset to help you improve faster and enjoy the game more.`}
                </p>
              </section>

              {/* Expertise */}
              <section className={styles.section}>
                <h2>Expertise</h2>
                <div className={styles.expertisePills}>
                  {expertiseList.map((skill, idx) => (
                    <span key={idx} className={styles.expertisePill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              {/* Experience */}
              <section className={styles.section}>
                <h2>Experience</h2>
                <ul className={styles.experienceList}>
                  <li>
                    <span className={styles.checkIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>{coach.ExperienceYears || 5}+ years coaching experience</span>
                  </li>
                  <li>
                    <span className={styles.checkIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>{coach.TotalStudents || 120}+ students trained</span>
                  </li>
                  <li>
                    <span className={styles.checkIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>PPR Certified Coach</span>
                  </li>
                  <li>
                    <span className={styles.checkIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>Former national tournament competitor</span>
                  </li>
                </ul>
              </section>

              {/* Reviews */}
              <section className={styles.section} style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ margin: 0 }}>Reviews</h2>
                  {reviewStats && reviewStats.TotalReviews > 0 && (
                    <div style={{ color: "var(--pcs-status-success)", fontWeight: 600, fontSize: "0.9rem" }}>
                      {Math.round(((reviewStats.Star4 + reviewStats.Star5) / reviewStats.TotalReviews) * 100)}% Khách hàng giới thiệu Coach này.
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setReviewModalOpen(true)}
                  style={{ position: "absolute", top: "0px", right: "0px", background: "#1677ff", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 500 }}
                >
                  Viết Đánh giá
                </button>

                <ReviewModal
                  isOpen={reviewModalOpen}
                  onClose={() => setReviewModalOpen(false)}
                  title={`Đánh giá HLV ${coach.FullName}`}
                  coachId={coach.CoachID}
                  onSuccess={() => {
                    setReviewModalOpen(false);
                    // Reload reviews
                    setReviewPage(1);
                    reviewApi.getCoachReviews(coach.CoachID, 1, 5).then(data => {
                      setReviews(data.data);
                      setReviewStats(data.stats);
                      setReviewTotalPages(data.totalPages);
                    });
                  }}
                />

                <ReviewStatsView stats={reviewStats} />
                <ReviewList
                  reviews={reviews}
                  loading={loadingReviews}
                  page={reviewPage}
                  totalPages={reviewTotalPages}
                  onPageChange={setReviewPage}
                />
              </section>
            </div>
          </div>

          {/* Right Column: Sticky Booking Card */}
          <div className={styles.rightCol}>
            <div className={styles.bookingCard}>
              <div className={styles.priceRow}>
                <span className={styles.price}>{formattedRate}</span>
                <span className={styles.unit}>/ giờ</span>
              </div>
              
              <span className={styles.lessonType}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                1-1 Private Lesson
              </span>

              {/* Custom monthly calendar selector */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Chọn ngày</label>
                <Calendar
                  selectedDate={date}
                  onChange={(newDate) => {
                    setDate(newDate);
                    setSelectedSchedule(null);
                  }}
                />
              </div>

              {/* Available hourly slot buttons list */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Chọn giờ</label>
                {loadingSchedules ? (
                  <div className={styles.slotsLoading}>Đang tải khung giờ...</div>
                ) : activeSchedules.length === 0 ? (
                  <div className={styles.slotsEmpty}>HLV không có lịch trống trong ngày này.</div>
                ) : (
                  <div className={styles.slotsGrid}>
                    {activeSchedules.map((sch) => {
                      const isSelected = selectedSchedule?.CoachScheduleID === sch.CoachScheduleID;
                      return (
                        <button
                          key={sch.CoachScheduleID}
                          type="button"
                          onClick={() => setSelectedSchedule(sch)}
                          className={`${styles.slotBtn} ${
                            isSelected ? styles.slotSelected : ""
                          }`}
                        >
                          {sch.StartTime.substring(0, 5)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Booking Actions */}
              <button
                type="button"
                onClick={handleBookNow}
                disabled={!selectedSchedule}
                className={styles.bookNowBtn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Đặt lịch ngay
              </button>

              <button type="button" className={styles.saveCoachBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                Lưu coach
              </button>

              <div className={styles.reassurance}>
                <div className={styles.reassuranceItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Xác nhận tức thì</span>
                </div>
                <div className={styles.reassuranceItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Hủy miễn phí 24h</span>
                </div>
                <div className={styles.reassuranceItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                  </svg>
                  <span>Hỗ trợ 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Full-width: Upcoming Schedules */}
        <section className={styles.upcomingSection}>
          <h2>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px", display: "inline-block", verticalAlign: "middle" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Lịch dạy sắp tới
          </h2>
          {loadingUpcoming ? (
            <div className={styles.upcomingLoading}>Đang tải lịch dạy tuần này...</div>
          ) : (
            <div className={styles.upcomingWrapper}>
              <div className={styles.upcomingGrid}>
                {upcomingSchedules.map((day, dIdx) => (
                  <div key={dIdx} className={styles.upcomingCol}>
                    <div className={styles.upcomingDayHeader}>{day.label}</div>
                    <div className={styles.upcomingSlotsWrap}>
                      {day.slots.length === 0 ? (
                        <span className={styles.upcomingNoSlots}>Không có lịch trống</span>
                      ) : (
                        day.slots.map((slot) => (
                          <button
                            key={slot.CoachScheduleID}
                            type="button"
                            onClick={() => handleUpcomingSlotClick(day.date, slot)}
                            className={styles.upcomingSlotBtn}
                          >
                            {slot.StartTime.substring(0, 5)}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.upcomingNextBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Booking confirmation modal */}
      {selectedSchedule && coach && (
        <CoachBookingModal
          coach={coach}
          schedule={selectedSchedule}
          bookingDate={date}
          onClose={() => setSelectedSchedule(null)}
          onSuccess={() => {
            setSelectedSchedule(null);
            // Reload schedules list
            getCoachSchedulesPublic(coach.CoachID, date).then(setSchedules);
            router.push("/profile");
          }}
        />
      )}
    </main>
  );
}
