-- ==========================================================================
-- SQL SCRIPT TO UPDATE COACH PASSWORDS TO FORMAT: tên_coach@12345
-- Generated dynamically by gen_coach_update_sql.js
-- ==========================================================================

-- Coach: Le Quoc Huy (le.quochuy@gmail.com)
-- Plain password: lequochuy@12345
UPDATE Users SET PasswordHash = '$2b$10$aLw9gM4zFKNqtdtT.dTuHuoroo2tj.JA38BoTGIPG7uJrmfdt3nNm' WHERE UserID = 3;

-- Coach: Dang My Tien (dang.mytien@gmail.com)
-- Plain password: dangmytien@12345
UPDATE Users SET PasswordHash = '$2b$10$3eovXImqQHxmDfct571UNupPZBHx5TO5zbveelsfAvzMBo9ZsTE0K' WHERE UserID = 8;

-- Coach: Nguyen Minh Khoa (minhkhoa.coach@gmail.com)
-- Plain password: nguyenminhkhoa@12345
UPDATE Users SET PasswordHash = '$2b$10$es1ItOSQbTImdVmkFxqSHegyjnxw29KwICZTB52fcHR45Huft2PYK' WHERE UserID = 14;

-- Coach: Quynh Anh (quynhanh.coach@gmail.com)
-- Plain password: quynhanh@12345
UPDATE Users SET PasswordHash = '$2b$10$Q9NOspi3c4CT/SSInm/fYeGRIS0y8f8KpTGSvOj/8JYnWPnsj7OSG' WHERE UserID = 15;

-- Coach: Hoang Long (hoanglong.coach@gmail.com)
-- Plain password: hoanglong@12345
UPDATE Users SET PasswordHash = '$2b$10$osXtqegivq2lyHas/IjrG.suqRCE7JoMH9QHFsU5/OBkFm9KuGTle' WHERE UserID = 16;

-- Coach: Tran Bao Tram (baotram.coach@gmail.com)
-- Plain password: tranbaotram@12345
UPDATE Users SET PasswordHash = '$2b$10$.U/qxgvPDWg3riZyb9oSZ.Q8OBNhLRLcz50wyhImtKY4nDHrORq02' WHERE UserID = 17;
