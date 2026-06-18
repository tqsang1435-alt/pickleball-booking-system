const sql = require('mssql');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_DATABASE || 'PCS_SYSTEM_5',
  server: process.env.DB_SERVER || 'localhost',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const newUsers = [
  { name: 'Phan Văn Trí', email: 'tri.phan@gmail.com', phone: '0911000001', pass: 'tri@123', gender: 'Male', dob: '1995-04-12', addr: '123 Hùng Vương, Đà Nẵng' },
  { name: 'Nguyễn Thị Mai', email: 'mai.nguyen@gmail.com', phone: '0911000002', pass: 'mai@123', gender: 'Female', dob: '1998-08-20', addr: '45 Lê Lợi, Đà Nẵng' },
  { name: 'Trần Hoàng Nam', email: 'nam.tran@gmail.com', phone: '0911000003', pass: 'nam@123', gender: 'Male', dob: '1994-11-05', addr: '78 Nguyễn Văn Linh, Đà Nẵng' },
  { name: 'Lê Thu Hương', email: 'huong.le@gmail.com', phone: '0911000004', pass: 'huong@123', gender: 'Female', dob: '1999-02-15', addr: '101 Điện Biên Phủ, Đà Nẵng' },
  { name: 'Vũ Minh Đức', email: 'duc.vu@gmail.com', phone: '0911000005', pass: 'duc@123', gender: 'Male', dob: '1997-06-30', addr: '56 Trần Phú, Đà Nẵng' }
];

async function main() {
  try {
    await sql.connect(config);
    console.log('Connected to database!');

    // Get Player Role ID
    const roleRes = await sql.query("SELECT RoleID FROM Roles WHERE RoleName = 'Player'");
    const playerRoleId = roleRes.recordset[0]?.RoleID || 4;

    console.log(`Using Player RoleID: ${playerRoleId}`);

    for (const user of newUsers) {
      console.log(`\nProcessing: ${user.name} (${user.email})...`);

      // Check if user already exists
      const checkRes = await sql.query(`SELECT UserID FROM Users WHERE Email = '${user.email}'`);
      if (checkRes.recordset.length > 0) {
        console.log(`ℹ User already exists with ID: ${checkRes.recordset[0].UserID}`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(user.pass, 10);

      // Insert User
      const insertRes = await sql.query(`
        INSERT INTO Users (FullName, Email, PhoneNumber, PasswordHash, Gender, DateOfBirth, Address, Status, CreatedAt)
        OUTPUT INSERTED.UserID
        VALUES (
          N'${user.name}', 
          '${user.email}', 
          '${user.phone}', 
          '${passwordHash}', 
          '${user.gender}', 
          '${user.dob}', 
          N'${user.addr}', 
          'Active', 
          GETDATE()
        )
      `);

      const newUserId = insertRes.recordset[0].UserID;

      // Assign Player Role
      await sql.query(`
        INSERT INTO UserRoles (UserID, RoleID, CreatedAt)
        VALUES (${newUserId}, ${playerRoleId}, GETDATE())
      `);

      console.log(`✓ Created user successfully (ID: ${newUserId}, Password: ${user.pass})`);
    }

    console.log('\nAll done!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sql.close();
  }
}

main();
