import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { handleChatbotMessage } from "../src/modules/ai/ai.service";
import { getPool } from "../src/database/connection";

async function run() {
  console.log("==========================================");
  console.log("   RUNNING CHATBOT INTEGRATION TESTS      ");
  console.log("==========================================");

  // Initialize DB Pool & Seed test slots
  const pool = await getPool();
  try {
    console.log("Seeding test data dynamically to ensure successful test runs...");
    
    const courtRes = await pool.request().query("SELECT CourtID FROM Courts WHERE CourtName = 'Champion Court'");
    const championId = courtRes.recordset[0]?.CourtID || 10;

    const sunriseRes = await pool.request().query("SELECT CourtID FROM Courts WHERE CourtName = 'Sunrise Court'");
    const sunriseId = sunriseRes.recordset[0]?.CourtID || 1;

    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const todayStr = formatDate(nowVN);

    const tomorrow = new Date(nowVN);
    tomorrow.setDate(nowVN.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);

    const dayAfter = new Date(nowVN);
    dayAfter.setDate(nowVN.getDate() + 2);
    const dayAfterStr = formatDate(dayAfter);

    // Clear old slots and schedules to prevent PK duplicates
    await pool.request().query(`
      DELETE FROM CourtSlots WHERE SlotDate IN ('${todayStr}', '${tomorrowStr}', '${dayAfterStr}', '2026-06-21', '2026-06-25', '2026-07-05')
      DELETE FROM CoachSchedules WHERE WorkingDate IN ('${todayStr}', '${tomorrowStr}', '${dayAfterStr}', '2026-06-21', '2026-06-25')
    `);

    // Insert slots for Champion Court
    await pool.request().query(`
      INSERT INTO CourtSlots (CourtID, SlotDate, StartTime, EndTime, Price, Status)
      VALUES 
      (${championId}, '2026-06-21', '17:00:00', '17:30:00', 250000, 'Available'),
      (${championId}, '2026-06-21', '17:30:00', '18:00:00', 250000, 'Available'),
      (${championId}, '${tomorrowStr}', '18:00:00', '19:00:00', 250000, 'Available'),
      (${championId}, '${dayAfterStr}', '07:00:00', '08:00:00', 250000, 'Available')
    `);

    // Insert slots for Sunrise Court (Booked to test bận)
    await pool.request().query(`
      INSERT INTO CourtSlots (CourtID, SlotDate, StartTime, EndTime, Price, Status)
      VALUES 
      (${sunriseId}, '2026-06-21', '17:00:00', '18:00:00', 200000, 'Booked')
    `);

    // Ensure coach schedule for Coach Huy (UserID = 3)
    const coachRes = await pool.request().query("SELECT CoachID FROM Coaches WHERE UserID = 3");
    const huyCoachId = coachRes.recordset[0]?.CoachID || 1;

    await pool.request().query(`
      INSERT INTO CoachSchedules (CoachID, WorkingDate, StartTime, EndTime, Status)
      VALUES 
      (${huyCoachId}, '2026-06-21', '08:00:00', '09:00:00', 'Available'),
      (${huyCoachId}, '2026-06-21', '17:00:00', '18:00:00', 'Available')
    `);

    console.log("✓ Dynamic data seed completed!");
  } catch (err: any) {
    console.error("Database connection or seeding failed:", err.message);
    process.exit(1);
  }

  const testCases = [
    {
      name: "Case 1: Standard available booking for specific court (Champion Court)",
      query: "Đặt sân Champion Court ngày 21 lúc 5h chiều",
      conversationId: "session_1"
    },
    {
      name: "Case 2: Confirm the court booking draft",
      query: "Xác nhận đặt sân",
      conversationId: "session_1",
      userId: 2,
      userRoles: ["Player"]
    },
    {
      name: "Case 3: Specific court bận (Sunrise Court) - Gợi ý sân khác cùng giờ",
      query: "Đặt sân Sunrise Court ngày 21 lúc 5h chiều",
      conversationId: "session_3"
    },
    {
      name: "Case 4: Relative day 'ngày mai' check",
      query: "Sân Champion Court ngày mai lúc 6h tối còn trống không?",
      conversationId: "session_4"
    },
    {
      name: "Case 5: Relative day 'ngày kia' check",
      query: "Tìm sân Champion Court ngày kia lúc 7h sáng",
      conversationId: "session_5"
    },
    {
      name: "Case 6: Month wrapping check (day < current day 21 -> next month)",
      query: "Đặt sân Champion Court ngày 5 lúc 9h sáng",
      conversationId: "session_6"
    },
    {
      name: "Case 7: Check court availability without court name (returns suggestions)",
      query: "Có sân nào trống ngày mai lúc 6h tối không?",
      conversationId: "session_7"
    },
    {
      name: "Case 8: Ask for court rental price list",
      query: "Giá thuê sân là bao nhiêu?",
      conversationId: "session_8"
    },
    {
      name: "Case 9: Ask for coach list/info",
      query: "Tôi muốn tìm huấn luyện viên",
      conversationId: "session_9"
    },
    {
      name: "Case 10: Ask for coach hourly rate/price list",
      query: "Giá thuê coach là bao nhiêu?",
      conversationId: "session_10"
    },
    {
      name: "Case 11: Check coach availability (Coach Huy)",
      query: "Thầy Huy ngày 21 lúc 8h sáng có rảnh không?",
      conversationId: "session_11"
    },
    {
      name: "Case 12: Book coach (Coach Huy) without court",
      query: "Tôi muốn đặt thầy Huy ngày 21 lúc 8h sáng",
      conversationId: "session_12"
    },
    {
      name: "Case 13: Confirm the coach booking draft",
      query: "Đồng ý đặt",
      conversationId: "session_12",
      userId: 2,
      userRoles: ["Player"]
    },
    {
      name: "Case 14: Book coach (Coach Huy) with court together (needCourtTogether: true)",
      query: "Tôi muốn đặt lịch học với thầy Huy và cần đặt sân cùng lúc vào lúc 5h chiều ngày 21",
      conversationId: "session_14"
    },
    {
      name: "Case 15: Confirm the combo booking draft",
      query: "Xác nhận đặt",
      conversationId: "session_14",
      userId: 2,
      userRoles: ["Player"]
    },
    {
      name: "Case 16: Check availability for non-existent coach (returns suggestion of other coaches)",
      query: "Tôi muốn học với coach Nam",
      conversationId: "session_16"
    },
    {
      name: "Case 17: Request booking history (anonymous user -> login required)",
      query: "Xem lịch sử đặt sân của tôi",
      conversationId: "session_17"
    },
    {
      name: "Case 18: Request booking history (authenticated user -> list bookings)",
      query: "Xem lịch sử đặt sân của tôi",
      conversationId: "session_18",
      userId: 2,
      userRoles: ["Player"]
    },
    {
      name: "Case 19: Cancel booking help (anonymous user -> login required)",
      query: "Tôi muốn hủy lịch đặt",
      conversationId: "session_19"
    },
    {
      name: "Case 20: Cancel booking help (authenticated user -> prompt list)",
      query: "Tôi muốn hủy lịch đặt",
      conversationId: "session_20",
      userId: 2,
      userRoles: ["Player"]
    }
  ];

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const tc of testCases) {
    console.log(`\n--- Running test: ${tc.name} ---`);
    console.log(`Query: "${tc.query}" (convId: ${tc.conversationId || "test"}, userId: ${tc.userId || "guest"})`);
    try {
      const result = await handleChatbotMessage(
        tc.query,
        tc.conversationId || "test_conv",
        tc.userId,
        tc.userRoles || []
      );
      console.log(`Intent: ${result.intent}`);
      console.log(`ActionType: ${result.actionType}`);
      console.log(`Reply: ${result.message}`);
      
      if (result.suggestedSlots && result.suggestedSlots.length > 0) {
        console.log(`Suggested Slots (${result.suggestedSlots.length}):`);
        result.suggestedSlots.forEach((s: any, idx: number) => {
          console.log(`  [${idx + 1}] Court ${s.courtId}: ${s.courtName} at ${s.availableTime} (${s.price}đ)`);
        });
      }
      if (result.suggestedCoaches && result.suggestedCoaches.length > 0) {
        console.log(`Suggested Coaches (${result.suggestedCoaches.length}):`);
        result.suggestedCoaches.forEach((c: any, idx: number) => {
          console.log(`  [${idx + 1}] Coach ${c.coachId}: ${c.name} (${c.skillLevel}) - ${c.hourlyRate}đ/h`);
        });
      }
      if (result.bookingDraft) {
        console.log(`Booking Draft: ${JSON.stringify(result.bookingDraft)}`);
      }
      if (result.coachBookingDraft) {
        console.log(`Coach Booking Draft: ${JSON.stringify(result.coachBookingDraft)}`);
      }
    } catch (err: any) {
      console.error(`Error executing chatbot query:`, err.message);
    }
    // Sleep slightly to throttle FastAPI requests to respect the 15 RPM limit
    await sleep(5000);
  }

  process.exit(0);
}

run();
