"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCourts, getCourtSlots } from "@/services/courtApi";
import type { CourtSlot } from "@/services/courtApi";
import { getCoaches, getCoachSchedulesPublic } from "@/services/coachApi";
import { bookCombo } from "@/services/bookingApi";
import { getToken } from "@/utils/authStorage";
import type { Court } from "@/types/court";
import type { Coach, CoachSchedule } from "@/types/coach";
import StateBox from "@/components/common/StateBox";
import styles from "./ComboBookingWizard.module.css";
import { formatCurrency } from "@/utils/formatCurrency";

function todayStr() {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function formatTime(timeStr?: string) {
  if (!timeStr) return "";
  if (timeStr.includes("T")) return timeStr.split("T")[1].slice(0, 5);
  return timeStr.slice(0, 5);
}

function formatDateVN(date: string) {
  return new Date(date).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getCourtImage(court: Court) {
  const c = court as any;
  return (
    c.ImageURL ||
    c.ImageUrl ||
    c.CourtImage ||
    c.Image ||
    c.imageUrl ||
    "/images/courts/court-1.jpg"
  );
}

function getCoachAvatar(coach: Coach) {
  const c = coach as any;
  return (
    c.AvatarURL ||
    c.AvatarUrl ||
    c.ImageURL ||
    c.Image ||
    "/images/home/avatar-placeholder.jpg"
  );
}

export default function ComboBookingWizard() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [bookingDate, setBookingDate] = useState(todayStr());

  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  const [slots, setSlots] = useState<CourtSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<CourtSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [coachSchedules, setCoachSchedules] = useState<
    Record<number, CoachSchedule[]>
  >({});
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  useEffect(() => {
    async function loadCourts() {
      try {
        setLoading(true);
        const data = await getCourts();
        const available = data.filter((c) => c.Status === "Available");
        setCourts(available);
        if (available.length > 0) setSelectedCourt(available[0]);
      } catch {
        setError("Không tải được danh sách sân.");
      } finally {
        setLoading(false);
      }
    }

    loadCourts();
  }, []);
useEffect(() => {
  if (!selectedCourt || !bookingDate) {
    setSlots([]);
    setSelectedSlot(null);
    return;
  }

  const courtId = selectedCourt.CourtID;

  async function loadSlots() {
    try {
      setLoadingSlots(true);
      const data = await getCourtSlots(courtId, bookingDate);
      setSlots(data);

      const firstAvailable = data.find((s) => s.Status === "Available");
      setSelectedSlot(firstAvailable || null);
    } catch {
      setSlots([]);
      setSelectedSlot(null);
    } finally {
      setLoadingSlots(false);
    }
  }

  loadSlots();
}, [selectedCourt, bookingDate]);
  useEffect(() => {
    if (step !== 2) return;

    async function loadCoaches() {
      try {
        setLoadingCoaches(true);
        const data = await getCoaches();
        setCoaches(data);

        const record: Record<number, CoachSchedule[]> = {};

        await Promise.all(
          data.map(async (coach) => {
            try {
              record[coach.CoachID] = await getCoachSchedulesPublic(
                coach.CoachID,
                bookingDate
              );
            } catch {
              record[coach.CoachID] = [];
            }
          })
        );

        setCoachSchedules(record);
      } catch {
        setError("Không tải được danh sách HLV.");
      } finally {
        setLoadingCoaches(false);
      }
    }

    loadCoaches();
  }, [step, bookingDate]);

  const availableSlots = useMemo(() => {
    return slots.filter((s) => s.Status === "Available");
  }, [slots]);

  const availableCoaches = useMemo(() => {
    if (!selectedSlot) return [];

    return coaches.filter((coach) => {
      const schedules = coachSchedules[coach.CoachID] || [];

      return schedules.some(
        (s) =>
          s.Status === "Available" &&
          formatTime(s.StartTime) === formatTime(selectedSlot.StartTime) &&
          formatTime(s.EndTime) === formatTime(selectedSlot.EndTime)
      );
    });
  }, [coaches, coachSchedules, selectedSlot]);

  const courtPrice = Number(selectedCourt?.PricePerHour || 0);
  const coachPrice = Number(selectedCoach?.HourlyRate || 0);
  const totalPrice = courtPrice + coachPrice;

  async function handleBook() {
    const token = getToken();

    if (!token) {
      alert("Vui lòng đăng nhập để đặt Combo.");
      router.push("/login");
      return;
    }

    if (!selectedCourt || !selectedSlot || !selectedCoach) return;

    try {
      setLoading(true);

      await bookCombo(token, {
        courtId: selectedCourt.CourtID,
        coachId: selectedCoach.CoachID,
        bookingDate,
        startTime: formatTime(selectedSlot.StartTime),
        endTime: formatTime(selectedSlot.EndTime),
      });

      alert("Đặt Combo thành công! Vui lòng thanh toán để giữ chỗ.");
      router.push("/profile");
    } catch (err: any) {
      alert(err?.message || "Đặt Combo thất bại.");
    } finally {
      setLoading(false);
    }
  }

  function goNext() {
    if (step === 1 && selectedCourt && selectedSlot) setStep(2);
    else if (step === 2 && selectedCoach) setStep(3);
    else if (step === 3) handleBook();
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Trải nghiệm hoàn hảo</span>
          <h1>Đặt Combo (Sân + HLV)</h1>
          <p>
            Tối ưu hóa buổi tập của bạn bằng cách chọn sân và HLV chuyên nghiệp
            trong cùng một khung giờ chỉ với vài thao tác.
          </p>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.pattern} />
          <img
            src="/images/home/pickleball.png"
            alt="Pickleball"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      </section>

      <section className={styles.stepBox}>
        <div
          className={`${styles.stepItem} ${
            step === 1 ? styles.active : step > 1 ? styles.done : ""
          }`}
        >
          <span>1</span>
          <div>
            <strong>Chọn Sân & Giờ</strong>
            <p>Chọn sân và khung giờ phù hợp</p>
          </div>
        </div>

        <div className={styles.arrow}>→</div>

        <div
          className={`${styles.stepItem} ${
            step === 2 ? styles.active : step > 2 ? styles.done : ""
          }`}
        >
          <span>2</span>
          <div>
            <strong>Chọn Huấn Luyện Viên</strong>
            <p>Chọn HLV phù hợp với bạn</p>
          </div>
        </div>

        <div className={styles.arrow}>→</div>

        <div className={`${styles.stepItem} ${step === 3 ? styles.active : ""}`}>
          <span>3</span>
          <div>
            <strong>Xác nhận & Thanh toán</strong>
            <p>Kiểm tra thông tin và thanh toán</p>
          </div>
        </div>
      </section>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      <section className={styles.layout}>
        <div className={styles.mainPanel}>
          {step === 1 && (
            <>
              <div className={styles.panelHeader}>
                <div className={styles.iconBox}>▣</div>
                <div>
                  <h2>Chọn ngày & giờ</h2>
                  <p>Chọn ngày và khung giờ bạn muốn đặt sân.</p>
                </div>
              </div>

              <div className={styles.dateRow}>
                <input
                  type="date"
                  min={todayStr()}
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                  className={styles.dateInput}
                />

                <div className={styles.slotList}>
                  {loadingSlots ? (
                    <span className={styles.muted}>Đang tải giờ...</span>
                  ) : availableSlots.length > 0 ? (
                    availableSlots.slice(0, 7).map((slot) => (
                      <button
                        key={slot.SlotID}
                        className={`${styles.timeBtn} ${
                          selectedSlot?.SlotID === slot.SlotID
                            ? styles.timeActive
                            : ""
                        }`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {formatTime(slot.StartTime)}
                      </button>
                    ))
                  ) : (
                    <span className={styles.emptyText}>Chưa có giờ trống</span>
                  )}
                </div>
              </div>

              <div className={styles.sectionTitle}>
                <div>
                  <h2>Chọn sân Pickleball</h2>
                  <p>Vui lòng chọn 1 sân còn trống trong khung giờ đã chọn.</p>
                </div>

                <div className={styles.legend}>
                  <span>
                    <i className={styles.greenDot} /> Còn trống
                  </span>
                  <span>
                    <i className={styles.grayDot} /> Đã đặt
                  </span>
                </div>
              </div>

              {loading ? (
                <StateBox variant="loading" title="Đang tải sân..." />
              ) : (
                <div className={styles.courtGrid}>
                  {courts.map((court) => (
                    <button
                      type="button"
                      key={court.CourtID}
                      className={`${styles.courtCard} ${
                        selectedCourt?.CourtID === court.CourtID
                          ? styles.courtSelected
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedCourt(court);
                        setSelectedSlot(null);
                      }}
                    >
                      <div className={styles.courtImage}>
                        <img src={getCourtImage(court)} alt={court.CourtName} />
                        <span>Còn trống</span>
                      </div>

                      <div className={styles.courtInfo}>
                        <div className={styles.cardTop}>
                          <h3>{court.CourtName}</h3>
                          <i />
                        </div>

                        <p>
                          {court.CourtType === "Indoor"
                            ? "Trong nhà"
                            : "Ngoài trời"}{" "}
                          • {court.Location}
                        </p>

                        <div className={styles.meta}>
                          <span>👥 4 người</span>
                          <span>▦ Sân tiêu chuẩn</span>
                        </div>

                        <strong>
                          {formatCurrency(court.PricePerHour)} <em>/ giờ</em>
                        </strong>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.panelHeader}>
                <div className={styles.iconBox}>☑</div>
                <div>
                  <h2>Chọn Huấn Luyện Viên</h2>
                  <p>
                    HLV hiển thị bên dưới đang rảnh trong khung giờ bạn đã chọn.
                  </p>
                </div>
              </div>

              <div className={styles.notice}>
                Bạn đang chọn HLV cho khung giờ{" "}
                <strong>
                  {formatTime(selectedSlot?.StartTime)} -{" "}
                  {formatTime(selectedSlot?.EndTime)}
                </strong>{" "}
                tại <strong>{selectedCourt?.CourtName}</strong>.
              </div>

              {loadingCoaches ? (
                <StateBox variant="loading" title="Đang tìm HLV rảnh..." />
              ) : availableCoaches.length === 0 ? (
                <div className={styles.emptyBox}>
                  <h3>Không có HLV rảnh trong khung giờ này</h3>
                  <p>Bạn hãy quay lại chọn sân hoặc khung giờ khác.</p>
                  <button onClick={() => setStep(1)}>← Chọn lại giờ</button>
                </div>
              ) : (
                <div className={styles.coachGrid}>
                  {availableCoaches.map((coach) => (
                    <button
                      type="button"
                      key={coach.CoachID}
                      className={`${styles.coachCard} ${
                        selectedCoach?.CoachID === coach.CoachID
                          ? styles.coachSelected
                          : ""
                      }`}
                      onClick={() => setSelectedCoach(coach)}
                    >
                      <img src={getCoachAvatar(coach)} alt={coach.FullName} />

                      <div>
                        <h3>{coach.FullName}</h3>
                        <p>Kinh nghiệm {coach.ExperienceYears} năm</p>
                        <span>⭐ {Number(coach.AverageRating || 0).toFixed(1)}</span>
                        <strong>
                          {formatCurrency(coach.HourlyRate)} <em>/ giờ</em>
                        </strong>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div className={styles.panelHeader}>
                <div className={styles.iconBox}>✓</div>
                <div>
                  <h2>Xác nhận thông tin</h2>
                  <p>Kiểm tra lại thông tin combo trước khi thanh toán.</p>
                </div>
              </div>

              <div className={styles.confirmBox}>
                <h3>Chi tiết đặt combo</h3>

                <div className={styles.confirmRow}>
                  <span>Ngày chơi</span>
                  <strong>{formatDateVN(bookingDate)}</strong>
                </div>

                <div className={styles.confirmRow}>
                  <span>Khung giờ</span>
                  <strong>
                    {formatTime(selectedSlot?.StartTime)} -{" "}
                    {formatTime(selectedSlot?.EndTime)}
                  </strong>
                </div>

                <div className={styles.confirmRow}>
                  <span>Sân</span>
                  <strong>{selectedCourt?.CourtName}</strong>
                </div>

                <div className={styles.confirmRow}>
                  <span>Huấn luyện viên</span>
                  <strong>{selectedCoach?.FullName}</strong>
                </div>

                <div className={styles.totalLine}>
                  <span>Tổng thanh toán</span>
                  <strong>{formatCurrency(totalPrice)}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className={styles.sidebar}>
          <h2>Thông tin đặt combo</h2>

          <div className={styles.sideBlock}>
            <label>Ngày</label>
            <p>📅 {formatDateVN(bookingDate)}</p>
          </div>

          <div className={styles.sideBlock}>
            <label>Giờ</label>
            <p>
              🕘{" "}
              {selectedSlot
                ? `${formatTime(selectedSlot.StartTime)} - ${formatTime(
                    selectedSlot.EndTime
                  )}`
                : "Chưa chọn"}
            </p>
          </div>

          <div className={styles.sideBlock}>
            <label>Sân đã chọn</label>

            {selectedCourt ? (
              <div className={styles.sideCourt}>
                <img
                  src={getCourtImage(selectedCourt)}
                  alt={selectedCourt.CourtName}
                />
                <div>
                  <strong>{selectedCourt.CourtName}</strong>
                  <p>
                    {selectedCourt.CourtType === "Indoor"
                      ? "Trong nhà"
                      : "Ngoài trời"}{" "}
                    • {selectedCourt.Location}
                  </p>
                  <b>{formatCurrency(selectedCourt.PricePerHour)} / giờ</b>
                </div>
              </div>
            ) : (
              <p>Chưa chọn sân</p>
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.sideBlock}>
            <label>Huấn luyện viên</label>

            {selectedCoach ? (
              <div className={styles.sideCoach}>
                <img
                  src={getCoachAvatar(selectedCoach)}
                  alt={selectedCoach.FullName}
                />
                <div>
                  <strong>{selectedCoach.FullName}</strong>
                  <p>{formatCurrency(selectedCoach.HourlyRate)} / giờ</p>
                </div>
              </div>
            ) : (
              <p className={styles.linkText}>Chưa chọn</p>
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.totalBox}>
            <span>Tổng tiền tạm tính</span>
            <strong>{formatCurrency(totalPrice)}</strong>
          </div>

          <div className={styles.tip}>
            Bạn sẽ chọn HLV và thanh toán ở bước tiếp theo.
          </div>
        </aside>
      </section>

      <div className={styles.bottomBar}>
        <button
          className={styles.backBtn}
          onClick={() => {
            if (step === 1) router.back();
            else setStep((step - 1) as 1 | 2 | 3);
          }}
        >
          ← Quay lại
        </button>

        <button
          className={styles.nextBtn}
          disabled={
            (step === 1 && (!selectedCourt || !selectedSlot)) ||
            (step === 2 && !selectedCoach) ||
            loading
          }
          onClick={goNext}
        >
          {step === 1 && "Tiếp tục: Chọn HLV →"}
          {step === 2 && "Tiếp tục: Xác nhận →"}
          {step === 3 && (loading ? "Đang xử lý..." : "Thanh toán ngay →")}
        </button>
      </div>
    </main>
  );
}
