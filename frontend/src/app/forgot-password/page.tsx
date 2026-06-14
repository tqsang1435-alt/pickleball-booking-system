"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { forgotPasswordApi, resetPasswordApi } from "@/services/authApi";
import styles from "./ForgotPassword.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await forgotPasswordApi({ email });

      setMessage("OTP đã được gửi về email của bạn.");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi OTP thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await resetPasswordApi({
        email,
        otp,
        newPassword,
      });

      setMessage("Đổi mật khẩu thành công.");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đổi mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.forgotPage}>
      <section className={styles.forgotCard}>
        <div className={styles.forgotLogo}>
          <Image
            src="/images/logo.png"
            alt="Pickle Club"
            width={42}
            height={42}
            className={styles.logoImage}
            priority
          />
          <strong>Pickle Club</strong>
        </div>

        <div className={styles.forgotIcon}>🔐</div>

        <h1 className={styles.title}>Quên mật khẩu?</h1>

        <p className={styles.desc}>
          {step === 1
            ? "Nhập email để nhận mã OTP đặt lại mật khẩu."
            : "Nhập OTP và mật khẩu mới để hoàn tất."}
        </p>

        {message && <div className={styles.success}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={step === 1 ? handleSendOtp : handleResetPassword}>
          <label className={styles.label}>
            Email
            <div className={styles.inputBox}>
              <span>✉️</span>
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                disabled={loading || step === 2}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          {step === 2 && (
            <>
              <label className={styles.label}>
                Mã OTP
                <div className={styles.inputBox}>
                  <span>🔢</span>
                  <input
                    type="text"
                    placeholder="Nhập mã OTP"
                    value={otp}
                    disabled={loading}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              </label>

              <label className={styles.label}>
                Mật khẩu mới
                <div className={styles.inputBox}>
                  <span>🔒</span>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    disabled={loading}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </label>
            </>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? "Đang xử lý..."
              : step === 1
              ? "Gửi mã OTP"
              : "Đổi mật khẩu"}
          </button>
        </form>

        <div className={styles.divider}>
          <span>hoặc</span>
        </div>

        <Link href="/login" className={styles.backLogin}>
          ← Quay lại đăng nhập
        </Link>
      </section>
    </main>
  );
}

