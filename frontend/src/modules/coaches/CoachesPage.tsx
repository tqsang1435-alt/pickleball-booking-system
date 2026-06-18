"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCoaches } from "@/services/coachApi";
import { getCoachImageUrl } from "@/utils/image";
import type { Coach } from "@/types/coach";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import styles from "./CoachesPage.module.css";

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

  const featuredCoach = useMemo(() => {
    return [...coaches].sort(
      (a, b) => Number(b.AverageRating || 0) - Number(a.AverageRating || 0)
    )[0];
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

              <div className={styles.search}>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm theo tên Coach, kỹ năng, chuyên môn..."
                />
                <button type="button">🔍</button>
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

                <button type="button">☰ Lọc nâng cao</button>
              </div>
            </div>

            <div className={styles.visual}>
              <img src="/images/coaches/hlv1.png" alt="Pickleball coach" />
            </div>

          </div>
        </div>
      </section>

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

              <section className={styles.bottomReviews}>
                <div className={styles.quoteIcon}>“</div>

                <div className={styles.reviewCard}>
                  <p>Dữ liệu đánh giá được tổng hợp từ hệ thống booking.</p>
                  <span>⭐ {averageRating}/5</span>
                </div>

                <div className={styles.reviewCard}>
                  <p>Có {coaches.length} Coach đang hoạt động trên hệ thống.</p>
                  <span>{coaches.length}+ Coach</span>
                </div>

                <div className={styles.reviewCard}>
                  <p>Tổng cộng {totalStudents}+ học viên đã tham gia.</p>
                  <span>{totalStudents}+ học viên</span>
                </div>
              </section>
            </main>

            <aside className={styles.sidebar}>
              <div className={styles.filterBox}>
                <div className={styles.filterTop}>
                  <h3>Bộ lọc tìm kiếm</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword("");
                      setSkill("all");
                      setSortBy("rating");
                    }}
                  >
                    Xóa lọc
                  </button>
                </div>

                <label>Kỹ năng</label>
                <div className={styles.skillList}>
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

                <label>Từ khóa</label>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Nhập tên hoặc chuyên môn"
                />

                <label>Sắp xếp</label>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="priceAsc">Giá thấp đến cao</option>
                  <option value="priceDesc">Giá cao đến thấp</option>
                  <option value="experience">Kinh nghiệm nhiều nhất</option>
                </select>
              </div>

              <div className={styles.reviewBox}>
                <div className={styles.reviewTitle}>
                  <h3>Đánh giá từ học viên</h3>
                  <span>Xem tất cả</span>
                </div>

                <div className={styles.reviewScore}>
                  <strong>{averageRating}</strong>
                  <span>/5</span>
                </div>

                <div className={styles.reviewStars}>★★★★★</div>

                <p>
                  Tổng hợp từ {coaches.length} Coach và {totalStudents}+ học viên
                  trong hệ thống.
                </p>

                <div className={styles.reviewEmpty}>
                  Chưa có bình luận chi tiết từ database.
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
