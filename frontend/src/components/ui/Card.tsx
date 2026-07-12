import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
  interactive?: boolean;
};

export default function Card({ padded = true, interactive = false, className = "", ...props }: CardProps) {
  const classes = [styles.card, padded ? styles.padded : "", interactive ? styles.interactive : "", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} {...props} />;
}
