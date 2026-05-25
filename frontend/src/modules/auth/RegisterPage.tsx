"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { registerApi } from "@/services/authApi";
import { isStrongPassword, isValidEmail, isValidPhone } from "@/utils/validators";
import styles from "./AuthPage.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError("Vui lòng nhập họ tên.");
      return;
    }

    if (!isValidEmail(form.email)) {
      setError("Email không hợp lệ.");
      return;
    }

    if (!isValidPhone(form.phoneNumber)) {
      setError("Số điện thoại phải gồm đúng 10 chữ số.");
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError("Mật khẩu tối thiểu 8 ký tự, có chữ hoa, số và ký tự đặc biệt.");
      return;
    }

    try {
  setSubmitting(true);
  await registerApi(form);
  router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
} catch (err) {
  setError(err instanceof Error ? err.message : "Đăng ký thất bại.");
} finally {
  setSubmitting(false);
}
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
      
        <h1>Đăng ký tài khoản</h1>
        <p>Tạo tài khoản Player để sử dụng chức năng đặt sân và đặt Coach.</p>

        {error ? <div className={styles.error}>{error}</div> : null}

        <label>
          Họ tên
          <input value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} placeholder="Nguyễn Văn A" />
        </label>

        <label>
          Email
          <input value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="you@example.com" />
        </label>

        <label>
          Số điện thoại
          <input value={form.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} placeholder="0901234567" />
        </label>

        <label>
          Mật khẩu
          <input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Ví dụ: Pickle@123" />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        <p className={styles.switch}>
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </p>
      </form>
    </main>
  );
}
