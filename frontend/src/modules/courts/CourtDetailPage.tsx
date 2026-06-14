"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCourtById } from "@/services/courtApi";
import type { Court } from "@/types/court";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import { CourtScheduleDrawer } from "./CourtScheduleDrawer";
import styles from "./CourtDetailPage.module.css";

// We can reuse the CourtScheduleDrawer from CourtsPage for the booking UI, 
// or implement a simpler inline version. Let's just create a simple "Book Now" button 
// that navigates back to CourtsPage with a filter, or just opens the modal.
// To keep it simple, we'll just redirect to the main courts page for booking right now, 
// or implement a direct booking logic. The easiest is to instruct them to go back.
// But ideally, we should allow booking from here. We can use the BookingModal.

export default function CourtDetailPage({ courtId }: { courtId: string }) {
  const router = useRouter();
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    async function fetchCourt() {
      try {
        setLoading(true);
        const data = await getCourtById(courtId);
        setCourt(data);
      } catch (err) {
        setError("Không thể tải thông tin sân. Sân có thể không tồn tại.");
      } finally {
        setLoading(false);
      }
    }
    fetchCourt();
  }, [courtId]);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className="container" style={{ padding: "100px 0" }}>
          <StateBox variant="loading" title="Đang tải thông tin sân..." />
        </div>
      </main>
    );
  }

  if (error || !court) {
    return (
      <main className={styles.page}>
        <div className="container" style={{ padding: "100px 0" }}>
          <StateBox variant="error" title="Lỗi" description={error} />
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button className={styles.backBtn} onClick={() => router.push("/courts")}>
              ← Quay lại danh sách sân
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.heroSection}>
        <div className={styles.heroBg}>
          <Image 
            src={court.CourtImage || "/images/courts/c1.jpg"} 
            alt={court.CourtName}
            fill
            priority
            style={{ objectFit: 'cover' }}
          />
          <div className={styles.overlay}></div>
        </div>
        <div className={`container ${styles.heroContent}`}>
          <button className={styles.backBtnText} onClick={() => router.push("/courts")}>
            ← Quay lại
          </button>
          <div className={styles.badges}>
            <span className={styles.typeBadge}>{court.CourtType === "Indoor" ? "Trong nhà" : "Ngoài trời"}</span>
            <span className={`${styles.statusBadge} ${court.Status === "Available" ? styles.statusAvail : ""}`}>
              {court.Status === "Available" ? "Đang hoạt động" : "Bảo trì / Đóng cửa"}
            </span>
          </div>
          <h1 className={styles.title}>{court.CourtName}</h1>
          <p className={styles.location}>📍 {court.Location || "Chưa cập nhật vị trí"}</p>
        </div>
      </div>

      <div className={`container ${styles.mainContent}`}>
        <div className={styles.grid}>
          <div className={styles.leftCol}>
            <section className={styles.section}>
              <h2>Giới thiệu sân</h2>
              <p className={styles.description}>
                {court.Description || "Không có mô tả chi tiết cho sân này."}
              </p>
            </section>

            <section className={styles.section}>
              <h2>Tiện ích & Dịch vụ</h2>
              <div className={styles.amenities}>
                <div className={styles.amenityItem}>
                  <span className={styles.amenityIcon}>🚗</span>
                  <div>
                    <strong>Bãi đỗ xe</strong>
                    <p>Miễn phí cho khách hàng</p>
                  </div>
                </div>
                <div className={styles.amenityItem}>
                  <span className={styles.amenityIcon}>💧</span>
                  <div>
                    <strong>Nước uống</strong>
                    <p>Có quầy bán nước tự động</p>
                  </div>
                </div>
                <div className={styles.amenityItem}>
                  <span className={styles.amenityIcon}>💡</span>
                  <div>
                    <strong>Hệ thống đèn</strong>
                    <p>Đèn LED tiêu chuẩn thi đấu</p>
                  </div>
                </div>
                <div className={styles.amenityItem}>
                  <span className={styles.amenityIcon}>🚿</span>
                  <div>
                    <strong>Khu vực thay đồ</strong>
                    <p>Có phòng tắm & locker</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.bookingCard}>
              <h3>Thông tin đặt sân</h3>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Giá thuê</span>
                <span className={styles.infoValuePrice}>{formatCurrency(court.PricePerHour)} <small>/ giờ</small></span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Giờ mở cửa</span>
                <span className={styles.infoValue}>{court.OpenTime} - {court.CloseTime}</span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mã sân</span>
                <span className={styles.infoValueCode}>{court.CourtCode}</span>
              </div>

              <hr className={styles.divider} />
              
              <p className={styles.bookingNote}>
                Để đặt sân này, vui lòng truy cập trang danh sách sân và xem lịch sân cụ thể từng ngày.
              </p>
              
              <button 
                className={styles.bookBtn} 
                onClick={() => setShowSchedule(true)}
              >
                📅 Xem lịch & Đặt sân ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSchedule && court && (
        <CourtScheduleDrawer
          court={court}
          onClose={() => setShowSchedule(false)}
        />
      )}
    </main>
  );
}
