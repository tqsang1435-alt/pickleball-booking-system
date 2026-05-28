"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";

import { googleLoginApi, loginApi } from "@/services/authApi";
import { saveAuth } from "@/utils/authStorage";
import { isValidEmail } from "@/utils/validators";

import styles from "./AuthPage.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      if (!isValidEmail(email)) {
        setError("Email không hợp lệ");
        return;
      }

      if (!password) {
        setError("Vui lòng nhập mật khẩu");
        return;
      }

      setLoading(true);

      const response: any = await loginApi({
        email,
        password,
      });

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
      setError(error instanceof Error ? error.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(credential?: string) {
    try {
      setError("");

      if (!credential) {
        setError("Không nhận được Google credential");
        return;
      }

      setLoading(true);

      const response: any = await googleLoginApi({
  credential,
});

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
        error instanceof Error ? error.message : "Đăng nhập Google thất bại"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.avatar}>👤</div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.inputGroup}>
          <span>👤</span>
          <input
            type="email"
            placeholder="Email"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <span>🔒</span>
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className={styles.options}>
          <label>
            <input type="checkbox" disabled={loading} />
            Remember me
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
          {loading ? "LOADING..." : "LOGIN"}
        </button>

        <div className={styles.googleDivider}>
          <span>Hoặc đăng nhập bằng</span>
        </div>

        <div className={styles.googleLogin}>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              handleGoogleLogin(credentialResponse.credential);
            }}
            onError={() => {
              setError("Đăng nhập Google thất bại");
            }}
          />
        </div>

        <p className={styles.register}>
          Chưa có tài khoản? <Link href="/register">Đăng ký</Link>
        </p>
      </form>
    </main>
  );
}