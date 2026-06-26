const sql = require("mssql");
require("dotenv").config();

async function check() {
  try {
    const pool = await sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      server: process.env.DB_SERVER || "localhost",
      options: { encrypt: false, trustServerCertificate: true },
    });
    
    const res = await pool.query(`
        SELECT u.UserID, u.FullName, u.Email, r.RoleName 
        FROM Users u
        INNER JOIN UserRoles ur ON u.UserID = ur.UserID
        INNER JOIN Roles r ON ur.RoleID = r.RoleID
    `);
    console.log(JSON.stringify(res.recordset, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
