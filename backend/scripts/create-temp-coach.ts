import { getPool, sql } from "../src/database/connection";
import bcrypt from "bcryptjs";

async function createTempCoach() {
  try {
    const pool = await getPool();
    const email = "temp.coach@gmail.com";
    const password = "Password@123";
    const phone = "0999999999";
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if exists
    const checkUser = await pool.request()
      .input("Email", sql.NVarChar, email)
      .query(`SELECT UserID FROM Users WHERE Email = @Email`);
      
    let userId;
    
    if (checkUser.recordset.length > 0) {
      userId = checkUser.recordset[0].UserID;
      console.log(`User already exists with ID: ${userId}`);
    } else {
      // Insert User
      const userResult = await pool.request()
        .input("FullName", sql.NVarChar, "Temporary Coach")
        .input("Email", sql.NVarChar, email)
        .input("PhoneNumber", sql.VarChar, phone)
        .input("PasswordHash", sql.NVarChar, passwordHash)
        .input("AvatarURL", sql.NVarChar, "/images/users/default-avatar.jpg")
        .input("Gender", sql.NVarChar, "Male")
        .input("DateOfBirth", sql.Date, new Date("1990-01-01"))
        .input("Address", sql.NVarChar, "Temp Address")
        .input("Status", sql.NVarChar, "Active")
        .query(`
          INSERT INTO Users (FullName, Email, PhoneNumber, PasswordHash, AvatarURL, Gender, DateOfBirth, Address, Status)
          OUTPUT INSERTED.UserID
          VALUES (@FullName, @Email, @PhoneNumber, @PasswordHash, @AvatarURL, @Gender, @DateOfBirth, @Address, @Status)
        `);
      
      userId = userResult.recordset[0].UserID;
      console.log(`Created user with ID: ${userId}`);

      // Insert UserRole (Role 4 is Coach)
      await pool.request()
        .input("UserID", sql.Int, userId)
        .input("RoleID", sql.Int, 4)
        .query(`INSERT INTO UserRoles (UserID, RoleID) VALUES (@UserID, @RoleID)`);
      console.log(`Assigned Coach role`);

      // Insert Coach
      await pool.request()
        .input("UserID", sql.Int, userId)
        .input("ExperienceYears", sql.Int, 5)
        .input("SkillLevel", sql.NVarChar, "Advanced")
        .input("Specialization", sql.NVarChar, "Temporary Coach")
        .input("Certifications", sql.NVarChar, "None")
        .input("HourlyRate", sql.Decimal(18, 2), 200000)
        .input("Biography", sql.NVarChar, "Temp coach account")
        .input("AverageRating", sql.Decimal(3, 2), 5.0)
        .input("TotalStudents", sql.Int, 0)
        .input("Status", sql.NVarChar, "Approved")
        .query(`
          INSERT INTO Coaches (UserID, ExperienceYears, SkillLevel, Specialization, Certifications, HourlyRate, Biography, AverageRating, TotalStudents, Status)
          VALUES (@UserID, @ExperienceYears, @SkillLevel, @Specialization, @Certifications, @HourlyRate, @Biography, @AverageRating, @TotalStudents, @Status)
        `);
      console.log(`Created coach profile`);
    }

    console.log("-----------------------------------------");
    console.log("Account created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("-----------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Error creating temp coach:", error);
    process.exit(1);
  }
}

createTempCoach();
