"use client";

import { useEffect, useMemo, useState } from "react";
import { getCoaches } from "@/services/coachApi";
import type { Coach } from "@/types/coach";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import styles from "./CoachesPage.module.css";

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [keyword, setKeyword] = useState("");
  const [skill, setSkill] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCoaches() {
      try {
        setLoading(true);
        setError("");
        const data = await getCoaches();
        if (mounted) setCoaches(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Không tải được Coach.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCoaches();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return coaches.filter((coach) => {
      const text = `${coach.FullName} ${coach.Specialization || ""} ${coach.SkillLevel}`.toLowerCase();
      const matchKeyword = text.includes(keyword.toLowerCase());
      const matchSkill = skill === "all" || coach.SkillLevel === skill;
      return matchKeyword && matchSkill;
    });
  }, [coaches, keyword, skill]);

  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.visual}>
  <img src="/images/coaches/hlv1.png" alt="Pickleball coach" />
</div>
            <div>
              <p>Find your perfect coach</p>
              <h1>Tìm Coach phù hợp <span>Nâng trình mỗi ngày</span></h1>
              <span className={styles.desc}>
                Đội ngũ Coach giàu kinh nghiệm, chuyên nghiệp đồng hành cùng bạn trên hành trình chinh phục Pickleball.
              </span>
              <div className={styles.search}>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm theo tên Coach, kỹ năng, chuyên môn..."
                />
                <button type="button">🔍</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`container ${styles.filter}`}>
        <label>
          Kỹ năng
          <select value={skill} onChange={(event) => setSkill(event.target.value)}>
            <option value="all">Tất cả kỹ năng</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Professional">Professional</option>
          </select>
        </label>

        <button type="button" onClick={() => { setKeyword(""); setSkill("all"); }}>Bộ lọc</button>
      </section>

      <section className={`container ${styles.content}`}>
        {loading ? (
          <StateBox variant="loading" title="Đang tải Coach" />
        ) : error ? (
          <StateBox variant="error" title="Không tải được dữ liệu" description={error} />
        ) : filtered.length === 0 ? (
          <StateBox variant="empty" title="Không có Coach phù hợp" />
        ) : (
          <>
            <p className={styles.count}>Hiển thị {filtered.length} Coach</p>
            <div className={styles.list}>
              {filtered.map((coach) => (
                <article className={styles.card} key={coach.CoachID}>
                  <img src={coach.AvatarURL || "/images/home/avatar-placeholder.jpg"} alt={coach.FullName} />

                  <div className={styles.info}>
                    <h3>{coach.FullName} <span>●</span></h3>
                    <p>⭐ {Number(coach.AverageRating || 0).toFixed(1)} · Kinh nghiệm {coach.ExperienceYears || 0} năm · Học viên {coach.TotalStudents || 0}+</p>
                    <p>Chuyên môn: {coach.Specialization || "Kỹ thuật Pickleball cơ bản"}</p>
                    <p>{coach.Biography || "Coach chuyên nghiệp, đồng hành cùng học viên theo mục tiêu cá nhân."}</p>
                    <div className={styles.tags}>
                      <span>{coach.SkillLevel}</span>
                      <span>{coach.Specialization || "Pickleball"}</span>
                    </div>
                  </div>

                  <div className={styles.price}>
                    <strong>{formatCurrency(coach.HourlyRate)}</strong>
                    <span>/ giờ</span>
                    <button type="button">Xem lịch & đặt Coach</button>
                    <button type="button" className={styles.outline}>Xem hồ sơ chi tiết</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
