"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { loginApi } from "@/services/authApi";
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

      const response = await loginApi({
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
      setError(
        error instanceof Error
          ? error.message
          : "Đăng nhập thất bại"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <form
        className={styles.card}
        onSubmit={handleSubmit}
      >
        <div className={styles.avatar}>
          👤
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.inputGroup}>
          <span>👤</span>

          <input
            type="email"
            placeholder="Username"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />
        </div>

        <div className={styles.inputGroup}>
          <span>🔒</span>

          <input
            type="password"
            placeholder="************"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />
        </div>

        <div className={styles.options}>
          <label>
            <input type="checkbox" />
            Remember me
          </label>

          <button
            type="button"
            className={styles.forgot}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          className={styles.loginBtn}
          disabled={loading}
        >
          {loading ? "LOADING..." : "LOGIN"}
        </button>

        <p className={styles.register}>
          Chưa có tài khoản?{" "}
          <Link href="/register">
            Đăng ký
          </Link>
        </p>
      </form>
    </main>
  );
}