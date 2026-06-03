"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTeamBooking } from "@/services/bookingApi";
import { getAvailableCourts } from "@/services/courtApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./TeamBookingStubPage.module.css";

/**
 * UC-36: Team Booking Page
 * Frontend stub cho luồng đặt sân sau khi ghép nhóm.
 *
 * Flow đầy đủ khi PlayGroups module hoàn thiện:
 * 1. Player Matching → Nhóm được ghép → Status = 'Matched'
 * 2. Leader của nhóm vào trang này (URL: /bookings/team?groupId=xxx)
 * 3. Chọn sân + ngày + giờ → xác nhận → thanh toán
 *
 * TODO: Khi PlayerMatching module implement:
 * - Fetch group info từ /api/player-matching/groups/:groupId
 * - Hiển thị danh sách thành viên nhóm
 * - Validate leader role trước khi cho phép đặt
 */

export default function TeamBookingStubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId");

  const paramDate = searchParams.get("date") || "";
  const paramStartTime = searchParams.get("startTime") || "";
  const paramEndTime = searchParams.get("endTime") || "";

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

  const formatTimeParam = (t: string) => {
    if (!t) return "";
    if (t.includes("T")) {
      const parts = t.split("T");
      t = parts[1];
    }
    return t.substring(0, 5);
  };

  const [step, setStep] = useState<"info" | "form" | "success" | "error">(
    groupId ? "form" : "info"
  );
  const [courtId, setCourtId] = useState("");
  const [bookingDate, setBookingDate] = useState(() => parseDateParam(paramDate));
  const [startTime, setStartTime] = useState(() => formatTimeParam(paramStartTime));
  const [endTime, setEndTime] = useState(() => formatTimeParam(paramEndTime));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (paramDate) {
      setBookingDate(parseDateParam(paramDate));
    }
    if (paramStartTime) {
      setStartTime(formatTimeParam(paramStartTime));
    }
    if (paramEndTime) {
      setEndTime(formatTimeParam(paramEndTime));
    }
  }, [paramDate, paramStartTime, paramEndTime]);

  // States for available courts
  const [courts, setCourts] = useState<any[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [courtsError, setCourtsError] = useState("");

  // Minimum date = today
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

  useEffect(() => {
    async function fetchCourts() {
      if (!bookingDate || !startTime || !endTime) {
        setCourts([]);
        setCourtId("");
        return;
      }
      setLoadingCourts(true);
      setCourtsError("");
      setCourtId("");
      try {
        const data = await getAvailableCourts(bookingDate, startTime, endTime);
        setCourts(data || []);
      } catch (err: any) {
        console.error(err);
        setCourtsError("Không thể tải danh sách sân. Vui lòng thử lại.");
      } finally {
        setLoadingCourts(false);
      }
    }
    fetchCourts();
  }, [bookingDate, startTime, endTime]);

  async function handleSubmit() {
    if (!courtId) {
      setErrorMsg("Vui lòng chọn sân.");
      return;
    }
    if (!bookingDate || !startTime || !endTime) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin.");
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
        courtId: Number(courtId),
        bookingDate,
        startTime,
        endTime,
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

  // ===== Step: INFO (chưa có groupId hoặc module chưa sẵn sàng) =====
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
              <div className={styles.flowLabel}>Đăng ký hồ sơ chơi</div>
              <div className={styles.flowNote}>BR-94: Hồ sơ đầy đủ</div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={`${styles.flowStep} ${styles.flowPending}`}>
              <div className={styles.flowIcon}>🤖</div>
              <div className={styles.flowLabel}>AI ghép nhóm</div>
              <div className={styles.flowNote}>BR-93: Dựa trên trình độ, vị trí, lịch rảnh</div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={`${styles.flowStep} ${styles.flowPending}`}>
              <div className={styles.flowIcon}>👥</div>
              <div className={styles.flowLabel}>Xác nhận nhóm</div>
              <div className={styles.flowNote}>BR-91: Tối đa 4 người/nhóm</div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={`${styles.flowStep} ${styles.flowCurrent}`}>
              <div className={styles.flowIcon}>🏟️</div>
              <div className={styles.flowLabel}>Đặt sân nhóm</div>
              <div className={styles.flowNote}>UC-36: Bước này</div>
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
              <span className={styles.brId}>⏱️</span>
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
              🏟️ Đặt sân thường
            </button>
            <button className={styles.btnDemo} onClick={() => {
              // Demo với groupId giả cho testing
              setStep("form");
            }}>
              🧪 Demo form đặt nhóm
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
              <label>Chọn sân <span>*</span></label>
              {loadingCourts ? (
                <div style={{ color: "#22c55e", fontSize: "0.875rem", padding: "0.5rem 0" }}>
                  ⏳ Đang tải danh sách sân khả dụng...
                </div>
              ) : courtsError ? (
                <div style={{ color: "#ef4444", fontSize: "0.875rem", padding: "0.5rem 0" }}>
                  ⚠️ {courtsError}
                </div>
              ) : courts.length === 0 ? (
                <div style={{ color: "#ef4444", fontSize: "0.875rem", padding: "0.5rem 0", fontWeight: 500 }}>
                  Hiện chưa có sân khả dụng cho khung giờ này.
                </div>
              ) : (
                <select
                  className={styles.select}
                  value={courtId}
                  onChange={(e) => setCourtId(e.target.value)}
                >
                  <option value="">-- Chọn sân pickleball --</option>
                  {courts.map((court) => (
                    <option key={court.CourtID} value={court.CourtID}>
                      [{court.CourtCode || "N/A"}] {court.CourtName} - {court.Location || "Chưa rõ vị trí"} - {formatCurrency(court.Price ?? court.PricePerHour)}/giờ
                    </option>
                  ))}
                </select>
              )}
              <p className={styles.fieldNote}>
                💡 Hệ thống tự động lọc các sân còn trống vào khung giờ đã chọn.
              </p>
            </div>

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

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Giờ bắt đầu <span>*</span></label>
                <input
                  type="time"
                  className={styles.input}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Giờ kết thúc <span>*</span></label>
                <input
                  type="time"
                  className={styles.input}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

            <div className={styles.rules}>
              <div className={styles.ruleItem}>⏱️ Hệ thống sẽ giữ sân trong 10 phút sau khi xác nhận.</div>
              <div className={styles.ruleItem}>🔒 Lịch đặt được kiểm tra tự động để tránh trùng sân.</div>
              <div className={styles.ruleItem}>📋 Vui lòng hoàn tất thanh toán trong thời gian quy định.</div>
            </div>

            <button
              className={styles.btnSubmit}
              onClick={step === "info" ? () => setStep("form") : handleSubmit}
              disabled={loading}
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
