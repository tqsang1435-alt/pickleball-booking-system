"use client";

import { useEffect, useState, useMemo } from "react";
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

export default function ComboBookingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  function formatTime(timeStr: string) {
    if (!timeStr) return "";
    if (timeStr.includes("T")) {
      return timeStr.split("T")[1].slice(0, 5);
    }
    return timeStr.slice(0, 5);
  }

  const [bookingDate, setBookingDate] = useState(todayStr());

  // Step 1: Court
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [slots, setSlots] = useState<CourtSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<CourtSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 2: Coach
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [coachSchedules, setCoachSchedules] = useState<Record<number, CoachSchedule[]>>({});
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  // Load Courts initially
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getCourts();
        setCourts(data.filter(c => c.Status === "Available"));
      } catch (err) {
        setError("Không tải được danh sách sân.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load Slots when Court or Date changes
  useEffect(() => {
    if (!selectedCourt || !bookingDate) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
    async function fetchSlots() {
      try {
        setLoadingSlots(true);
        const data = await getCourtSlots(selectedCourt!.CourtID, bookingDate);
        setSlots(data);
      } catch (err) {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [selectedCourt, bookingDate]);

  // Load Coaches when advancing to Step 2
  useEffect(() => {
    if (step === 2) {
      async function fetchCoaches() {
        try {
          setLoadingCoaches(true);
          const data = await getCoaches();
          setCoaches(data);

          // Fetch schedules for all coaches for this date
          const schedulesRecord: Record<number, CoachSchedule[]> = {};
          await Promise.all(
            data.map(async (c) => {
              try {
                const s = await getCoachSchedulesPublic(c.CoachID, bookingDate);
                schedulesRecord[c.CoachID] = s;
              } catch {
                schedulesRecord[c.CoachID] = [];
              }
            })
          );
          setCoachSchedules(schedulesRecord);
        } catch (err) {
          setError("Không tải được danh sách HLV.");
        } finally {
          setLoadingCoaches(false);
        }
      }
      fetchCoaches();
    }
  }, [step, bookingDate]);

  const availableCoaches = useMemo(() => {
    if (!selectedSlot) return [];
    return coaches.filter(c => {
      const schedules = coachSchedules[c.CoachID] || [];
      return schedules.some(s => s.Status === "Available" && s.StartTime === selectedSlot.StartTime && s.EndTime === selectedSlot.EndTime);
    });
  }, [coaches, coachSchedules, selectedSlot]);

  // Handle booking
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
      alert(err.message || "Đặt Combo thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <span className={styles.badge}>Trải nghiệm hoàn hảo</span>
        <h1>Đặt Combo (Sân + HLV)</h1>
        <p>Tối ưu hóa buổi tập của bạn bằng cách chọn sân và HLV chuyên nghiệp trong cùng một khung giờ chỉ với vài thao tác.</p>
      </div>

      <div className={styles.wizard}>
        {/* Step Indicator */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${step === 1 ? styles.active : step > 1 ? styles.completed : ""}`}>
            <span className={styles.stepNumber}>1</span>
            Chọn Sân & Giờ
          </div>
          <div className={`${styles.step} ${step === 2 ? styles.active : step > 2 ? styles.completed : ""}`}>
            <span className={styles.stepNumber}>2</span>
            Chọn Huấn Luyện Viên
          </div>
          <div className={`${styles.step} ${step === 3 ? styles.active : ""}`}>
            <span className={styles.stepNumber}>3</span>
            Xác nhận & Thanh toán
          </div>
        </div>

        {error && <div className={styles.error}>⚠️ {error}</div>}

        <div className={styles.content}>
          {/* STEP 1 */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.field}>
                <label>📅 Chọn ngày chơi</label>
                <input 
                  type="date" 
                  min={todayStr()} 
                  value={bookingDate}
                  onChange={e => {
                    setBookingDate(e.target.value);
                    setSelectedSlot(null); // Reset slot when date changes
                  }}
                  className={styles.input}
                />
              </div>

              <h3>🏟️ Chọn Sân Pickleball</h3>
              <div className={styles.grid}>
                {loading ? <StateBox variant="loading" title="Đang tải sân..." /> : courts.map(c => (
                  <div 
                    key={c.CourtID} 
                    className={`${styles.card} ${selectedCourt?.CourtID === c.CourtID ? styles.selectedCard : ""}`}
                    onClick={() => {
                      setSelectedCourt(c);
                      setSelectedSlot(null); // Reset slot when court changes
                    }}
                  >
                    <div className={styles.cardIcon}>🎾</div>
                    <h4>{c.CourtName}</h4>
                    <p className={styles.cardType}>{c.CourtType === "Indoor" ? "Trong nhà" : "Ngoài trời"} • {c.Location}</p>
                    <div className={styles.price}>{formatCurrency(c.PricePerHour)} <span>/ giờ</span></div>
                  </div>
                ))}
              </div>

              {selectedCourt && (
                <div className={styles.slotsSection}>
                  <h3>⏰ Chọn Giờ Trống</h3>
                  {loadingSlots ? <p style={{ color: "#64748b" }}>Đang tải lịch sân...</p> : (
                    <div className={styles.slots}>
                      {slots.filter(s => s.Status === "Available").map(s => (
                        <button
                          key={s.SlotID}
                          className={`${styles.slotBtn} ${selectedSlot?.SlotID === s.SlotID ? styles.selectedSlot : ""}`}
                          onClick={() => setSelectedSlot(s)}
                        >
                          {formatTime(s.StartTime)} - {formatTime(s.EndTime)}
                        </button>
                      ))}
                      {slots.filter(s => s.Status === "Available").length === 0 && (
                        <p style={{ color: "#e11d48", fontWeight: 500 }}>Rất tiếc, sân này đã kín lịch trong ngày {new Date(bookingDate).toLocaleDateString("vi-VN")}.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.actions}>
                <button 
                  disabled={!selectedSlot || !selectedCourt} 
                  className={styles.primaryBtn}
                  onClick={() => setStep(2)}
                >
                  Tiếp tục chọn HLV →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h3>👨‍🏫 Chọn Huấn Luyện Viên</h3>
              
              <div className={styles.selectedInfo}>
                <span>ℹ️</span> Bạn đang tìm HLV cho khung giờ: <strong>{formatTime(selectedSlot?.StartTime || "")} - {formatTime(selectedSlot?.EndTime || "")}</strong> ngày <strong>{new Date(bookingDate).toLocaleDateString("vi-VN")}</strong> tại sân <strong>{selectedCourt?.CourtName}</strong>.
              </div>
              
              {loadingCoaches ? <StateBox variant="loading" title="Đang tìm HLV rảnh..." /> : (
                <div className={styles.grid}>
                  {availableCoaches.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                      <p style={{ fontSize: "1.1rem", color: "#64748b", marginBottom: "15px" }}>Rất tiếc, không có HLV nào rảnh vào khung giờ này.</p>
                      <button className={styles.secondaryBtn} onClick={() => setStep(1)}>← Chọn khung giờ khác</button>
                    </div>
                  ) : availableCoaches.map(c => (
                    <div 
                      key={c.CoachID} 
                      className={`${styles.card} ${selectedCoach?.CoachID === c.CoachID ? styles.selectedCard : ""}`}
                      onClick={() => setSelectedCoach(c)}
                    >
                      <div className={styles.coachHeader}>
                        <img src={c.AvatarURL || "/images/home/avatar-placeholder.jpg"} alt={c.FullName} className={styles.avatar} />
                        <div>
                          <h4>{c.FullName}</h4>
                          <span className={styles.rating}>⭐ {Number(c.AverageRating).toFixed(1)}</span>
                        </div>
                      </div>
                      <p className={styles.cardType}>Kinh nghiệm: {c.ExperienceYears} năm</p>
                      <div className={styles.price}>{formatCurrency(c.HourlyRate)} <span>/ giờ</span></div>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.actions}>
                <button className={styles.secondaryBtn} onClick={() => setStep(1)}>← Quay lại</button>
                <button 
                  disabled={!selectedCoach} 
                  className={styles.primaryBtn}
                  onClick={() => setStep(3)}
                >
                  Xác nhận Combo →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && selectedCourt && selectedSlot && selectedCoach && (
            <div className={styles.stepContent}>
              <div className={styles.summaryContainer}>
                <div className={styles.summaryBox}>
                  <div className={styles.summaryTitle}>📄 Chi Tiết Đặt Combo</div>
                  
                  <div className={styles.summaryItem}>
                    <span>Ngày chơi:</span>
                    <strong>{new Date(bookingDate).toLocaleDateString("vi-VN")}</strong>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Khung giờ:</span>
                    <strong>{formatTime(selectedSlot.StartTime)} - {formatTime(selectedSlot.EndTime)}</strong>
                  </div>
                  
                  <hr />
                  
                  <div className={styles.summaryItem}>
                    <span>Sân ({selectedCourt.CourtName}):</span>
                    <strong>{formatCurrency(selectedCourt.PricePerHour)}</strong>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>HLV ({selectedCoach.FullName}):</span>
                    <strong>{formatCurrency(selectedCoach.HourlyRate)}</strong>
                  </div>
                  
                  <hr />
                  
                  <div className={styles.totalRow}>
                    <span>Tổng thanh toán:</span>
                    <strong className={styles.totalAmount}>{formatCurrency(Number(selectedCourt.PricePerHour) + Number(selectedCoach.HourlyRate))}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.actions} style={{ justifyContent: "center", marginTop: "50px" }}>
                <button className={styles.secondaryBtn} onClick={() => setStep(2)}>← Chọn lại HLV</button>
                <button 
                  className={styles.primaryBtn}
                  onClick={handleBook}
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "💳 Thanh toán ngay"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
