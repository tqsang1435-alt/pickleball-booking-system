import styles from "./StateBox.module.css";

type Props = {
  title: string;
  description?: string;
  variant?: "loading" | "error" | "empty";
};

export default function StateBox({ title, description, variant = "empty" }: Props) {
  return (
    <div className={`${styles.box} ${styles[variant]}`}>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
