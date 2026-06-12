// ==========================================
// gateways/payment-signature.util.ts
// Crypto helpers cho VNPay (HMAC-SHA512) và MoMo (HMAC-SHA256)
// ==========================================

import crypto from "crypto";

/**
 * Tạo HMAC-SHA512 cho VNPay (version 2.1.0).
 * Input: chuỗi data đã được sort và join theo chuẩn VNPay.
 * Secret: VNPAY_HASH_SECRET từ env.
 */
export function hmacSha512(secret: string, data: string): string {
  return crypto.createHmac("sha512", secret).update(data, "utf8").digest("hex");
}

/**
 * Tạo HMAC-SHA256 cho MoMo.
 * Input: rawSignature đã được ghép đúng thứ tự MoMo yêu cầu.
 * Secret: MOMO_SECRET_KEY từ env.
 */
export function hmacSha256(secret: string, data: string): string {
  return crypto.createHmac("sha256", secret).update(data, "utf8").digest("hex");
}

/**
 * Sort params theo thứ tự alphabet (chuẩn VNPay).
 * Loại bỏ các key rỗng.
 * Không include vnp_SecureHash và vnp_SecureHashType khi hash (theo spec).
 */
export function sortVnpParams(
  params: Record<string, string>
): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const key of Object.keys(params).sort()) {
    if (
      key !== "vnp_SecureHash" &&
      key !== "vnp_SecureHashType" &&
      params[key] !== "" &&
      params[key] !== undefined &&
      params[key] !== null
    ) {
      filtered[key] = params[key];
    }
  }
  return filtered;
}

/**
 * Convert sorted params object sang query string (không encode ký tự đặc biệt của VNPay).
 * VNPay yêu cầu encodeURIComponent cho values.
 */
export function buildVnpQueryString(
  sortedParams: Record<string, string>
): string {
  return Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
}

/**
 * Format Date thành yyyyMMddHHmmss cho VNPay.
 * VNPay dùng múi giờ Việt Nam (UTC+7).
 */
export function formatVnpDate(date: Date): string {
  // Convert to UTC+7
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = vnTime.getUTCFullYear();
  const month = pad(vnTime.getUTCMonth() + 1);
  const day = pad(vnTime.getUTCDate());
  const hour = pad(vnTime.getUTCHours());
  const min = pad(vnTime.getUTCMinutes());
  const sec = pad(vnTime.getUTCSeconds());

  return `${year}${month}${day}${hour}${min}${sec}`;
}
