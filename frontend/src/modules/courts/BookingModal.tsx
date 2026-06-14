"use client";

import { useState } from "react";
import { bookCourt } from "@/services/bookingApi";
import type { Booking } from "@/services/bookingApi";
import type { CourtSlot } from "@/services/courtApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import PaymentModal from "@/modules/payments/PaymentModal";
import styles from "./BookingModal.module.css";

type Props = {
  courtId: number;
  courtName: string;
  slot: CourtSlot;
  bookingDate: string;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
};

type Step = "confirm" | "paying" | "success" | "error";

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  if (timeStr.includes("T")) {
    return timeStr.split("T")[1].slice(0, 5);
  }
  return timeStr.slice(0, 5);
}

export default function BookingModal({
  courtId,
  courtName,
  slot,
  bookingDate,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("confirm");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const hours =
    (parseInt(formatTime(slot.EndTime)) - parseInt(formatTime(slot.StartTime)));
  const totalFee = slot.Price;

  async function handleConfirmBooking() {
    const token = getToken();
    if (!token) {
      setErrorMsg("Báº¡n chÆ°a Ä‘Äƒng nháº­p. Vui lĂ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ Ä‘áº·t sĂ¢n.");
      setStep("error");
      return;
    }

    setLoading(true);
    try {
      const created = await bookCourt(token, {
        courtId,
        bookingDate,
        startTime: formatTime(slot.StartTime),
        endTime: formatTime(slot.EndTime),
      });
      setBooking(created);
      setStep("paying");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Äáº·t sĂ¢n tháº¥t báº¡i. Vui lĂ²ng thá»­ láº¡i.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  // Khi PaymentModal Ä‘Ă³ng (user há»§y hoáº·c sau khi redirect trá»Ÿ vá»),
  // Ä‘Ă³ng BookingModal luĂ´n vĂ¬ booking Ä‘Ă£ Ä‘Æ°á»£c táº¡o.
  function handlePaymentModalClose() {
    // ÄĂ³ng toĂ n bá»™ modal â€“ booking Ä‘Ă£ á»Ÿ PendingPayment,
    // user cĂ³ thá»ƒ thanh toĂ¡n láº¡i tá»« /bookings
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>

        {/* â”€â”€ STEP: XĂ¡c nháº­n â”€â”€ */}
        {step === "confirm" && (
          <>
            <div className={styles.header}>
              <div className={styles.headerIcon}>đŸ¾</div>
              <h2>XĂ¡c nháº­n Ä‘áº·t sĂ¢n</h2>
              <p>Kiá»ƒm tra thĂ´ng tin trÆ°á»›c khi tiáº¿n hĂ nh thanh toĂ¡n</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>đŸŸï¸ SĂ¢n</span>
                <span className={styles.infoValue}>{courtName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>đŸ“… NgĂ y</span>
                <span className={styles.infoValue}>
                  {new Date(bookingDate).toLocaleDateString("vi-VN", {
                    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
                  })}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>â° Giá»</span>
                <span className={styles.infoValue}>
                  {formatTime(slot.StartTime)} â€“ {formatTime(slot.EndTime)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>đŸ’° Tá»•ng tiá»n</span>
                <span className={`${styles.infoValue} ${styles.price}`}>
                  {formatCurrency(totalFee)}
                </span>
              </div>
            </div>

            <div className={styles.notice}>
              <span>â±</span>
              <p>Sau khi đặt, bạn có <strong>10 phút</strong> để hoàn tất thanh toán trước khi slot bị hủy.</p>
            </div>

            <div className={styles.actions}>
              <button className={styles.btnCancel} onClick={onClose}>
                Há»§y bá»
              </button>
              <button
                className={styles.btnConfirm}
                onClick={handleConfirmBooking}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "XĂ¡c nháº­n Ä‘áº·t sĂ¢n â†’"}
              </button>
            </div>
          </>
        )}

        {/* â”€â”€ STEP: Thanh toĂ¡n â€“ PaymentModal tháº­t â”€â”€ */}
        {step === "paying" && booking && (
          <PaymentModal
            bookingId={booking.BookingID}
            bookingCode={booking.BookingCode}
            totalAmount={Number(booking.TotalAmount)}
            onClose={handlePaymentModalClose}
          />
        )}

        {/* â”€â”€ STEP: ThĂ nh cĂ´ng â”€â”€ */}
        {step === "success" && booking && (
          <>
            <div className={styles.successHeader}>
              <div className={styles.successIcon}>âœ…</div>
              <h2>Äáº·t sĂ¢n thĂ nh cĂ´ng!</h2>
              <p>Booking cá»§a báº¡n Ä‘Ă£ Ä‘Æ°á»£c xĂ¡c nháº­n</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>MĂ£ booking</span>
                <span className={`${styles.infoValue} ${styles.bookingCode}`}>
                  {booking.BookingCode}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>SĂ¢n</span>
                <span className={styles.infoValue}>{courtName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>NgĂ y</span>
                <span className={styles.infoValue}>
                  {new Date(bookingDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Giá»</span>
                <span className={styles.infoValue}>
                  {slot.StartTime} â€“ {slot.EndTime}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Thanh toĂ¡n</span>
                <span className={`${styles.infoValue} ${styles.paidBadge}`}>
                  {formatCurrency(Number(booking.TotalAmount))}
                </span>
              </div>

            </div>

            <div className={styles.notice}>
              <span>đŸ“</span>
              <p>Vui lĂ²ng Ä‘áº¿n sĂ¢n trÆ°á»›c giá» chÆ¡i <strong>30 phĂºt</strong> Ä‘á»ƒ check-in.</p>
            </div>

            <button className={styles.btnFullSuccess} onClick={onClose}>
              HoĂ n thĂ nh â†’
            </button>
          </>
        )}

        {/* â”€â”€ STEP: Lá»—i â”€â”€ */}
        {step === "error" && (
          <>
            <div className={styles.errorHeader}>
              <div className={styles.errorIcon}>âŒ</div>
              <h2>CĂ³ lá»—i xáº£y ra</h2>
              <p>{errorMsg}</p>
            </div>
            <div className={styles.actions}>
              <button className={styles.btnCancel} onClick={onClose}>
                ÄĂ³ng
              </button>
              <button
                className={styles.btnConfirm}
                onClick={() => { setStep("confirm"); setErrorMsg(""); }}
              >
                Thá»­ láº¡i
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
