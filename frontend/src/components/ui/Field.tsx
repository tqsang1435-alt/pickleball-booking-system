import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import styles from "./Field.module.css";

type BaseProps = {
  label: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
};

type FieldInputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type FieldSelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement>;
type FieldTextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

function FieldShell({
  label,
  hint,
  error,
  children,
}: BaseProps & { children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? <span className={styles.error}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}

export function TextField({ label, hint, error, leftIcon, className = "", ...props }: FieldInputProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <span className={[styles.control, error ? styles.invalid : "", className].filter(Boolean).join(" ")}>
        {leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}
        <input aria-invalid={Boolean(error) || undefined} {...props} />
      </span>
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, children, className = "", ...props }: FieldSelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <span className={[styles.control, styles.selectControl, error ? styles.invalid : "", className].filter(Boolean).join(" ")}>
        <select aria-invalid={Boolean(error) || undefined} {...props}>{children}</select>
      </span>
    </FieldShell>
  );
}

export function TextareaField({ label, hint, error, className = "", ...props }: FieldTextareaProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <span className={[styles.textareaControl, error ? styles.invalid : "", className].filter(Boolean).join(" ")}>
        <textarea aria-invalid={Boolean(error) || undefined} {...props} />
      </span>
    </FieldShell>
  );
}
