import bcrypt from "bcryptjs";

async function run() {
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const staffHash = await bcrypt.hash("Staff@123", 12);
  const coachHash = await bcrypt.hash("Coach@123", 12);

  console.log("ADMIN:");
  console.log(adminHash);

  console.log("STAFF:");
  console.log(staffHash);

  console.log("COACH:");
  console.log(coachHash);
}

run();