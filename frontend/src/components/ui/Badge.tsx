import type { HTMLAttributes } from "react";
import styles from "./Badge.module.css";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export default function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return <span className={[styles.badge, styles[tone], className].filter(Boolean).join(" ")} {...props} />;
}
