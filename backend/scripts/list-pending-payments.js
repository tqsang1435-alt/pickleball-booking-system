const sql = require("mssql");
const path = require("path");
const dotenv = require("dotenv");

// Load .env
dotenv.config({ path: path.join(__dirname, "../.env") });

async function query() {
  try {
    const pool = await sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      server: process.env.DB_SERVER || "localhost",
      options: { encrypt: false, trustServerCertificate: true },
    });
    
    console.log("=== 10 BOOKINGS GẦN NHẤT ===");
    const bookingsRes = await pool.query(`
      SELECT TOP (10)
        BookingID, BookingCode, BookingType, TotalAmount, Status,
        CONVERT(varchar(19), CreatedAt, 126) as CreatedAt
      FROM Bookings
      ORDER BY BookingID DESC
    `);
    console.table(bookingsRes.recordset);

    console.log("\n=== 10 PAYMENTS GẦN NHẤT ===");
    const paymentsRes = await pool.query(`
      SELECT TOP (10)
        PaymentID, BookingID, PaymentCode, PaymentMethod, Amount, Status, GatewayOrderId,
        CONVERT(varchar(19), ExpiredAt, 126) as ExpiredAt
      FROM Payments
      ORDER BY PaymentID DESC
    `);
    console.table(paymentsRes.recordset);

    process.exit(0);
  } catch (err) {
    console.error("Lỗi truy vấn:", err);
    process.exit(1);
  }
}

query();
