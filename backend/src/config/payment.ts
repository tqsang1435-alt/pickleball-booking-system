import "dotenv/config";

export const paymentConfig = {
  // ── PayOS ────────────────────────────────────
  payos: {
    clientId: process.env.PAYOS_CLIENT_ID || "",
    apiKey: process.env.PAYOS_API_KEY || "",
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || "",
    returnUrl: process.env.PAYOS_RETURN_URL || "http://localhost:5000/api/payments/payos-return",
    cancelUrl: process.env.PAYOS_CANCEL_URL || "http://localhost:5000/api/payments/payos-cancel",
    webhookUrl: process.env.PAYOS_WEBHOOK_URL || "",
  },

  // ── MoMo ─────────────────────────────────────
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || "",
    accessKey: process.env.MOMO_ACCESS_KEY || "",
    secretKey: process.env.MOMO_SECRET_KEY || "",
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
    returnUrl: process.env.MOMO_RETURN_URL || "http://localhost:5000/api/payments/momo-return",
    redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:5000/api/payments/momo-return",
    ipnUrl: process.env.MOMO_IPN_URL || "", // Note: local test needs ngrok
    requestType: process.env.MOMO_REQUEST_TYPE || "captureWallet",
  },

  // ── App ───────────────────────────────────────────
  app: {
    baseUrl: process.env.APP_BASE_URL || "http://localhost:5000",
    frontendSuccessUrl: process.env.FRONTEND_PAYMENT_SUCCESS_URL || "http://localhost:3000/payment/success",
    frontendFailedUrl: process.env.FRONTEND_PAYMENT_FAILED_URL || "http://localhost:3000/payment/failed",
    frontendStatusUrl: process.env.FRONTEND_PAYMENT_STATUS_URL || "http://localhost:3000/payment/status",
  },
};
