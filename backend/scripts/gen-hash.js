const bcrypt = require('bcryptjs');

async function main() {
  const [adminHash, staffHash, coachHash] = await Promise.all([
    bcrypt.hash('admin@123', 12),
    bcrypt.hash('staff@123', 12),
    bcrypt.hash('coach@123', 12),
  ]);

  console.log('-- =====================================================');
  console.log('-- UPDATE password theo từng role');
  console.log('-- =====================================================\n');

  console.log('-- Admin -> admin@123');
  console.log(`UPDATE Users SET PasswordHash = '${adminHash}'`);
  console.log(`WHERE UserID IN (`);
  console.log(`  SELECT DISTINCT ur.UserID FROM UserRoles ur`);
  console.log(`  INNER JOIN Roles r ON ur.RoleID = r.RoleID`);
  console.log(`  WHERE r.RoleName = 'Admin'`);
  console.log(`);\n`);

  console.log('-- Staff -> staff@123');
  console.log(`UPDATE Users SET PasswordHash = '${staffHash}'`);
  console.log(`WHERE UserID IN (`);
  console.log(`  SELECT DISTINCT ur.UserID FROM UserRoles ur`);
  console.log(`  INNER JOIN Roles r ON ur.RoleID = r.RoleID`);
  console.log(`  WHERE r.RoleName = 'Staff'`);
  console.log(`);\n`);

  console.log('-- Coach -> coach@123');
  console.log(`UPDATE Users SET PasswordHash = '${coachHash}'`);
  console.log(`WHERE UserID IN (`);
  console.log(`  SELECT DISTINCT ur.UserID FROM UserRoles ur`);
  console.log(`  INNER JOIN Roles r ON ur.RoleID = r.RoleID`);
  console.log(`  WHERE r.RoleName = 'Coach'`);
  console.log(`);`);
}

main();
