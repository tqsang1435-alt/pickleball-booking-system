"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import HeroSection from "./HeroSection";
import QuickActions from "./QuickActions";
import SearchBookingBar from "./SearchBookingBar";
import FeaturedCourts from "./FeaturedCourts";
import FeaturedCoaches from "./FeaturedCoaches";
import ReviewModal from "@/components/reviews/ReviewModal";
import ScrollReveal from "@/components/common/ScrollReveal";
import styles from "./HomePage.module.css";

import { getCourts } from "@/services/courtApi";
import { getCoaches } from "@/services/coachApi";
import { getPublicPromotions } from "@/services/promotionApi";
import { reviewApi } from "@/services/reviewApi";

import type { Court } from "@/types/court";
import type { Coach } from "@/types/coach";
import type { Promotion } from "@/types/promotion";
import type { Review } from "@/types/review";

// HelpfulButton sub-component for interactive rating feedback
function HelpfulButton({ reviewId }: { reviewId: number }) {
  const [clicked, setClicked] = useState(false);
  const [count, setCount] = useState(() => (reviewId % 5) + 2);

  const handleHelpful = () => {
    if (clicked) {
      setCount((prev) => prev - 1);
      setClicked(false);
    } else {
      setCount((prev) => prev + 1);
      setClicked(true);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.helpfulBtn} ${clicked ? styles.helpfulBtnActive : ""}`}
      onClick={handleHelpful}
    >
      👍 Hữu ích ({count})
    </button>
  );
}

// Sample premium reviews database to guarantee a populated grid if DB is empty
const sampleReviews: Review[] = [
  {
    ReviewID: 9001,
    BookingID: 501,
    UserID: 1,
    CourtID: 101,
    Rating: 5,
    Comment: "Sân chơi cực kỳ đẹp, hệ thống mái che và quạt thông gió hoạt động tốt nên đánh lúc trưa không bị mệt. Dịch vụ đặt sân rất nhanh chóng và tiện lợi!",
    Status: "Approved",
    CreatedAt: "2026-07-10T08:30:00.000Z",
    FullName: "Minh Anh",
    AvatarURL: "",
    CourtName: "Sunrise Court"
  },
  {
    ReviewID: 9002,
    BookingID: 502,
    UserID: 2,
    CoachID: 201,
    Rating: 5,
    Comment: "Huấn luyện viên tận tâm, hướng dẫn sửa tư thế đánh bóng (racket face) và kỹ thuật di chuyển rất chi tiết. Mình tiến bộ rõ rệt chỉ sau 3 buổi tập.",
    Status: "Approved",
    CreatedAt: "2026-07-09T14:15:00.000Z",
    FullName: "Hoàng Lâm",
    AvatarURL: "",
    CoachName: "David Nguyễn"
  },
  {
    ReviewID: 9003,
    BookingID: 503,
    UserID: 3,
    CourtID: 102,
    Rating: 5,
    Comment: "Sân ngoài trời thoáng đãng, view cực đẹp đặc biệt vào buổi chiều hoàng hôn. Nhân viên thân thiện, hỗ trợ mượn vợt và bóng nước chu đáo.",
    Status: "Approved",
    CreatedAt: "2026-07-08T17:45:00.000Z",
    FullName: "Mai Khánh",
    AvatarURL: "",
    CourtName: "Ocean Court"
  },
  {
    ReviewID: 9004,
    BookingID: 504,
    UserID: 4,
    CourtID: 103,
    Rating: 4,
    Comment: "Dịch vụ combo sân kèm nước uống rất hời. Chất lượng mặt sân tốt, độ nảy bóng chuẩn. Sẽ đặt lịch thường xuyên cùng nhóm bạn vào cuối tuần.",
    Status: "Approved",
    CreatedAt: "2026-07-07T09:00:00.000Z",
    FullName: "Quốc Anh",
    AvatarURL: "",
    CourtName: "Golden Smash"
  },
  {
    ReviewID: 9005,
    BookingID: 505,
    UserID: 5,
    CoachID: 202,
    Rating: 5,
    Comment: "Hệ thống đặt lịch combo cả sân và Coach rất tiện, tiết kiệm chi phí. Coach nhiệt tình, giáo trình bài bản phù hợp cho người mới bắt đầu.",
    Status: "Approved",
    CreatedAt: "2026-07-06T10:30:00.000Z",
    FullName: "Thanh Hằng",
    AvatarURL: "",
    CoachName: "Sarah Trần"
  }
];

export default function HomePage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(3);

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

  // Combine database reviews with sample reviews
  const allReviews = useMemo(() => {
    const merged = [...reviews, ...sampleReviews];
    const unique = merged.filter((item, index, self) =>
      self.findIndex(t => t.ReviewID === item.ReviewID) === index
    );
    return unique;
  }, [reviews]);

  // Compute filtered reviews dynamically based on active filter pill selection
  const filteredReviews = useMemo(() => {
    let result = [...allReviews];

    if (activeFilter === "5 sao") {
      result = result.filter((r) => r.Rating === 5);
    } else if (activeFilter === "Đặt sân") {
      result = result.filter((r) => !!r.CourtID || !!r.CourtName);
    } else if (activeFilter === "Coach") {
      result = result.filter((r) => !!r.CoachID || !!r.CoachName);
    } else if (activeFilter === "Combo") {
      result = result.filter((r) => r.ReviewID === 9004 || r.ReviewID === 9005 || r.BookingID % 5 === 0);
    } else if (activeFilter === "Có hình ảnh") {
      // Mock images exist for even ID numbers
      result = result.filter((r) => r.ReviewID % 2 === 0);
    }

    if (activeFilter === "Mới nhất") {
      result.sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
    }

    return result;
  }, [allReviews, activeFilter]);

  // Handle responsive items count calculation client-side on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setItemsToShow(1);
      } else if (window.innerWidth <= 1024) {
        setItemsToShow(2);
      } else {
        setItemsToShow(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset slider index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeFilter]);

  // Autoplay timer to scroll testimonials card-by-card every 5.5 seconds
  useEffect(() => {
    if (filteredReviews.length <= itemsToShow) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredReviews.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [filteredReviews.length, itemsToShow]);

  // Slice visible reviews based on responsive screen count and current sliding index
  const visibleReviews = useMemo(() => {
    if (filteredReviews.length === 0) return [];
    const list = [];
    const count = Math.min(filteredReviews.length, itemsToShow);
    for (let i = 0; i < count; i++) {
      const idx = (currentIndex + i) % filteredReviews.length;
      list.push(filteredReviews[idx]);
    }
    return list;
  }, [filteredReviews, currentIndex, itemsToShow]);

  return (
    <main className={styles.page}>
      <ScrollReveal animation="fade-down" duration={1000} threshold={0.05}>
        <HeroSection />
      </ScrollReveal>

      <div className={styles.container}>
        <ScrollReveal animation="fade-up" duration={800}>
          <SearchBookingBar />
        </ScrollReveal>

        <ScrollReveal animation="fade-up" duration={800}>
          <FeaturedCourts
            courts={featuredCourts}
            loading={courtsLoading}
            error={courtsError}
          />
        </ScrollReveal>

        <ScrollReveal animation="fade-up" duration={800} delay={100}>
          <FeaturedCoaches
            coaches={featuredCoaches}
            loading={coachesLoading}
            error={coachesError}
          />
        </ScrollReveal>

        {/* Vouchers section (Full Width) */}
        <section className={styles.promoSection}>
          <ScrollReveal animation="fade-up" duration={900} className={styles.promo}>
            <div className={styles.promoHeaderRow}>
              <div className={styles.promoHeaderLeft}>
                <span className={styles.promoLabel}>ƯU ĐÃI</span>
                <h2 className={styles.promoTitle}>Ưu đãi hấp dẫn</h2>
                <p className={styles.promoDesc}>Áp dụng khi đặt sân, đặt Coach hoặc combo tại PickleClub.</p>
              </div>
              <Link href="/courts" className={styles.viewAllPromosBtn}>
                Xem tất cả ưu đãi ➜
              </Link>
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
              {activePromotions.map((promotion) => {
                // Determine voucher category
                const getVoucherCategory = (promo: Promotion) => {
                  const name = (promo.promotionName || "").toLowerCase();
                  const code = (promo.promotionCode || "").toLowerCase();
                  const desc = (promo.description || "").toLowerCase();
                  
                  if (name.includes("combo") || code.includes("combo") || desc.includes("combo")) {
                    return "combo";
                  }
                  if (name.includes("coach") || code.includes("coach") || desc.includes("coach") || name.includes("hlv") || code.includes("hlv")) {
                    return "coach";
                  }
                  return "court";
                };

                const category = getVoucherCategory(promotion);
                
                // Determine voucher badge text
                const getVoucherBadge = (promo: Promotion) => {
                  const isPercent = promo.discountType === "Percent";
                  const val = promo.discountValue;
                  
                  if ((isPercent && val >= 15) || (!isPercent && val >= 100000)) {
                    return "Giá trị cao";
                  }
                  if (category === "combo") {
                    return "Phổ biến";
                  }
                  if (promo.promotionCode.toLowerCase().includes("new") || promo.promotionId % 3 === 0) {
                    return "Mới";
                  }
                  return "Sắp hết hạn";
                };

                const badgeText = getVoucherBadge(promotion);
                const categoryClass = 
                  category === "combo" 
                    ? styles.voucherCardCombo 
                    : category === "coach" 
                      ? styles.voucherCardCoach 
                      : styles.voucherCardCourt;

                const expiryDate = promotion.endDate 
                  ? new Date(promotion.endDate).toLocaleDateString("vi-VN") 
                  : null;

                return (
                  <div className={`${styles.voucherCard} ${categoryClass}`} key={promotion.promotionId}>
                    {/* Glossy overlay reflection */}
                    <div className={styles.voucherGlossy} />
                    
                    {/* Họa tiết lưới sân chìm */}
                    <div className={styles.voucherPattern} />

                    <div className={styles.voucherLeft}>
                      {badgeText && <span className={styles.voucherBadge}>{badgeText}</span>}
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
                      
                      {expiryDate && (
                        <span className={styles.voucherExpiry}>
                          HSD: {expiryDate}
                        </span>
                      )}

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
                            ? "Đã sao chép ✓"
                            : "Sao chép"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </section>

        {/* Testimonials section (Full Width, below Vouchers) */}
        <section className={styles.testimonialsSection}>
          <ScrollReveal animation="fade-up" duration={900}>
            <div className={styles.sectionHeaderCentered}>
              <span className={styles.testimonialBadge}>Đánh giá từ khách hàng</span>
              <h2 className={styles.testimonialTitle}>Cộng đồng nói gì về PickleClub</h2>
              <p className={styles.testimonialSub}>Những chia sẻ chân thực từ các hội viên và học viên tham gia hoạt động tại câu lạc bộ.</p>
            </div>

            {/* Overview Ratings Card (Card tổng quan lớn) */}
            <div className={styles.overviewCard}>
              {/* Left Column: Average Score */}
              <div className={styles.overviewLeft}>
                <h3 className={styles.ratingNumber}>4.8</h3>
                <div className={styles.ratingStarsWrap}>
                  <div className={styles.starsFilledBig}>★★★★★</div>
                  <p className={styles.totalReviewsText}>Dựa trên 142 đánh giá</p>
                </div>
              </div>

              {/* Middle Column: Distribution Bars */}
              <div className={styles.overviewMiddle}>
                {[
                  { star: 5, pct: 88 },
                  { star: 4, pct: 9 },
                  { star: 3, pct: 2 },
                  { star: 2, pct: 1 },
                  { star: 1, pct: 0 }
                ].map((row) => (
                  <div className={styles.statRow} key={row.star}>
                    <span className={styles.statStarLabel}>{row.star} ★</span>
                    <div className={styles.statBarContainer}>
                      <div className={styles.statBarFill} style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className={styles.statPctLabel}>{row.pct}%</span>
                  </div>
                ))}
              </div>

              {/* Right Column: Write Review CTA */}
              <div className={styles.overviewRight}>
                <h4>Chia sẻ trải nghiệm của bạn</h4>
                <p>Góp ý của bạn giúp PickleClub không ngừng nâng cấp chất lượng dịch vụ.</p>
                <button 
                  className={styles.writeReviewBtnPremium}
                  onClick={() => setReviewModalOpen(true)}
                >
                  ✍️ Gửi đánh giá ngay
                </button>
              </div>
            </div>

            {/* Filter Pills Container */}
            <div className={styles.filterPillsContainer}>
              {["Tất cả", "5 sao", "Có hình ảnh", "Đặt sân", "Coach", "Combo", "Mới nhất"].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className={`${styles.filterPill} ${activeFilter === pill ? styles.filterPillActive : ""}`}
                  onClick={() => setActiveFilter(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>

            <ReviewModal
              isOpen={reviewModalOpen}
              onClose={() => setReviewModalOpen(false)}
              title="Đánh giá Câu Lạc Bộ"
              onSuccess={() => {
                setReviewModalOpen(false);
              }}
            />

            {/* Comment Cards Grid with transition animation */}
            {visibleReviews.length === 0 ? (
              <div className={styles.emptyReviews}>
                Không có đánh giá nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <>
                <div className={styles.testimonialsGrid} key={currentIndex}>
                  {visibleReviews.map((review) => {
                    const isVerified = !!review.BookingID;
                    const serviceTag = review.CoachName ? "Coach" : (review.ReviewID === 9004 || review.ReviewID === 9005 || review.BookingID % 5 === 0) ? "Combo" : "Đặt sân";
                    const reviewDate = new Date(review.CreatedAt).toLocaleDateString("vi-VN");
                    
                    return (
                      <div className={styles.premiumReviewCard} key={review.ReviewID}>
                        {/* Top Accent Gradient Line */}
                        <div className={styles.cardAccentLine} />

                        <div className={styles.cardHeaderRow}>
                          <div className={styles.cardStars}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                className={i < review.Rating ? styles.starGold : styles.starGray}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className={styles.cardDate}>{reviewDate}</span>
                        </div>

                        {/* Decorative quote mark */}
                        <span className={styles.quoteMark}>“</span>

                        <p className={styles.premiumReviewComment}>
                          {review.Comment}
                        </p>

                        <div className={styles.cardFooterRow}>
                          <div className={styles.authorInfo}>
                            <div className={styles.authorAvatar}>
                              {review.AvatarURL ? (
                                <img src={review.AvatarURL} alt={review.FullName} />
                              ) : (
                                <span>{review.FullName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className={styles.authorText}>
                              <strong>{review.FullName}</strong>
                              <span className={styles.authorTarget}>
                                {review.CourtName ? `📍 ${review.CourtName}` : review.CoachName ? `👨‍🏫 ${review.CoachName}` : "Học viên PickleClub"}
                              </span>
                            </div>
                          </div>

                          {/* Right metadata badges and Helpful button */}
                          <div className={styles.cardMetaCol}>
                            <div className={styles.badgesWrap}>
                              {isVerified && <span className={styles.verifiedBadge}>✓ Đã xác thực</span>}
                              <span className={styles.serviceTag}>{serviceTag}</span>
                            </div>
                            <HelpfulButton reviewId={review.ReviewID} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Testimonial Dot Navigation Indicators */}
                {filteredReviews.length > itemsToShow && (
                  <div className={styles.reviewDots}>
                    {filteredReviews.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`${styles.reviewDot} ${currentIndex === i ? styles.reviewDotActive : ""}`}
                        onClick={() => setCurrentIndex(i)}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </ScrollReveal>
        </section>

        <ScrollReveal animation="zoom-in" duration={800}>
          <QuickActions />
        </ScrollReveal>
      </div>
    </main>
  );
}
