/**
 * Script tạo PayOS Webhook payload hợp lệ để test bằng Postman hoặc curl.
 * Nó sử dụng PAYOS_CHECKSUM_KEY từ backend/.env.local để tạo chữ ký (signature) hợp lệ.
 * 
 * Cách dùng:
 *   node scripts/generate-payos-webhook.js <paymentId_or_orderCode> <amount> <bookingId>
 * 
 * Ví dụ:
 *   node scripts/generate-payos-webhook.js 15 120000 40
 */

const path = require("path");
const crypto = require("crypto");
const dotenv = require("dotenv");

// 1. Tải cấu hình từ .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;
if (!CHECKSUM_KEY) {
  console.error("❌ Không tìm thấy PAYOS_CHECKSUM_KEY trong file .env.local!");
  process.exit(1);
}

// 2. Lấy tham số dòng lệnh
const orderCode = parseInt(process.argv[2] || "15", 10);
const amount = parseInt(process.argv[3] || "120000", 10);
const bookingId = parseInt(process.argv[4] || "40", 10);

if (isNaN(orderCode) || isNaN(amount) || isNaN(bookingId)) {
  console.error("❌ Tham số đầu vào không hợp lệ. Vui lòng kiểm tra lại!");
  console.log("Cách dùng: node scripts/generate-payos-webhook.js <orderCode> <amount> <bookingId>");
  process.exit(1);
}

// 3. Chuẩn bị đối tượng data
const data = {
  orderCode,
  amount,
  description: `DH${bookingId}`,
  accountNumber: "0000",
  reference: `PAYOS${Date.now()}`,
  transactionDateTime: new Date().toISOString().replace("T", " ").substring(0, 19),
  currency: "VND",
  paymentLinkId: `LNK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
  code: "00", // 00 đại diện cho thanh toán thành công
  desc: "success",
};

// 4. Sắp xếp các trường theo bảng chữ cái và tạo query string giống SDK
const sortedKeys = Object.keys(data).sort();
const queryString = sortedKeys
  .map((key) => {
    let value = data[key];
    if (value === null || value === undefined || value === "undefined" || value === "null") {
      value = "";
    }
    return `${key}=${value}`;
  })
  .join("&");

// 5. Tạo chữ ký bằng HMAC-SHA256
const signature = crypto
  .createHmac("sha256", CHECKSUM_KEY)
  .update(queryString)
  .digest("hex");

// 6. Tạo payload hoàn chỉnh cho webhook
const webhookPayload = {
  code: "00",
  desc: "success",
  data,
  signature,
};

console.log("\n==================================================");
console.log("✅ PAYOS WEBHOOK PAYLOAD (Chữ ký hợp lệ):");
console.log("==================================================");
console.log(JSON.stringify(webhookPayload, null, 2));
console.log("==================================================");
console.log("\n📋 Cách thực hiện kiểm tra qua terminal (curl):");
console.log(`  curl -X POST http://localhost:5000/api/payments/payos-webhook \\`);
console.log(`    -H "Content-Type: application/json" \\`);
console.log(`    -d '${JSON.stringify(webhookPayload)}'`);
console.log("\n📋 Hoặc kiểm tra qua ngrok public URL:");
console.log(`  curl -X POST https://kangaroo-series-bunion.ngrok-free.dev/api/payments/payos-webhook \\`);
console.log(`    -H "Content-Type: application/json" \\`);
console.log(`    -d '${JSON.stringify(webhookPayload)}'\n`);
