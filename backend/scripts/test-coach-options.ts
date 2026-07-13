import { getScheduleOptions } from "../src/modules/coaches/coaches.service";
import { getPool } from "../src/database/connection";

async function test() {
  try {
    await getPool();
    // Use coach ID 1156 (temp.coach@gmail.com) created earlier
    // But getScheduleOptions takes userId. Let's find the userId.
    const res = await getScheduleOptions(1156, "2026-07-13");
    console.log(res);
  } catch (error) {
    console.error("ERROR:", error);
  }
  process.exit();
}
test();
