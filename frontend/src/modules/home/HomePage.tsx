"use client";

import { useEffect, useMemo, useState } from "react";

import HeroSection from "./HeroSection";
import QuickActions from "./QuickActions";
import FeaturedCourts from "./FeaturedCourts";
import FeaturedCoaches from "./FeaturedCoaches";
import styles from "./HomePage.module.css";

import { getCourts } from "@/services/courtApi";
import { getCoaches } from "@/services/coachApi";
import { getPromotions } from "@/services/promotionApi";

import type { Court } from "@/types/court";
import type { Coach } from "@/types/coach";
import type { Promotion } from "@/types/promotion";

export default function HomePage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [courtsLoading, setCourtsLoading] = useState(true);
  const [coachesLoading, setCoachesLoading] = useState(true);
  const [promotionsLoading, setPromotionsLoading] = useState(true);

  const [courtsError, setCourtsError] = useState("");
  const [coachesError, setCoachesError] = useState("");
  const [promotionsError, setPromotionsError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCourts() {
      try {
        setCourtsLoading(true);
        const data = await getCourts();

        if (!mounted) return;

        setCourts(data);
        setCourtsError("");
      } catch (error) {
        if (!mounted) return;

        setCourtsError(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách sân."
        );
      } finally {
        if (!mounted) return;
        setCourtsLoading(false);
      }
    }

    async function loadCoaches() {
      try {
        setCoachesLoading(true);
        const data = await getCoaches();

        if (!mounted) return;

        setCoaches(data);
        setCoachesError("");
      } catch (error) {
        if (!mounted) return;

        setCoachesError(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách Coach."
        );
      } finally {
        if (!mounted) return;
        setCoachesLoading(false);
      }
    }

    async function loadPromotions() {
      try {
        setPromotionsLoading(true);
        const data = await getPromotions();

        if (!mounted) return;

        setPromotions(data);
        setPromotionsError("");
      } catch (error) {
        if (!mounted) return;

        setPromotionsError(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách khuyến mãi."
        );
      } finally {
        if (!mounted) return;
        setPromotionsLoading(false);
      }
    }

    loadCourts();
    loadCoaches();
    loadPromotions();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredCourts = useMemo(() => {
    return courts
      .filter((court) => court.Status === "Available")
      .slice(0, 4);
  }, [courts]);

  const featuredCoaches = useMemo(() => {
    return coaches
      .filter((coach) =>
        ["Approved", "Active", "Available"].includes(String(coach.Status))
      )
      .sort(
        (a, b) =>
          Number(b.AverageRating || 0) - Number(a.AverageRating || 0)
      )
      .slice(0, 4);
  }, [coaches]);

  const activePromotions = useMemo(() => {
    return promotions
      .filter((promotion) => String(promotion.Status) === "Active")
      .slice(0, 3);
  }, [promotions]);

  function formatDiscount(promotion: Promotion) {
    if (promotion.DiscountType === "Percent") {
      return `Giảm ${promotion.DiscountValue}%`;
    }

    return `Giảm ${Number(promotion.DiscountValue || 0).toLocaleString(
      "vi-VN"
    )}đ`;
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  return (
    <main className={styles.page}>
      <HeroSection />

      <div className={styles.container}>
        <QuickActions />

        <FeaturedCourts
          courts={featuredCourts}
          loading={courtsLoading}
          error={courtsError}
        />

        <FeaturedCoaches
          coaches={featuredCoaches}
          loading={coachesLoading}
          error={coachesError}
        />

        <section className={styles.howItWorks}>
          <h2>Cách hoạt động</h2>

          <div className={styles.steps}>
            <div>
              <span>01</span>
              <h3>Chọn sân / Coach</h3>
              <p>Tìm sân hoặc Coach phù hợp với nhu cầu.</p>
            </div>

            <div>
              <span>02</span>
              <h3>Chọn lịch</h3>
              <p>Chọn ngày, giờ thuận tiện.</p>
            </div>

            <div>
              <span>03</span>
              <h3>Thanh toán</h3>
              <p>Thanh toán online an toàn, nhanh chóng.</p>
            </div>

            <div>
              <span>04</span>
              <h3>Xác nhận</h3>
              <p>Nhận xác nhận và sẵn sàng trải nghiệm.</p>
            </div>
          </div>
        </section>

        <section className={styles.testimonials}>
          <h2>Khách hàng nói gì về PickleClub</h2>

          <div className={styles.reviewGrid}>
            <div className={styles.reviewCard}>
              <p>“Đặt sân rất nhanh, giao diện dễ dùng.”</p>
              <strong>Minh Anh</strong>
              <span>⭐⭐⭐⭐⭐</span>
            </div>

            <div className={styles.reviewCard}>
              <p>“Coach hướng dẫn rất nhiệt tình.”</p>
              <strong>Quốc Bảo</strong>
              <span>⭐⭐⭐⭐⭐</span>
            </div>

            <div className={styles.reviewCard}>
              <p>“Tìm được nhiều bạn đánh cùng trình độ.”</p>
              <strong>Thảo Vy</strong>
              <span>⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </section>

        <section className={styles.promo}>
          <div className={styles.promoHeader}>
            <span>Ưu đãi</span>
            <h2>Khuyến mãi dành cho bạn</h2>
            <p>Áp dụng khi đặt sân, đặt Coach hoặc combo tại PickleClub.</p>
          </div>

          {promotionsLoading && <p className={styles.promoStatus}>Đang tải khuyến mãi...</p>}

          {promotionsError && <p className={styles.error}>{promotionsError}</p>}

          {!promotionsLoading &&
            !promotionsError &&
            activePromotions.length === 0 && (
              <p className={styles.promoStatus}>Hiện chưa có khuyến mãi khả dụng.</p>
            )}

          <div className={styles.voucherGrid}>
            {activePromotions.map((promotion) => (
              <div className={styles.voucherCard} key={promotion.PromotionID}>
                <div className={styles.voucherLeft}>
                  <div className={styles.voucherDiscount}>
                    {formatDiscount(promotion)}
                  </div>
                  <div className={styles.voucherMinOrder}>
                    {promotion.MinOrderAmount ? (
                      <span>Đơn tối thiểu {Number(promotion.MinOrderAmount).toLocaleString("vi-VN")}đ</span>
                    ) : (
                      <span>Không giới hạn</span>
                    )}
                  </div>
                </div>

                <div className={styles.voucherDivider}>
                  <span className={styles.dividerDotTop}></span>
                  <span className={styles.dividerLine}></span>
                  <span className={styles.dividerDotBottom}></span>
                </div>

                <div className={styles.voucherRight}>
                  <h3 className={styles.voucherName}>{promotion.PromotionName}</h3>
                  <div className={styles.voucherActionRow}>
                    <span className={styles.voucherCode}>
                      {promotion.PromotionCode}
                    </span>
                    <button
                      className={copiedCode === promotion.PromotionCode ? styles.copyBtnSuccess : styles.copyBtn}
                      onClick={() => handleCopyCode(promotion.PromotionCode)}
                    >
                      {copiedCode === promotion.PromotionCode ? "Đã chép!" : "Sao chép"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}