"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSendOtp() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage("OTP đã được gửi về Gmail");
      setStep(2);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Gửi OTP thất bại"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage("Đổi mật khẩu thành công");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Đổi mật khẩu thất bại"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff5f8",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          padding: 32,
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Quên mật khẩu
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: 24,
          }}
        >
          Nhập email để nhận OTP đổi mật khẩu
        </p>

        {message && (
          <div
            style={{
              background: "#e8fff0",
              color: "#0a7a38",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#ffe8e8",
              color: "#d00000",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Nhập email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Nhập OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              style={inputStyle}
            />
          </>
        )}

        {step === 1 ? (
          <button
            onClick={handleSendOtp}
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? "ĐANG GỬI..." : "Gửi OTP"}
          </button>
        ) : (
          <button
            onClick={handleResetPassword}
            disabled={loading}
            style={buttonStyle}
          >
            {loading
              ? "ĐANG XỬ LÝ..."
              : "Đổi mật khẩu"}
          </button>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  marginBottom: 16,
  outline: "none",
  fontSize: 15,
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  border: "none",
  borderRadius: 10,
  background: "#ff4f87",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 15,
};