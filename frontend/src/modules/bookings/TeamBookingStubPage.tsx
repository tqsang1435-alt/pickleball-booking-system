"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTeamBooking } from "@/services/bookingApi";
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

  const [step, setStep] = useState<"info" | "form" | "success" | "error">("info");
  const [courtId, setCourtId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<any>(null);

  // Minimum date = today
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

  async function handleSubmit() {
    if (!courtId || !bookingDate || !startTime || !endTime) {
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
            <h3>Business Rules cần implement:</h3>
            <div className={styles.brItem}>
              <span className={styles.brId}>BR-90</span>
              <span>Lời mời nhóm hết hạn sau 48 giờ</span>
              <span className={styles.brStatus}>⏳ Pending</span>
            </div>
            <div className={styles.brItem}>
              <span className={styles.brId}>BR-91</span>
              <span>Nhóm tối đa 4 người</span>
              <span className={styles.brStatus}>⏳ Pending</span>
            </div>
            <div className={styles.brItem}>
              <span className={styles.brId}>BR-92</span>
              <span>Player tối đa 3 nhóm active cùng lúc</span>
              <span className={styles.brStatus}>⏳ Pending</span>
            </div>
            <div className={styles.brItem}>
              <span className={styles.brId}>BR-93</span>
              <span>AI matching dựa trên trình độ, vị trí, lịch rảnh</span>
              <span className={styles.brStatus}>⏳ Pending</span>
            </div>
            <div className={styles.brItem}>
              <span className={styles.brId}>BR-94</span>
              <span>Cần hồ sơ đầy đủ mới dùng tính năng Matching</span>
              <span className={styles.brStatus}>⏳ Pending</span>
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
              <label>Court ID <span>*</span></label>
              <input
                type="number"
                placeholder="Nhập ID sân pickleball..."
                className={styles.input}
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
              />
              <p className={styles.fieldNote}>
                💡 Xem danh sách sân tại <a href="/courts">trang sân</a>
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
              <div className={styles.ruleItem}>⏱️ BR-25: Giữ slot 10 phút, thanh toán trong thời gian đó</div>
              <div className={styles.ruleItem}>🔒 BR-28: Transaction locking chống double booking</div>
              <div className={styles.ruleItem}>📋 BR-40: Tối đa 3 booking đang chờ thanh toán cùng lúc</div>
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
