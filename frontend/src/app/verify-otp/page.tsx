"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { verifyRegisterOtpApi } from "@/services/authApi";

import { Suspense } from "react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);

      await verifyRegisterOtpApi({
        email,
        otp,
      });

      alert("Xác thực email thành công");
      router.push("/login");
    } catch (error) {
      alert("OTP không đúng hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1>Xác thực email</h1>

      <p>
        Mã OTP đã được gửi đến: <b>{email}</b>
      </p>

      <form onSubmit={handleVerify}>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Nhập mã OTP"
          maxLength={6}
          required
          style={{
            width: "100%",
            padding: 14,
            margin: "20px 0",
          }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Đang xác thực..." : "Xác thực"}
        </button>
      </form>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>Đang tải...</main>}>
      <VerifyOtpContent />
    </Suspense>
  );
}