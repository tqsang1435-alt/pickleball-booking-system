"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { FiLock, FiUser } from "react-icons/fi";

import { googleLoginApi, loginApi } from "@/services/authApi";
import { getDashboardPath, saveAuth } from "@/utils/authStorage";
import { isValidEmail } from "@/utils/validators";

import styles from "./AuthPage.module.css";

type LoginResponse = {
  token?: string;
  user?: any;
  data?: {
    token?: string;
    user?: any;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleLoginSuccess(response: LoginResponse) {
    const token = response.token || response.data?.token;
    const user = response.user || response.data?.user;

    if (!token || !user) {
      throw new Error("Backend chưa trả token hoặc user.");
    }

    saveAuth(token, user);

    const role = user?.roles?.[0] || user?.role || user?.RoleName || "";

    window.dispatchEvent(new Event("auth-change"));
    router.push(getDashboardPath(role));
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setError("Email không hợp lệ");
      return;
    }

    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await loginApi({
        email: email.trim(),
        password,
      });

      handleLoginSuccess(response as LoginResponse);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(credential?: string) {
    if (!credential) {
      setError("Không nhận được Google credential");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await googleLoginApi({ credential });

      handleLoginSuccess(response as LoginResponse);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Đăng nhập Google thất bại"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.avatar}>
          <FiUser size={32} />
        </div>

        <h1 className={styles.title}>Đăng nhập</h1>

        <p className={styles.subtitle}>
          Chào mừng bạn quay lại Pickle Club
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.inputGroup}>
          <FiUser size={19} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            disabled={loading}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <FiLock size={19} />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            disabled={loading}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className={styles.options}>
          <label className={styles.remember}>
            <input type="checkbox" disabled={loading} />
            <span>Remember me</span>
          </label>

          <button
            type="button"
            className={styles.forgot}
            disabled={loading}
            onClick={() => router.push("/forgot-password")}
          >
            Forgot Password?
          </button>
        </div>

        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? "ĐANG XỬ LÝ..." : "LOGIN"}
        </button>

        <div className={styles.googleDivider}>
          <span>Hoặc đăng nhập bằng</span>
        </div>

        <div className={styles.googleLogin}>
          <GoogleLogin
            onSuccess={(credentialResponse) =>
              handleGoogleLogin(credentialResponse.credential)
            }
            onError={() => setError("Đăng nhập Google thất bại")}
          />
        </div>

        <p className={styles.register}>
          Chưa có tài khoản? <Link href="/register">Đăng ký</Link>
        </p>
      </form>
    </main>
  );
}