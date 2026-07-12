"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./ScrollReveal.module.css";

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "zoom-out";
  duration?: number; // in ms
  delay?: number; // in ms
  threshold?: number;
  className?: string;
}

export default function ScrollReveal({
  children,
  animation = "fade-up",
  duration = 800,
  delay = 0,
  threshold = 0.1,
  className = "",
}: ScrollRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Toggle the visibility state when entering/leaving viewport.
        // This ensures the animation plays on both scroll down and scroll up.
        setIsRevealed(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px", // Trigger when slightly inside the viewport
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold]);

  const getAnimationClass = () => {
    switch (animation) {
      case "fade-down":
        return styles.fadeDown;
      case "fade-left":
        return styles.fadeLeft;
      case "fade-right":
        return styles.fadeRight;
      case "zoom-in":
        return styles.zoomIn;
      case "zoom-out":
        return styles.zoomOut;
      case "fade-up":
      default:
        return styles.fadeUp;
    }
  };

  const style: React.CSSProperties = {
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
  };

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${isRevealed ? styles.revealed : getAnimationClass()} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
