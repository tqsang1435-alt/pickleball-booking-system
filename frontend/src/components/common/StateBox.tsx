import styles from "./StateBox.module.css";

type Props = {
  title: string;
  description?: string;
  variant?: "loading" | "error" | "empty";
};

const ICONS: Record<NonNullable<Props["variant"]>, string> = {
  loading: "○",
  error: "!",
  empty: "—",
};

export default function StateBox({ title, description, variant = "empty" }: Props) {
  return (
    <div className={`${styles.box} ${styles[variant]}`} role={variant === "error" ? "alert" : "status"}>
      <span className={styles.icon} aria-hidden="true">{ICONS[variant]}</span>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
