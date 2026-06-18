const sql = require("mssql");
const path = require("path");
const dotenv = require("dotenv");

// Load .env
dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
  try {
    const pool = await sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      server: process.env.DB_SERVER || "localhost",
      options: { encrypt: false, trustServerCertificate: true },
    });

    console.log("🔄 Đang chuẩn bị dữ liệu test cho Booking 25...");

    // 1. Cập nhật trạng thái Booking 25 về 'PendingPayment'
    await pool.query(`
      UPDATE Bookings
      SET Status = 'PendingPayment',
          UpdatedAt = GETDATE()
      WHERE BookingID = 25
    `);
    console.log("✓ Đã chuyển Booking 25 thành 'PendingPayment'.");

    // 2. Gia hạn thời gian hết hạn của Payment 17 và đưa về 'Pending'
    const newExpiredAt = new Date(Date.now() + 60 * 60 * 1000); // +1 tiếng
    const formattedExpiredAt = newExpiredAt.toISOString().slice(0, 19).replace('T', ' ');

    await pool.request()
      .input("ExpiredAt", sql.DateTime, newExpiredAt)
      .query(`
        UPDATE Payments
        SET Status = 'Pending',
            ExpiredAt = @ExpiredAt,
            UpdatedAt = GETDATE()
        WHERE PaymentID = 17
      `);
    console.log(`✓ Đã cập nhật Payment 17 thành 'Pending', hết hạn lúc: ${formattedExpiredAt}.`);

    // 3. Hiển thị lại thông tin để kiểm tra
    const checkRes = await pool.query(`
      SELECT b.BookingID, b.Status as BookingStatus, p.PaymentID, p.Status as PaymentStatus, p.ExpiredAt
      FROM Bookings b
      JOIN Payments p ON b.BookingID = p.BookingID
      WHERE b.BookingID = 25 AND p.PaymentID = 17
    `);
    console.table(checkRes.recordset);

    process.exit(0);
  } catch (err) {
    console.error("Lỗi chuẩn bị data test:", err);
    process.exit(1);
  }
}

run();
