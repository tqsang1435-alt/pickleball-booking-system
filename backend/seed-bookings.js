const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
};

async function seed() {
  const pool = await sql.connect(config);
  console.log("✅ Connected");

  // Lấy UserID và CourtID từ DB
  const users = await pool.request().query("SELECT TOP 5 UserID FROM Users");
  const courts = await pool.request().query("SELECT TOP 5 CourtID FROM Courts");

  if (users.recordset.length === 0 || courts.recordset.length === 0) {
    console.log("❌ Cần có Users và Courts trước");
    await pool.close(); return;
  }

  const userId = users.recordset[0].UserID;
  const courtId = courts.recordset[0].CourtID;
  const today = new Date();

  // Tạo 15 booking trong 30 ngày gần đây
  let count = 0;
  for (let i = 0; i < 15; i++) {
    const bookingDate = new Date(today);
    bookingDate.setDate(today.getDate() - Math.floor(Math.random() * 30));
    const dateStr = bookingDate.toISOString().split("T")[0];

    const statuses = ["Confirmed", "Completed", "CheckedIn", "Cancelled"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const totalAmount = Math.floor(Math.random() * 300000) + 100000;
    const code = `BK${Date.now()}${i}`;

    try {
      const bookingResult = await pool.request()
        .input("Code", sql.NVarChar(50), code)
        .input("UserID", sql.Int, userId)
        .input("Type", sql.NVarChar(30), "Court")
        .input("Date", sql.Date, dateStr)
        .input("CourtFee", sql.Decimal(18,2), totalAmount)
        .input("Total", sql.Decimal(18,2), totalAmount)
        .input("Status", sql.NVarChar(30), status)
        .query(`
          INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, CoachFee, DiscountAmount, TotalAmount, Status)
          VALUES (@Code, @UserID, @Type, @Date, @CourtFee, 0, 0, @Total, @Status);
          SELECT SCOPE_IDENTITY() AS BookingID;
        `);

      const bookingId = bookingResult.recordset[0].BookingID;

      // Tạo BookingDetail
      const startHour = 7 + Math.floor(Math.random() * 10);
      const startTimeStr = `${String(startHour).padStart(2, "0")}:00:00`;
      const endTimeStr   = `${String(startHour + 1).padStart(2, "0")}:00:00`;

      await pool.request()
        .input("BookingID", sql.Int, bookingId)
        .input("CourtID", sql.Int, courtId)
        .input("BookDate", sql.Date, dateStr)
        .input("StartTime", sql.VarChar(8), startTimeStr)
        .input("EndTime", sql.VarChar(8), endTimeStr)
        .input("CourtFee", sql.Decimal(18,2), totalAmount)
        .input("SubTotal", sql.Decimal(18,2), totalAmount)
        .query(`
          INSERT INTO BookingDetails (BookingID, CourtID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal)
          VALUES (@BookingID, @CourtID, @BookDate, @StartTime, @EndTime, @CourtFee, 0, @SubTotal);
        `);

      count++;
    } catch (e) {
      console.log(`  Skip booking ${i}: ${e.message}`);
    }
  }

  console.log(`✅ Đã tạo ${count}/15 booking mẫu`);
  await pool.close();
}

seed().catch(console.error);
