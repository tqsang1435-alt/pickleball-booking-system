/**
 * Script tạo MoMo IPN payload hợp lệ để test bằng Postman
 * 
 * Cách dùng:
 *   node scripts/generate-momo-webhook.js <orderId> <requestId> <amount> <bookingId>
 * 
 * Ví dụ:
 *   node scripts/generate-momo-webhook.js PAY-40-20260611235508-C76NUR PAY-40-20260611235508-C76NUR-1781196908297 100000 40
 */

const crypto = require("crypto");

// ── Lấy từ .env ──────────────────────────────────────────
const ACCESS_KEY  = "klm05TvNBzhg7h7j";
const SECRET_KEY  = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
const PARTNER_CODE = "MOMOBKUN20180529";

// ── Lấy từ args hoặc điền tay ────────────────────────────
const orderId     = process.argv[2] || "PAY-40-20260611235508-C76NUR";
const requestId   = process.argv[3] || "PAY-40-20260611235508-C76NUR-1781196908297";
const amount      = parseInt(process.argv[4] || "100000");
const bookingId   = parseInt(process.argv[5] || "40");

// ── Các field cố định (giả lập MoMo trả về) ──────────────
const orderInfo   = `Thanh toan booking ${bookingId}`;
const orderType   = "momo_wallet";
const transId     = Math.floor(Date.now() / 1000); // Fake transId
const resultCode  = 0; // 0 = thành công
const message     = "Successful.";
const payType     = "qr";
const responseTime = Date.now();
const extraData   = Buffer.from(JSON.stringify({ bookingId })).toString("base64");

// ── Tạo signature (theo rawSignature format của verifyMomoIpn) ──
const rawSignature = [
  `accessKey=${ACCESS_KEY}`,
  `amount=${amount}`,
  `extraData=${extraData}`,
  `message=${message}`,
  `orderId=${orderId}`,
  `orderInfo=${orderInfo}`,
  `orderType=${orderType}`,
  `partnerCode=${PARTNER_CODE}`,
  `payType=${payType}`,
  `requestId=${requestId}`,
  `responseTime=${responseTime}`,
  `resultCode=${resultCode}`,
  `transId=${transId}`,
].join("&");

const signature = crypto
  .createHmac("sha256", SECRET_KEY)
  .update(rawSignature)
  .digest("hex");

// ── Output ────────────────────────────────────────────────
const payload = {
  partnerCode: PARTNER_CODE,
  orderId,
  requestId,
  amount,
  orderInfo,
  orderType,
  transId,
  resultCode,
  message,
  payType,
  responseTime,
  extraData,
  signature,
};

console.log("\n✅ MoMo IPN Payload (copy vào Postman body):\n");
console.log(JSON.stringify(payload, null, 2));
console.log("\n📋 Postman config:");
console.log("  Method : POST");
console.log("  URL    : https://levitate-process-accustom.ngrok-free.dev/api/payments/momo-ipn");
console.log("  Headers: Content-Type: application/json");
console.log("  Body   : raw > JSON (payload bên trên)\n");
