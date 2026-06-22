const sql = require("mssql");
require("dotenv").config();

async function run() {
  try {
    const config = {
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "123456",
      database: process.env.DB_DATABASE || "PCS_SYSTEM_5",
      server: process.env.DB_SERVER || "localhost",
      options: { encrypt: false, trustServerCertificate: true },
    };

    const pool = await sql.connect(config);

    console.log("--- QUERY FROM USERROLES (r.RoleName = 'Coach') ---");
    const resRoles = await pool.query(`
      SELECT u.UserID, u.FullName, u.Email, r.RoleName
      FROM Users u
      INNER JOIN UserRoles ur ON u.UserID = ur.UserID
      INNER JOIN Roles r ON ur.RoleID = r.RoleID
      WHERE r.RoleName = 'Coach'
    `);
    console.log(resRoles.recordset);

    console.log("\n--- QUERY FROM COACHES TABLE ---");
    const resCoaches = await pool.query(`
      SELECT c.CoachID, c.UserID, u.FullName, u.Email
      FROM Coaches c
      INNER JOIN Users u ON c.UserID = u.UserID
    `);
    console.log(resCoaches.recordset);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
