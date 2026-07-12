"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./HomePage.module.css";

export default function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  const slides = [
    {
      eyebrow: "Play. Connect. Win.",
      title: (
        <>
          Đặt sân <span>Pickleball</span>
          <br />
          nhanh chóng, dễ dàng
        </>
      ),
      desc: "Kết nối cộng đồng Pickleball, trải nghiệm những khoảnh khắc thể thao tuyệt vời cùng Pickle Club.",
      primaryText: "Đặt sân ngay →",
      primaryHref: "/courts",
      secondaryText: "Tìm Coach",
      secondaryHref: "/coaches",
      image: "/images/home.png",
      showUsers: false
    },
    {
      eyebrow: "TRAIN SMARTER",
      title: (
        <>
          Nâng trình cùng
          <br />
          <span>Coach chuyên nghiệp</span>
        </>
      ),
      desc: "Chọn huấn luyện viên phù hợp với trình độ, mục tiêu và thời gian của bạn.",
      primaryText: "Tìm Coach ngay →",
      primaryHref: "/coaches",
      secondaryText: "Xem Coach nổi bật",
      secondaryHref: "/coaches",
      image: "/images/home_banner_coach.jpg",
      showUsers: false
    },
    {
      eyebrow: "TOURNAMENT SEASON 2026",
      title: (
        <>
          Bước vào sân đấu
          <br />
          <span>chinh phục giới hạn</span>
        </>
      ),
      desc: "Tham gia các giải Pickleball phong trào và chuyên nghiệp trên toàn quốc.",
      primaryText: "Khám phá giải đấu →",
      primaryHref: "/tournaments",
      secondaryText: "Xem giải nổi bật",
      secondaryHref: "/tournaments",
      image: "/images/home_banner_tournament.jpg",
      showUsers: false
    },
    {
      eyebrow: "NEVER PLAY ALONE",
      title: (
        <>
          Tìm đồng đội
          <br />
          <span>đúng trình, đúng lịch</span>
        </>
      ),
      desc: "Kết nối với cộng đồng Pickleball gần bạn và tạo buổi chơi chỉ trong vài phút.",
      primaryText: "Tìm người chơi →",
      primaryHref: "/matching",
      secondaryText: "Tạo nhóm chơi",
      secondaryHref: "/matching",
      image: "/images/home_banner_players.jpg",
      showUsers: false
    }
  ];

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Autoplay slides every 5.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[activeIdx];

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroCard}>
        {/* Navigation Arrows */}
        <button 
          className={`${styles.carouselArrow} ${styles.carouselArrowPrev}`} 
          onClick={handlePrev}
          aria-label="Previous Slide"
        >
          ‹
        </button>
        <button 
          className={`${styles.carouselArrow} ${styles.carouselArrowNext}`} 
          onClick={handleNext}
          aria-label="Next Slide"
        >
          ›
        </button>

        {/* Slide Content wrapper triggering fade transition using key */}
        <div className={`${styles.heroContent} ${styles.slideAnimation}`} key={activeIdx}>
          <p className={styles.script}>{currentSlide.eyebrow}</p>

          <h1>{currentSlide.title}</h1>

          <p className={styles.desc}>{currentSlide.desc}</p>

          <div className={styles.heroActions}>
            <Link href={currentSlide.primaryHref} className={styles.primary}>
              {currentSlide.primaryText}
            </Link>

            <Link href={currentSlide.secondaryHref} className={styles.secondary}>
              {currentSlide.secondaryText}
            </Link>
          </div>

          {currentSlide.showUsers && (
            <div className={styles.heroUsers}>
              <div className={styles.userAvatars}>
                <span>VA</span>
                <span>HL</span>
                <span>MK</span>
                <span>+</span>
              </div>
              <p>
                <strong>10K+</strong> người chơi đã tham gia cùng Pickle Club
              </p>
            </div>
          )}
        </div>

        <div className={`${styles.heroImageWrapper} ${styles.slideAnimation}`} key={`img-${activeIdx}`}>
          <img
            src={currentSlide.image}
            alt="Pickleball representation banner"
            className={styles.heroImg}
          />
        </div>

        {/* Carousel indicator dots */}
        <div className={styles.carouselDots}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.carouselDot} ${idx === activeIdx ? styles.carouselDotActive : ""}`}
              onClick={() => setActiveIdx(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
