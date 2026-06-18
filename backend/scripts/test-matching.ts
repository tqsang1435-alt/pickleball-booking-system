import { 
  calculateRoleScore, 
  calculateSkillScore, 
  calculateExperienceScore, 
  calculateScheduleScore,
  findSuitableTeammates
} from "../src/modules/player-matching/player-matching.service";
import { getPool } from "@/database/connection";

interface TestCase {
  name: string;
  run: () => void;
}

const suites: { name: string; cases: TestCase[] }[] = [];

function describe(suiteName: string, tests: TestCase[]) {
  suites.push({ name: suiteName, cases: tests });
}

function assertEquals(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: Expected ${expected}, but got ${actual}. ${message || ""}`);
  }
}

// ── 1. SUITE: ROLE MATCHING SCORE ────────────────────────────
describe("1. Role Matching Score Formula", [
  {
    name: "Attacker + Defender should score 100",
    run: () => {
      assertEquals(calculateRoleScore("Attacker", "Defender"), 100);
      assertEquals(calculateRoleScore("Defender", "Attacker"), 100);
    }
  },
  {
    name: "All-rounder with any role should score 75",
    run: () => {
      assertEquals(calculateRoleScore("All-rounder", "Attacker"), 75);
      assertEquals(calculateRoleScore("Defender", "All-rounder"), 75);
      assertEquals(calculateRoleScore("All-rounder", "Defender"), 75);
      assertEquals(calculateRoleScore("All-rounder", "All-rounder"), 75);
    }
  },
  {
    name: "Same roles (not All-rounder) should score 30",
    run: () => {
      assertEquals(calculateRoleScore("Attacker", "Attacker"), 30);
      assertEquals(calculateRoleScore("Defender", "Defender"), 30);
    }
  },
  {
    name: "Empty or invalid roles should score 0",
    run: () => {
      assertEquals(calculateRoleScore("Attacker", ""), 0);
      assertEquals(calculateRoleScore("", "Defender"), 0);
      assertEquals(calculateRoleScore("Unknown", "Attacker"), 0);
    }
  }
]);

// ── 2. SUITE: SKILL MATCHING SCORE ───────────────────────────
describe("2. Skill Matching Score Formula", [
  {
    name: "Same skills should score 100",
    run: () => {
      assertEquals(calculateSkillScore("Beginner", "Beginner"), 100);
      assertEquals(calculateSkillScore("Intermediate", "Intermediate"), 100);
      assertEquals(calculateSkillScore("Advanced", "Advanced"), 100);
      assertEquals(calculateSkillScore("Professional", "Professional"), 100);
    }
  },
  {
    name: "Skill gap of 1 level should score 75",
    run: () => {
      assertEquals(calculateSkillScore("Beginner", "Intermediate"), 75);
      assertEquals(calculateSkillScore("Intermediate", "Advanced"), 75);
      assertEquals(calculateSkillScore("Advanced", "Professional"), 75);
    }
  },
  {
    name: "Skill gap of 2 levels should score 50",
    run: () => {
      assertEquals(calculateSkillScore("Beginner", "Advanced"), 50);
      assertEquals(calculateSkillScore("Intermediate", "Professional"), 50);
    }
  },
  {
    name: "Skill gap of 3 levels should score 25",
    run: () => {
      assertEquals(calculateSkillScore("Beginner", "Professional"), 25);
    }
  }
]);

// ── 3. SUITE: EXPERIENCE MATCHING SCORE ──────────────────────
describe("3. Experience Matching Score Formula", [
  {
    name: "Equal experience years should score 100",
    run: () => {
      assertEquals(calculateExperienceScore(5, 5), 100);
    }
  },
  {
    name: "1 year difference should score 90",
    run: () => {
      assertEquals(calculateExperienceScore(3, 4), 90);
      assertEquals(calculateExperienceScore(5, 4), 90);
    }
  },
  {
    name: "5 years difference should score 50",
    run: () => {
      assertEquals(calculateExperienceScore(2, 7), 50);
    }
  },
  {
    name: "10+ years difference should score 0",
    run: () => {
      assertEquals(calculateExperienceScore(1, 11), 0);
      assertEquals(calculateExperienceScore(2, 15), 0);
    }
  }
]);

// ── 4. SUITE: SCHEDULE MATCHING SCORE ────────────────────────
describe("4. Schedule Matching Score Formula", [
  {
    name: "Schedule overlap >= 90 mins should score 100",
    run: () => {
      assertEquals(calculateScheduleScore("08:00", "10:00", "08:30", "10:30"), 100);
      assertEquals(calculateScheduleScore("08:00", "10:00", "08:00", "10:00"), 100);
    }
  },
  {
    name: "Schedule overlap between 60 and 89 mins should score 70",
    run: () => {
      assertEquals(calculateScheduleScore("08:00", "10:00", "09:00", "11:00"), 70);
      assertEquals(calculateScheduleScore("08:00", "10:00", "07:00", "09:15"), 70);
    }
  },
  {
    name: "Schedule overlap < 60 mins should score 0",
    run: () => {
      assertEquals(calculateScheduleScore("08:00", "10:00", "09:15", "11:00"), 0);
      assertEquals(calculateScheduleScore("08:00", "10:00", "10:00", "12:00"), 0);
    }
  },
  {
    name: "Invalid or empty schedule should score 0",
    run: () => {
      assertEquals(calculateScheduleScore(null, "10:00", "08:00", "10:00"), 0);
      assertEquals(calculateScheduleScore("08:00", "", "08:00", "10:00"), 0);
    }
  }
]);

// ── 5. INTEGRATION TESTS (WITH DATABASE) ────────────────────
async function runIntegrationTests() {
  console.log("\n==================================================");
  console.log("    RUNNING MATCHING ENGINE INTEGRATION TESTS      ");
  console.log("==================================================");

  let pool;
  try {
    pool = await getPool();
  } catch (err: any) {
    console.warn("\x1b[33mWarning: Không thể kết nối cơ sở dữ liệu để chạy Integration Tests.\x1b[0m");
    console.warn(err.message);
    return;
  }

  const testEmails = ["test.matching.user1@example.com", "test.matching.user2@example.com"];

  try {
    // Clean up
    await pool.query(`
      DELETE FROM PlayerMatches WHERE Player1ID IN (SELECT UserID FROM Users WHERE Email IN ('${testEmails.join("','")}')) 
         OR Player2ID IN (SELECT UserID FROM Users WHERE Email IN ('${testEmails.join("','")}'))
    `);
    await pool.query(`DELETE FROM PlayerProfiles WHERE UserID IN (SELECT UserID FROM Users WHERE Email IN ('${testEmails.join("','")}'))`);
    await pool.query(`DELETE FROM Users WHERE Email IN ('${testEmails.join("','")}')`);

    // Create Test User 1 (Attacker)
    const user1Res = await pool.query(`
      INSERT INTO Users (FullName, Email, PasswordHash, Gender, Status, PhoneNumber) 
      OUTPUT inserted.UserID
      VALUES (N'Test Player Attacker', 'test.matching.user1@example.com', 'hashedpassword', 'Male', 'Active', '0999999991')
    `);
    const user1Id = user1Res.recordset[0].UserID;

    // Create Test User 2 (Defender)
    const user2Res = await pool.query(`
      INSERT INTO Users (FullName, Email, PasswordHash, Gender, Status, PhoneNumber) 
      OUTPUT inserted.UserID
      VALUES (N'Test Player Defender', 'test.matching.user2@example.com', 'hashedpassword', 'Female', 'Active', '0999999992')
    `);
    const user2Id = user2Res.recordset[0].UserID;

    // Insert Player Profile 1
    await pool.query(`
      INSERT INTO PlayerProfiles (UserID, PlayingRole, ExperienceYears, SkillLevel, MatchingStatus, AvailableStartTime, AvailableEndTime)
      VALUES (${user1Id}, 'Attacker', 3, 'Intermediate', 'Available', CAST('08:00:00' AS TIME), CAST('10:00:00' AS TIME))
    `);

    // Insert Player Profile 2
    await pool.query(`
      INSERT INTO PlayerProfiles (UserID, PlayingRole, ExperienceYears, SkillLevel, MatchingStatus, AvailableStartTime, AvailableEndTime)
      VALUES (${user2Id}, 'Defender', 5, 'Advanced', 'Available', CAST('08:30:00' AS TIME), CAST('10:30:00' AS TIME))
    `);

    console.log("  \x1b[32m✓\x1b[0m Đã tạo dữ liệu người chơi thử nghiệm.");

    // Run matching logic
    const matches = await findSuitableTeammates(user1Id);
    
    // Find candidate User 2 in matches
    const recommendedUser2 = matches.find((m: any) => m.profile.UserID === user2Id);
    
    if (!recommendedUser2) {
      throw new Error("Không tìm thấy người chơi thứ 2 trong danh sách đề xuất!");
    }

    console.log("  \x1b[32m✓\x1b[0m Tìm thấy người chơi phù hợp trong kết quả đề xuất.");

    // Assert matching scores
    assertEquals(recommendedUser2.scores.roleScore, 100, "Role score should be 100");
    assertEquals(recommendedUser2.scores.skillScore, 75, "Skill score should be 75");
    assertEquals(recommendedUser2.scores.experienceScore, 80, "Experience score should be 80");
    assertEquals(recommendedUser2.scores.scheduleScore, 100, "Schedule score should be 100");
    
    // Weighted math: 100 * 0.4 + 75 * 0.25 + 80 * 0.2 + 100 * 0.15 = 40 + 18.75 + 16 + 15 = 89.75 -> rounded to 89.8
    assertEquals(recommendedUser2.matchingScore, 89.8, "Overall match score should be 89.8");

    console.log("  \x1b[32m✓\x1b[0m Tất cả điểm số chính xác tuyệt đối!");

  } catch (err: any) {
    console.error("  \x1b[31m✗ Lỗi chạy Integration Test:\x1b[0m");
    console.error(err);
    throw err;
  } finally {
    console.log("  Cleaning up test database records...");
    await pool.query(`
      DELETE FROM PlayerMatches WHERE Player1ID IN (SELECT UserID FROM Users WHERE Email IN ('${testEmails.join("','")}')) 
         OR Player2ID IN (SELECT UserID FROM Users WHERE Email IN ('${testEmails.join("','")}'))
    `).catch(() => {});
    await pool.query(`DELETE FROM PlayerProfiles WHERE UserID IN (SELECT UserID FROM Users WHERE Email IN ('${testEmails.join("','")}'))`).catch(() => {});
    await pool.query(`DELETE FROM Users WHERE Email IN ('${testEmails.join("','")}')`).catch(() => {});
    console.log("  Cleanup complete.");
  }
}

// ── RUNNER ───────────────────────────────────────────────────
async function main() {
  console.log("==================================================");
  console.log("    RUNNING MATCHING ENGINE UNIT TESTS            ");
  console.log("==================================================");
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const suite of suites) {
    console.log(`\n\x1b[36mSuite: ${suite.name}\x1b[0m`);
    for (const test of suite.cases) {
      totalTests++;
      try {
        test.run();
        passedTests++;
        console.log(`  \x1b[32m✓\x1b[0m ${test.name}`);
      } catch (err: any) {
        failedTests++;
        console.log(`  \x1b[31m✗ ${test.name}\x1b[0m`);
        console.error(`    -> ${err.message}`);
      }
    }
  }

  console.log("\n==================================================");
  console.log("    UNIT TEST SUMMARY");
  console.log("==================================================");
  console.log(`Total:  ${totalTests}`);
  console.log(`Passed: \x1b[32m${passedTests}\x1b[0m`);
  console.log(`Failed: ${failedTests > 0 ? `\x1b[31m${failedTests}\x1b[0m` : `0`}`);
  console.log("==================================================");

  if (failedTests > 0) {
    process.exit(1);
  }

  // Run integration tests
  try {
    await runIntegrationTests();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

main();
