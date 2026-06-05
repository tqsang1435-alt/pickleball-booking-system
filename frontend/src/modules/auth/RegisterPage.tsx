"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { FiLock, FiMail, FiPhone, FiUser } from "react-icons/fi";

import { googleLoginApi, registerApi } from "@/services/authApi";
import { saveAuth } from "@/utils/authStorage";
import {
  isStrongPassword,
  isValidEmail,
  isValidPhone,
} from "@/utils/validators";

import styles from "./AuthPage.module.css";

type RegisterForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

type AuthResponse = {
  token?: string;
  user?: any;
  data?: {
    token?: string;
    user?: any;
  };
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(name: keyof RegisterForm, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function validateForm() {
    if (!form.fullName.trim()) {
      return "Vui lòng nhập họ tên.";
    }

    if (!isValidEmail(form.email)) {
      return "Email không hợp lệ.";
    }

    if (!isValidPhone(form.phoneNumber)) {
      return "Số điện thoại phải gồm đúng 10 chữ số.";
    }

    if (!isStrongPassword(form.password)) {
      return "Mật khẩu tối thiểu 8 ký tự, có chữ hoa, số và ký tự đặc biệt.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validateMessage = validateForm();

    if (validateMessage) {
      setError(validateMessage);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await registerApi({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      });

      router.push(`/verify-otp?email=${encodeURIComponent(form.email.trim())}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Đăng ký thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleRegister(credential?: string) {
    if (!credential) {
      setError("Không nhận được Google credential.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = (await googleLoginApi({ credential })) as AuthResponse;

      const token = response.token || response.data?.token;
      const user = response.user || response.data?.user;

      if (!token || !user) {
        throw new Error("Backend chưa trả token hoặc user.");
      }

      saveAuth(token, user);

      window.dispatchEvent(new Event("auth-change"));

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Đăng ký Google thất bại."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.avatar}>
          <FiUser size={32} />
        </div>

        <h1 className={styles.title}>Đăng ký</h1>

        <p className={styles.subtitle}>
          Tạo tài khoản Pickle Club để đặt sân và đặt Coach
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.inputGroup}>
          <FiUser size={18} />
          <input
            type="text"
            value={form.fullName}
            disabled={submitting}
            placeholder="Họ và tên"
            onChange={(event) => updateField("fullName", event.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <FiMail size={18} />
          <input
            type="email"
            value={form.email}
            disabled={submitting}
            placeholder="Email"
            onChange={(event) => updateField("email", event.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <FiPhone size={18} />
          <input
            type="tel"
            value={form.phoneNumber}
            disabled={submitting}
            placeholder="Số điện thoại"
            onChange={(event) => updateField("phoneNumber", event.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <FiLock size={18} />
          <input
            type="password"
            value={form.password}
            disabled={submitting}
            placeholder="Mật khẩu"
            onChange={(event) => updateField("password", event.target.value)}
          />
        </div>

        <button type="submit" className={styles.loginBtn} disabled={submitting}>
          {submitting ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ"}
        </button>

        <div className={styles.googleDivider}>
          <span>Hoặc đăng ký bằng</span>
        </div>

        <div className={styles.googleLogin}>
          <GoogleLogin
            onSuccess={(credentialResponse) =>
              handleGoogleRegister(credentialResponse.credential)
            }
            onError={() => setError("Đăng ký Google thất bại.")}
          />
        </div>

        <p className={styles.register}>
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </p>
      </form>
    </main>
  );
}