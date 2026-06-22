const sql = require("mssql");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

function removeAccents(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

function getCoachPassword(fullName) {
  const cleanName = removeAccents(fullName)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // keeps only alpha-numeric characters and removes spaces, accents, symbols
  return `${cleanName}@12345`;
}

async function run() {
  try {
    const config = {
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "123456",
      database: process.env.DB_DATABASE || "PCS_SYSTEM_5",
      server: process.env.DB_SERVER || "localhost",
      options: { encrypt: false, trustServerCertificate: true },
    };

    console.log("Connecting to database with:", {
      user: config.user,
      database: config.database,
      server: config.server
    });

    const pool = await sql.connect(config);

    // Query distinct coach users
    const query = `
      SELECT DISTINCT u.UserID, u.FullName, u.Email
      FROM Users u
      INNER JOIN UserRoles ur ON u.UserID = ur.UserID
      INNER JOIN Roles r ON ur.RoleID = r.RoleID
      WHERE r.RoleName = 'Coach'
    `;

    const res = await pool.query(query);
    const coaches = res.recordset;

    console.log(`Found ${coaches.length} coaches.`);

    const sqlLines = [];
    sqlLines.push("-- ==========================================================================");
    sqlLines.push("-- SQL SCRIPT TO UPDATE COACH PASSWORDS TO FORMAT: tên_coach@12345");
    sqlLines.push("-- Generated dynamically by gen_coach_update_sql.js");
    sqlLines.push("-- ==========================================================================\n");

    for (const coach of coaches) {
      const password = getCoachPassword(coach.FullName);
      const hash = await bcrypt.hash(password, 10);
      
      sqlLines.push(`-- Coach: ${coach.FullName} (${coach.Email})`);
      sqlLines.push(`-- Plain password: ${password}`);
      sqlLines.push(`UPDATE Users SET PasswordHash = '${hash}' WHERE UserID = ${coach.UserID};\n`);
    }

    const outputSql = sqlLines.join("\n");
    const outputPath = path.join(__dirname, "update_coach_passwords.sql");
    fs.writeFileSync(outputPath, outputSql, "utf8");

    console.log("\n--- Generated SQL Script ---");
    console.log(outputSql);
    console.log("----------------------------");
    console.log(`SQL script saved to: ${outputPath}`);

    process.exit(0);
  } catch (err) {
    console.error("Error generating SQL:", err);
    process.exit(1);
  }
}

run();
