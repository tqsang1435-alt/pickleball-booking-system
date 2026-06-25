"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTeamBooking } from "@/services/bookingApi";
import { getAvailableCourts } from "@/services/courtApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./TeamBookingStubPage.module.css";

/**
 * UC-36: Team Booking Page
 * Frontend stub cho luồng đặt sân sau khi ghép nhóm.
 */

export default function TeamBookingStubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId");

  const paramDate = searchParams.get("date") || "";

  // Parse date if it's a Unix timestamp (seconds or milliseconds)
  const parseDateParam = (d: string) => {
    if (!d) return "";
    if (/^\d+$/.test(d)) {
      const timestamp = Number(d);
      const dateObj = new Date(timestamp < 1000000000000 ? timestamp * 1000 : timestamp);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return d;
  };

  const [step, setStep] = useState<"info" | "form" | "success" | "error">(
    groupId ? "form" : "info"
  );

  // Selected slots state (Khôi phục logic multi-slot)
  const [selectedSlots, setSelectedSlots] = useState<{
    courtId: number;
    slotId: number;
    startTime: string;
    endTime: string;
    price: number;
    courtName: string;
  }[]>([]);

  const [bookingDate, setBookingDate] = useState(() => parseDateParam(paramDate));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<any>(null);

  // Derived sorted slots to avoid mutating state
  const sortedSelectedSlots = useMemo(
    () => [...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [selectedSlots]
  );

  useEffect(() => {
    if (paramDate) {
      setBookingDate(parseDateParam(paramDate));
    }
  }, [paramDate]);

  // States for available courts
  const [courtsData, setCourtsData] = useState<any[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [courtsError, setCourtsError] = useState("");

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

  useEffect(() => {
    async function fetchCourts() {
      if (!bookingDate) {
        setCourtsData([]);
        setSelectedSlots([]);
        return;
      }
      setLoadingCourts(true);
      setCourtsError("");
      setSelectedSlots([]); // Reset selection when date changes
      try {
        const data = await getAvailableCourts(bookingDate); // time filters omitted
        setCourtsData(data || []);
      } catch (err: any) {
        console.error(err);
        setCourtsError("Không thể tải danh sách sân. Vui lòng thử lại.");
      } finally {
        setLoadingCourts(false);
      }
    }
    fetchCourts();
  }, [bookingDate]);

  // Group slots by CourtID
  const groupedCourts = useMemo(() => {
    if (!courtsData) return [];
    const map = new Map<number, any>();
    courtsData.forEach(court => {
      if (!map.has(court.CourtID)) {
        map.set(court.CourtID, { ...court, slots: [] });
      }
      map.get(court.CourtID).slots.push(court);
    });
    return Array.from(map.values());
  }, [courtsData]);

  const parseTimeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleSlotClick = (slot: any, courtName: string) => {
    const slotId = slot.SlotID;
    const isAlreadySelected = selectedSlots.some(s => s.slotId === slotId);

    if (isAlreadySelected) {
      // Bỏ chọn slot: Nếu làm đứt chuỗi, cách đơn giản nhất là reset toàn bộ selectedSlots.
      const newSlots = selectedSlots.filter(s => s.slotId !== slotId);
      newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

      let isContiguous = true;
      for (let i = 0; i < newSlots.length - 1; i++) {
        if (newSlots[i].endTime !== newSlots[i+1].startTime) {
          isContiguous = false;
          break;
        }
      }

      if (!isContiguous) {
        setSelectedSlots([]); // Reset hoàn toàn nếu bỏ chọn làm đứt chuỗi
        setErrorMsg("");
      } else {
        setSelectedSlots(newSlots);
        setErrorMsg("");
      }
      return;
    }

    // Chọn thêm slot
    if (selectedSlots.length > 0) {
      // Phải cùng sân
      if (selectedSlots[0].courtId !== slot.CourtID) {
        setErrorMsg("Vui lòng chọn các khung giờ liên tiếp trên cùng một sân.");
        return;
      }

      const newSlots = [...selectedSlots, {
        courtId: slot.CourtID,
        slotId: slot.SlotID,
        startTime: slot.StartTime,
        endTime: slot.EndTime,
        price: slot.Price,
        courtName: courtName
      }];
      newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

      // Kiểm tra tính liên tiếp
      let isContiguous = true;
      for (let i = 0; i < newSlots.length - 1; i++) {
        if (newSlots[i].endTime !== newSlots[i+1].startTime) {
          isContiguous = false;
          break;
        }
      }

      if (!isContiguous) {
        setErrorMsg("Vui lòng chọn các khung giờ liên tiếp trên cùng một sân.");
        return;
      }

      // Kiểm tra thời lượng
      const startMin = parseTimeToMinutes(newSlots[0].startTime);
      const endMin = parseTimeToMinutes(newSlots[newSlots.length - 1].endTime);
      const durationMins = endMin - startMin;

      if (durationMins <= 0) {
        setErrorMsg("Thời gian kết thúc phải sau thời gian bắt đầu.");
        return;
      }
      if (durationMins > 120) {
        setErrorMsg("Bạn chỉ có thể đặt tối đa 2 giờ liên tiếp cho một lần đặt sân nhóm.");
        return;
      }

      setSelectedSlots(newSlots);
      setErrorMsg("");
    } else {
      setSelectedSlots([{
        courtId: slot.CourtID,
        slotId: slot.SlotID,
        startTime: slot.StartTime,
        endTime: slot.EndTime,
        price: slot.Price,
        courtName: courtName
      }]);
      setErrorMsg("");
    }
  };

  async function handleSubmit() {
    if (selectedSlots.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất một khung giờ sân.");
      return;
    }
    if (!bookingDate) {
      setErrorMsg("Vui lòng chọn ngày chơi.");
      return;
    }

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const booking = await createTeamBooking(token, {
        groupId: Number(groupId || 0),
        courtId: sortedSelectedSlots[0].courtId,
        bookingDate,
        startTime: sortedSelectedSlots[0].startTime,
        endTime: sortedSelectedSlots[sortedSelectedSlots.length - 1].endTime,
        slotIds: sortedSelectedSlots.map(s => s.slotId),
      });
      setResult(booking);
      setStep("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Đặt sân nhóm thất bại.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  // ===== Step: INFO =====
  if (step === "info" && !groupId) {
    return (
      <div className={styles.page}>
        <div className={styles.stubCard}>
          <div className={styles.stubIcon}>🏓</div>
          <h1 className={styles.stubTitle}>Đặt sân cho nhóm (UC-36)</h1>
          <p className={styles.stubDesc}>
            Tính năng này cho phép bạn đặt sân sau khi được ghép nhóm thành công qua hệ thống AI Matching.
          </p>

          <div className={styles.flowDiagram}>
            <div className={`${styles.flowStep} ${styles.flowDone}`}>
              <div className={styles.flowIcon}>✅</div>
              <div className={styles.flowLabel}>Đăng ký hồ sơ</div>
              <div className={styles.flowNote}>BR-94</div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={`${styles.flowStep} ${styles.flowPending}`}>
              <div className={styles.flowIcon}>🤖</div>
              <div className={styles.flowLabel}>AI ghép nhóm</div>
              <div className={styles.flowNote}>BR-93</div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={`${styles.flowStep} ${styles.flowPending}`}>
              <div className={styles.flowIcon}>👥</div>
              <div className={styles.flowLabel}>Xác nhận</div>
              <div className={styles.flowNote}>BR-91</div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={`${styles.flowStep} ${styles.flowCurrent}`}>
              <div className={styles.flowIcon}>🏟️</div>
              <div className={styles.flowLabel}>Đặt sân nhóm</div>
              <div className={styles.flowNote}>UC-36</div>
            </div>
          </div>

          <div className={styles.waitingBanner}>
            <div className={styles.waitingIcon}>⏳</div>
            <div>
              <strong>Module Player Matching đang được phát triển</strong>
              <p>
                Tính năng này sẽ khả dụng sau khi module Player Matching hoàn thiện.
                Backend API <code>/api/bookings/team</code> đã sẵn sàng — chỉ cần kết nối với matching module.
              </p>
            </div>
          </div>

          <div className={styles.brList}>
            <h3>Quy định & Lưu ý khi ghép nhóm:</h3>
            <div className={styles.brItem}>
              <span className={styles.brId}>⏳</span>
              <span>Lời mời ghép cặp/thách đấu sẽ tự động hết hạn sau 48 giờ nếu không được phản hồi.</span>
            </div>
            <div className={styles.brItem}>
              <span className={styles.brId}>👥</span>
              <span>Mỗi nhóm ghép tối đa 4 thành viên để đảm bảo chất lượng giao lưu thi đấu tốt nhất.</span>
            </div>
            <div className={styles.brItem}>
              <span className={styles.brId}>📋</span>
              <span>Mỗi người chơi có thể tham gia tối đa 3 nhóm ghép đang hoạt động cùng một thời điểm.</span>
            </div>
            <div className={styles.brItem}>
              <span className={styles.brId}>🤖</span>
              <span>Hệ thống ghép cặp AI tự động tìm kiếm đối tác phù hợp nhất dựa trên vị trí, giờ chơi rảnh và trình độ kỹ năng của bạn.</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnBack} onClick={() => router.push("/courts")}>
              Đặt sân thường
            </button>
            <button className={styles.btnDemo} onClick={() => setStep("form")}>
              Demo form đặt nhóm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Step: FORM =====
  if (step === "info" || step === "form") {
    return (
      <div className={styles.page}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <button className={styles.backBtn} onClick={() => router.back()}>← Quay lại</button>
            <div className={styles.formTitle}>
              <h1>Đặt sân nhóm</h1>
              {groupId && <span className={styles.groupBadge}>Nhóm #{groupId}</span>}
            </div>
          </div>

          <div className={styles.groupInfo}>
            <div className={styles.groupInfoIcon}>👥</div>
            <div>
              <div className={styles.groupInfoTitle}>Nhóm đã được ghép</div>
              <div className={styles.groupInfoNote}>
                {groupId
                  ? `GroupID: ${groupId} — Chọn sân và thời gian phù hợp cho cả nhóm`
                  : "Demo mode — Nhập GroupID thủ công"}
              </div>
            </div>
          </div>

          <div className={styles.formBody}>
            {!groupId && (
              <div className={styles.formGroup}>
                <label>Group ID</label>
                <input
                  type="number"
                  placeholder="Nhập ID nhóm..."
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Ngày chơi <span>*</span></label>
              <input
                type="date"
                className={styles.input}
                min={today}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Danh sách sân khả dụng</label>
              {loadingCourts ? (
                <div className={styles.statusMessage}>
                  ⏳ Đang tải danh sách sân khả dụng...
                </div>
              ) : courtsError ? (
                <div className={`${styles.statusMessage} ${styles.statusError}`}>
                  ⚠️ {courtsError}
                </div>
              ) : groupedCourts.length === 0 ? (
                <div className={`${styles.statusMessage} ${styles.statusError}`}>
                  Không có sân trống trong ngày đã chọn. Vui lòng chọn ngày khác.
                </div>
              ) : (
                <div className={styles.courtGrid}>
                  {groupedCourts.map(court => (
                    <div key={court.CourtID} className={styles.courtCard}>
                      <div className={styles.courtCardHeader}>
                        <div className={styles.courtName}>
                          {court.CourtName}
                          {court.CourtCode && <span className={styles.courtCode}>[{court.CourtCode}]</span>}
                        </div>
                        <div className={styles.courtLocation}>
                          {court.Location || "Chưa rõ vị trí"}
                        </div>
                      </div>
                      <div className={styles.slotGrid}>
                        {court.slots.map((slot: any) => {
                          const isSelected = selectedSlots.some(s => s.slotId === slot.SlotID);
                          return (
                            <div
                              key={slot.SlotID}
                              className={`${styles.slotBadge} ${isSelected ? styles.slotBadgeSelected : ""}`}
                              onClick={() => handleSlotClick(slot, court.CourtName)}
                            >
                              <div className={styles.slotTime}>{slot.StartTime} - {slot.EndTime}</div>
                              <div className={styles.slotPrice}>{formatCurrency(slot.Price)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sortedSelectedSlots.length > 0 && (() => {
              const startMin = parseTimeToMinutes(sortedSelectedSlots[0].startTime);
              const endMin = parseTimeToMinutes(sortedSelectedSlots[sortedSelectedSlots.length - 1].endTime);
              const durationMinutes = endMin - startMin;
              const durationText = durationMinutes % 60 === 0 ? `${durationMinutes / 60} giờ` : `${durationMinutes} phút`;

              return (
                <div className={styles.summaryBox}>
                  <div className={styles.summaryTitle}>Xác nhận thông tin</div>
                  <div className={styles.summaryDetail}>
                    Sân: <strong>{sortedSelectedSlots[0].courtName}</strong>
                  </div>
                  <div className={styles.summaryDetail}>
                    Thời gian: <strong>{sortedSelectedSlots[0].startTime} - {sortedSelectedSlots[sortedSelectedSlots.length - 1].endTime}</strong> ({durationText})
                  </div>
                  <div className={styles.summaryDetail}>
                    Tổng tiền: <strong>{formatCurrency(sortedSelectedSlots.reduce((sum, s) => sum + s.price, 0))}</strong>
                  </div>
                </div>
              );
            })()}

            {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

            <div className={styles.rules}>
              <div className={styles.ruleItem}>Hệ thống sẽ giữ sân trong 10 phút sau khi xác nhận.</div>
              <div className={styles.ruleItem}>Lịch đặt được kiểm tra tự động để tránh trùng sân.</div>
            </div>

            <button
              className={styles.btnSubmit}
              onClick={step === "info" ? () => setStep("form") : handleSubmit}
              disabled={loading || (step === "form" && selectedSlots.length === 0)}
            >
              {loading ? "Đang đặt..." : "Xác nhận đặt sân nhóm →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Step: SUCCESS =====
  if (step === "success" && result) {
    return (
      <div className={styles.page}>
        <div className={styles.resultCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2>Đặt sân nhóm thành công!</h2>
          <p>Mã booking: <strong className={styles.bookingCode}>{result.BookingCode}</strong></p>
          <p>Tổng tiền: <strong>{formatCurrency(result.TotalAmount)}</strong></p>
          <div className={styles.notice}>
            ⏱️ Bạn có 10 phút để thanh toán. Vào <a href="/profile">hồ sơ</a> để thanh toán ngay.
          </div>
          <button className={styles.btnDone} onClick={() => router.push("/bookings")}>
            Xem lịch sử booking →
          </button>
        </div>
      </div>
    );
  }

  // ===== Step: ERROR =====
  return (
    <div className={styles.page}>
      <div className={styles.resultCard}>
        <div className={styles.errorIcon}>❌</div>
        <h2>Đặt sân thất bại</h2>
        <p>{errorMsg}</p>
        <div className={styles.actions}>
          <button className={styles.btnBack} onClick={() => setStep("form")}>← Thử lại</button>
          <button className={styles.btnDone} onClick={() => router.push("/courts")}>Đặt sân thường</button>
        </div>
      </div>
    </div>
  );
}
