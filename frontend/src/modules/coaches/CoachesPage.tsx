"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getCoaches } from "@/services/coachApi";
import type { Coach } from "@/types/coach";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import styles from "./CoachesPage.module.css";

const SKILL_OPTIONS = [
  { value: "all", label: "Tất cả kỹ năng" },
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Professional", label: "Professional" },
];

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [keyword, setKeyword] = useState("");
  const [skill, setSkill] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className={styles.dropdownWrap} ref={dropdownRef}>
          <span className={styles.dropdownLabel}>Kỹ năng</span>
          <button
            type="button"
            className={`${styles.dropdownTrigger} ${dropdownOpen ? styles.dropdownTriggerOpen : ""}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            <span>{SKILL_OPTIONS.find((o) => o.value === skill)?.label ?? "Tất cả kỹ năng"}</span>
            <span className={`${styles.dropdownArrow} ${dropdownOpen ? styles.dropdownArrowUp : ""}`}>▾</span>
          </button>

          {dropdownOpen && (
            <ul className={styles.dropdownMenu} role="listbox">
              {SKILL_OPTIONS.map((opt) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={skill === opt.value}
                  className={`${styles.dropdownItem} ${skill === opt.value ? styles.dropdownItemActive : ""}`}
                  onClick={() => {
                    setSkill(opt.value);
                    setDropdownOpen(false);
                  }}
                >
                  {skill === opt.value && <span className={styles.checkmark}>✓</span>}
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          className={styles.resetBtn}
          onClick={() => { setKeyword(""); setSkill("all"); setDropdownOpen(false); }}
        >
          Xóa bộ lọc
        </button>
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
                    <button type="button" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>Xem lịch &amp; đặt Coach (sắp có)</button>
                    <Link href={`/coaches/${coach.CoachID}`} className={styles.outline}>Xem hồ sơ chi tiết</Link>
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
