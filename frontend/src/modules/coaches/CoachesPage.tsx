"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCoaches } from "@/services/coachApi";
import { getCoachImageUrl } from "@/utils/image";
import type { Coach } from "@/types/coach";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import styles from "./CoachesPage.module.css";
import AICoachForm, { AICoachPayload } from "./components/AICoachForm";
import AICoachCard, { CoachScoreResult } from "./components/AICoachCard";

const SKILL_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Professional", label: "Professional" },
];

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [keyword, setKeyword] = useState("");
  const [skill, setSkill] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI State
  const [showAiForm, setShowAiForm] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<CoachScoreResult[]>([]);
  const [aiFallback, setAiFallback] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCoaches() {
      try {
        setLoading(true);
        setError("");

        const data = await getCoaches();

        if (mounted) {
          setCoaches(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Không tải được Coach.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCoaches();

    return () => {
      mounted = false;
    };
  }, []);

  const totalStudents = useMemo(() => {
    return coaches.reduce((sum, coach) => sum + Number(coach.TotalStudents || 0), 0);
  }, [coaches]);

  const averageRating = useMemo(() => {
    if (coaches.length === 0) return "0.0";

    const total = coaches.reduce(
      (sum, coach) => sum + Number(coach.AverageRating || 0),
      0
    );

    return (total / coaches.length).toFixed(1);
  }, [coaches]);

  const featuredCoaches = useMemo(() => {
    return [...coaches]
      .sort((a, b) => Number(b.AverageRating || 0) - Number(a.AverageRating || 0))
      .slice(0, 3);
  }, [coaches]);

  const filtered = useMemo(() => {
    const result = coaches.filter((coach) => {
      const text = `${coach.FullName} ${coach.Specialization || ""} ${
        coach.SkillLevel || ""
      }`.toLowerCase();

      const matchKeyword = text.includes(keyword.toLowerCase());
      const matchSkill = skill === "all" || coach.SkillLevel === skill;

      return matchKeyword && matchSkill;
    });

    switch (sortBy) {
      case "priceAsc":
        return result.sort((a, b) => Number(a.HourlyRate || 0) - Number(b.HourlyRate || 0));

      case "priceDesc":
        return result.sort((a, b) => Number(b.HourlyRate || 0) - Number(a.HourlyRate || 0));

      case "experience":
        return result.sort(
          (a, b) => Number(b.ExperienceYears || 0) - Number(a.ExperienceYears || 0)
        );

      case "rating":
      default:
        return result.sort(
          (a, b) => Number(b.AverageRating || 0) - Number(a.AverageRating || 0)
        );
    }
  }, [coaches, keyword, skill, sortBy]);

  const handleAiSubmit = async (data: AICoachPayload) => {
    setIsAiLoading(true);
    setAiResults([]);
    try {
      const budgetStr = data.budget.split("-").pop() || data.budget;
      const parsedBudget = parseFloat(budgetStr.replace(/[^\d]/g, "")) || 500000;

      const mappedPayload = {
        level: data.level,
        budget: parsedBudget,
        preferredTime: data.availableTime,
        goals: data.goal ? [data.goal] : [],
        styleText: data.description
      };

      const { apiClient } = await import("@/services/apiClient");
      const result = await apiClient<any>("/api/ai/coaches/recommend", {
        method: "POST",
        body: mappedPayload
      });
      
      setAiFallback(result.fallback || false);
      
      const mergedResults: CoachScoreResult[] = (result.results || []).map((r: any) => {
        const coachOrigin = coaches.find(c => c.CoachID === r.coachId);
        return {
          coach: coachOrigin as Coach,
          score: r.score || 80,
          reasons: r.reasons || []
        };
      }).filter((r: CoachScoreResult) => r.coach !== undefined);
      
      setAiResults(mergedResults);
    } catch (err) {
      console.error(err);
      alert("Hệ thống AI đang bận. Vui lòng thử lại sau.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <p className={styles.eyebrow}>Tìm Coach phù hợp</p>

              <h1>
                Nâng trình mỗi ngày
                <span>cùng Coach chuyên nghiệp</span>
              </h1>

              <p className={styles.desc}>
                Đội ngũ Coach giàu kinh nghiệm, đồng hành cùng bạn trên hành trình
                chinh phục Pickleball.
              </p>

              <div className={styles.searchActions}>
                <div className={styles.search}>
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm theo tên Coach, kỹ năng..."
                  />
                  <button type="button" className={styles.searchBtn}>🔍</button>
                </div>
                
                <div className={styles.aiButtonWrapper}>
                  <button 
                    type="button" 
                    className={`${styles.aiToggleBtn} ${showAiForm ? styles.active : ""}`}
                    onClick={() => setShowAiForm(!showAiForm)}
                  >
                    ✨ Tìm Coach bằng AI
                  </button>
                  <span className={styles.aiSubtext}>AI sẽ phân tích và gợi ý Coach phù hợp nhất cho bạn</span>
                </div>
              </div>

              <div className={styles.quickFilter}>
                {SKILL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={skill === option.value ? styles.activeChip : ""}
                    onClick={() => setSkill(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.visual}>
              <img src="/images/coaches/hlv1.png" alt="Pickleball coach" />
            </div>

          </div>
        </div>
      </section>

      {showAiForm && (
        <div className={`container ${styles.aiFormFullWidth}`}>
          <AICoachForm onSubmit={handleAiSubmit} isLoading={isAiLoading} />
        </div>
      )}

      <section className={styles.stats}>
        <div className={`container ${styles.statsGrid}`}>
          <div className={styles.statCard}>
            <h3>{coaches.length}+</h3>
            <p>Coach chuyên nghiệp</p>
          </div>

          <div className={styles.statCard}>
            <h3>{totalStudents}+</h3>
            <p>Học viên đã tham gia</p>
          </div>

          <div className={styles.statCard}>
            <h3>{averageRating}/5</h3>
            <p>Đánh giá trung bình</p>
          </div>

          <div className={styles.statCard}>
            <h3>100%</h3>
            <p>Dữ liệu từ hệ thống</p>
          </div>
        </div>
      </section>

      <section className={`container ${styles.content}`}>
        {loading ? (
          <StateBox variant="loading" title="Đang tải Coach" />
        ) : error ? (
          <StateBox variant="error" title="Không tải được dữ liệu" description={error} />
        ) : coaches.length === 0 ? (
          <StateBox
            variant="empty"
            title="Chưa có Coach nào trên hệ thống"
            description="Hệ thống hiện tại chưa có dữ liệu huấn luyện viên."
          />
        ) : (
          <div className={styles.layout}>
            <main className={styles.mainList}>
              {aiResults.length > 0 && (
                <section className={styles.aiResultsSection}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2>✨ Kết quả gợi ý từ AI</h2>
                      {aiFallback && (
                        <p style={{ color: "#b45309", fontSize: "0.85rem", marginTop: "4px" }}>
                          ⚠ Đang sử dụng thuật toán cơ bản do hệ thống AI bận.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={styles.aiGrid}>
                    {aiResults.map((result, index) => (
                      <AICoachCard 
                        key={result.coach.CoachID} 
                        coachResult={result} 
                        isBestMatch={index === 0} 
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className={styles.featuredSection}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>👑 Coach nổi bật</h2>
                  </div>

                  <Link href="#all-coaches">Xem tất cả →</Link>
                </div>

                <div className={styles.featuredGrid}>
                  {featuredCoaches.map((coach, index) => (
                    <article className={styles.featuredCard} key={coach.CoachID}>
                      <div className={styles.badge}>
                        {index === 0
                          ? "Top đặt lịch"
                          : index === 1
                          ? "Top đánh giá"
                          : "Top yêu thích"}
                      </div>

                      <div className={styles.favorite}>♡</div>

                      <img 
                        src={getCoachImageUrl(coach.AvatarURL)} 
                        alt={coach.FullName} 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('hlv1.png')) {
                            target.src = "/images/coaches/hlv1.png";
                          }
                        }}
                      />

                      <div className={styles.featuredBody}>
                        <h3>{coach.FullName}</h3>

                        <p>
                          ⭐ {Number(coach.AverageRating || 0).toFixed(1)} (
                          {coach.TotalStudents || 0}+)
                          <span>•</span>
                          {coach.ExperienceYears || 0} năm kinh nghiệm
                        </p>

                        <p>Chuyên môn: {coach.Specialization || coach.SkillLevel}</p>

                        <div className={styles.tags}>
                          <span>{coach.SkillLevel}</span>
                          <span>{coach.Specialization || "Pickleball"}</span>
                        </div>

                        <div className={styles.featuredBottom}>
                          <strong>{formatCurrency(coach.HourlyRate)}</strong>
                          <span>/ giờ</span>
                        </div>

                        <div className={styles.featuredActions}>
                          <Link href={`/coaches/${coach.CoachID}`}>
                            Xem hồ sơ
                          </Link>

                          <Link href={`/coaches/${coach.CoachID}#booking-section`}>
                            Đặt lịch ngay
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section id="all-coaches" className={styles.allSection}>
                <div className={styles.listHeader}>
                  <div>
                    <h2>Tất cả Coach</h2>
                    <p>Hiển thị {filtered.length} Coach</p>
                  </div>
                  <div className={styles.sortControl}>
                    <label>Sắp xếp:</label>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                      <option value="rating">Đánh giá cao nhất</option>
                      <option value="priceAsc">Giá thấp đến cao</option>
                      <option value="priceDesc">Giá cao đến thấp</option>
                      <option value="experience">Kinh nghiệm nhiều nhất</option>
                    </select>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <StateBox variant="empty" title="Không có Coach phù hợp" />
                ) : (
                  <div className={styles.grid}>
                    {filtered.map((coach) => (
                      <article className={styles.card} key={coach.CoachID}>
                        <div className={styles.cardImage}>
                          <img 
                            src={getCoachImageUrl(coach.AvatarURL)} 
                            alt={coach.FullName} 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes('hlv1.png')) {
                                target.src = "/images/coaches/hlv1.png";
                              }
                            }}
                          />
                          <button type="button">♡</button>
                        </div>

                        <div className={styles.cardBody}>
                          <h3>{coach.FullName}</h3>

                          <p className={styles.meta}>
                            ⭐ {Number(coach.AverageRating || 0).toFixed(1)} (
                            {coach.TotalStudents || 0}+ học viên)
                          </p>

                          <p>{coach.ExperienceYears || 0} năm kinh nghiệm</p>

                          <p className={styles.special}>
                            Chuyên môn: {coach.Specialization || coach.SkillLevel}
                          </p>

                          <div className={styles.tags}>
                            <span>{coach.SkillLevel}</span>
                            <span>{coach.Specialization || "Pickleball"}</span>
                          </div>

                          <div className={styles.cardFooter}>
                            <div>
                              <strong>{formatCurrency(coach.HourlyRate)}</strong>
                              <span>/ giờ</span>
                            </div>
                          </div>

                          <div className={styles.cardActions}>
                            <Link href={`/coaches/${coach.CoachID}`}>
                              Xem hồ sơ
                            </Link>

                            <Link href={`/coaches/${coach.CoachID}#booking-section`}>
                              Đặt lịch
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className={styles.reviewSection}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewScoreWrap}>
                    <div className={styles.reviewScoreBig}>{averageRating}</div>
                    <div className={styles.reviewScoreDetails}>
                      <div className={styles.reviewStars}>★★★★★</div>
                      <span>Dựa trên {totalStudents}+ học viên đã trải nghiệm</span>
                    </div>
                  </div>
                  
                  <div className={styles.reviewAction}>
                    <button type="button">Xem tất cả đánh giá</button>
                  </div>
                </div>

                <div className={styles.reviewGrid}>
                  <div className={styles.reviewCommentCard}>
                    <div className={styles.quoteIcon}>“</div>
                    <p>Hệ thống gợi ý HLV bằng AI siêu chuẩn! Mình tìm được người hướng dẫn kiên nhẫn và đúng chuyên môn dink bóng chỉ sau 1 phút.</p>
                    <div className={styles.commentAuthor}>
                      <div className={styles.authorAvatar}>V</div>
                      <div>
                        <strong>Văn Anh</strong>
                        <span>Học viên Beginner</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.reviewCommentCard}>
                    <div className={styles.quoteIcon}>“</div>
                    <p>Hồ sơ Coach rất minh bạch và chi tiết. Mình thích nhất là có thể xem lịch trống của Coach trước khi quyết định booking.</p>
                    <div className={styles.commentAuthor}>
                      <div className={styles.authorAvatar}>M</div>
                      <div>
                        <strong>Minh Khang</strong>
                        <span>Học viên Intermediate</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.reviewCommentCard}>
                    <div className={styles.quoteIcon}>“</div>
                    <p>Các khóa học và Coach trên nền tảng cực kỳ chất lượng. Chuyên môn cao và thái độ giảng dạy rất nhiệt tình!</p>
                    <div className={styles.commentAuthor}>
                      <div className={styles.authorAvatar}>T</div>
                      <div>
                        <strong>Thanh Tùng</strong>
                        <span>Học viên Advanced</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </main>

          </div>
        )}
      </section>
    </main>
  );
}
