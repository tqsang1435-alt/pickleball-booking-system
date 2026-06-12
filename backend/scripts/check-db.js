const sql = require("mssql");
require("dotenv").config();

async function check() {
  const pool = await sql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER || "localhost",
    options: { encrypt: false, trustServerCertificate: true },
  });
  
  const res = await pool.query(`
      SELECT TOP (50)
        NotificationID as notificationId,
        Title as title,
        Message as message,
        NotificationType as notificationType,
        Status as status,
        CONVERT(varchar(19), CreatedAt, 126) as createdAt
      FROM Notifications
  `);
  console.log(res.recordset[0]);
  process.exit(0);
}

check();
