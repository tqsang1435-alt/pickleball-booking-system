"use client";

import { useEffect, useMemo, useState } from "react";

import HeroSection from "./HeroSection";
import QuickActions from "./QuickActions";
import FeaturedCourts from "./FeaturedCourts";
import FeaturedCoaches from "./FeaturedCoaches";
import ReviewModal from "@/components/reviews/ReviewModal";
import styles from "./HomePage.module.css";

import { getCourts } from "@/services/courtApi";
import { getCoaches } from "@/services/coachApi";
import { getPublicPromotions } from "@/services/promotionApi";
import { reviewApi } from "@/services/reviewApi";

import type { Court } from "@/types/court";
import type { Coach } from "@/types/coach";
import type { Promotion } from "@/types/promotion";
import type { Review } from "@/types/review";

export default function HomePage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

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
            : "Không tải được danh sách sân.",
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
            : "Không tải được danh sách Coach.",
        );
      } finally {
        if (!mounted) return;
        setCoachesLoading(false);
      }
    }

    async function loadPromotions() {
      try {
        setPromotionsLoading(true);
        const data = await getPublicPromotions();

        if (!mounted) return;

        setPromotions(data);
        setPromotionsError("");
      } catch (error) {
        if (!mounted) return;

        setPromotionsError(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách khuyến mãi.",
        );
      } finally {
        if (!mounted) return;
        setPromotionsLoading(false);
      }
    }

    async function loadReviews() {
      try {
        const data = await reviewApi.getPublicReviews();
        if (!mounted) return;
        setReviews(data);
      } catch {
        // Silently fail - reviews are not critical
      }
    }

    loadCourts();
    loadCoaches();
    loadPromotions();
    loadReviews();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredCourts = useMemo(() => {
    return courts.filter((court) => court.Status === "Available").slice(0, 4);
  }, [courts]);

  const featuredCoaches = useMemo(() => {
    return coaches
      .filter((coach) =>
        ["Approved", "Active", "Available"].includes(String(coach.Status)),
      )
      .sort(
        (a, b) => Number(b.AverageRating || 0) - Number(a.AverageRating || 0),
      )
      .slice(0, 4);
  }, [coaches]);

  const activePromotions = useMemo(() => {
    return promotions
      .filter((promotion) => String(promotion.status) === "Active")
      .slice(0, 3);
  }, [promotions]);

  function formatDiscount(promotion: Promotion) {
    if (promotion.discountType === "Percent") {
      return `Giảm ${promotion.discountValue}%`;
    }

    return `Giảm ${Number(promotion.discountValue || 0).toLocaleString(
      "vi-VN",
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

        <section className={styles.promoReviewLayout}>
          <section className={styles.promo}>
            <div className={styles.promoHeader}>
              <span>Ưu đãi</span>
              <h2>Ưu đãi hấp dẫn</h2>
              <p>Áp dụng khi đặt sân, đặt Coach hoặc combo tại PickleClub.</p>
            </div>

            {promotionsLoading && (
              <p className={styles.promoStatus}>Đang tải khuyến mãi...</p>
            )}

            {promotionsError && (
              <p className={styles.error}>{promotionsError}</p>
            )}

            {!promotionsLoading &&
              !promotionsError &&
              activePromotions.length === 0 && (
                <p className={styles.promoStatus}>
                  Hiện chưa có khuyến mãi khả dụng.
                </p>
              )}

            <div className={styles.voucherGrid}>
              {activePromotions.map((promotion) => (
                <div className={styles.voucherCard} key={promotion.promotionId}>
                  <div className={styles.voucherLeft}>
                    <div className={styles.voucherDiscount}>
                      {formatDiscount(promotion)}
                    </div>
                    <div className={styles.voucherMinOrder}>
                      {promotion.minBookingAmount ? (
                        <span>
                          Đơn tối thiểu{" "}
                          {Number(promotion.minBookingAmount).toLocaleString(
                            "vi-VN",
                          )}
                          đ
                        </span>
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
                    <h3 className={styles.voucherName}>
                      {promotion.promotionName}
                    </h3>
                    <div className={styles.voucherActionRow}>
                      <span className={styles.voucherCode}>
                        {promotion.promotionCode}
                      </span>
                      <button
                        type="button"
                        className={
                          copiedCode === promotion.promotionCode
                            ? styles.copyBtnSuccess
                            : styles.copyBtn
                        }
                        onClick={() => handleCopyCode(promotion.promotionCode)}
                      >
                        {copiedCode === promotion.promotionCode
                          ? "Đã chép!"
                          : "Sao chép"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.testimonials}>
            <div className={styles.reviewSummary} style={{ position: "relative" }}>
              <span>Đánh giá từ khách hàng</span>
              <h2>
                4.8<small>/5</small>
              </h2>
              <p>Dựa trên trải nghiệm đặt sân, đặt Coach và sử dụng ưu đãi.</p>
              <button 
                className={styles.writeReviewBtn}
                onClick={() => setReviewModalOpen(true)}
                style={{ position: "absolute", top: "20px", right: "20px", background: "#1677ff", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 500 }}
              >
                Gửi Đánh giá
              </button>
            </div>

            <ReviewModal
              isOpen={reviewModalOpen}
              onClose={() => setReviewModalOpen(false)}
              title="Đánh giá Câu Lạc Bộ"
              onSuccess={() => {
                setReviewModalOpen(false);
                // Optionally reload reviews here
              }}
            />

            {reviews.length === 0 ? (
              <div className={styles.reviewCard}>
                <div className={styles.reviewStars}>★★★★★</div>
                <p className={styles.reviewComment}>
                  Sân đẹp, dịch vụ tốt, đặt lịch nhanh chóng. Sẽ ủng hộ lâu dài!
                </p>
                <div className={styles.reviewAuthor}>
                  <div className={styles.reviewAvatar}>M</div>
                  <div>
                    <strong>Minh Anh</strong>
                    <small>Khách hàng PickleClub</small>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.reviewGrid}>
                {reviews.slice(0, 2).map((review) => (
                  <div className={styles.reviewCard} key={review.ReviewID}>
                    <div className={styles.reviewStars}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={
                            i < review.Rating
                              ? styles.starFilled
                              : styles.starEmpty
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className={styles.reviewComment}>"{review.Comment}"</p>
                    <div className={styles.reviewAuthor}>
                      <div className={styles.reviewAvatar}>
                        {review.AvatarURL ? (
                          <img src={review.AvatarURL} alt={review.FullName} />
                        ) : (
                          <span>{review.FullName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <strong>{review.FullName}</strong>
                        {review.CourtName && <small>{review.CourtName}</small>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>

        <QuickActions />
      </div>
    </main>
  );
}
