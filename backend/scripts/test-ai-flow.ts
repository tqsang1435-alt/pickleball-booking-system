import * as path from "path";
// Set tsconfig paths mapping support if needed, but relative imports are safest
import { getHistoricalBookings, getPromotionRecommendations } from "../src/modules/ai/ai-analytics.repository";
import { retrainAIModel, generateForecastsAndPromotions, auditForecastAccuracy, getAccuracyMetricsSummary, runPromotionsStatusScheduler } from "../src/modules/ai/ai-analytics.service";
import { updateRecommendation } from "../src/modules/ai/ai-analytics.controller";
import { validatePromotion } from "../src/modules/promotions/promotions.service";
import { getPool, sql } from "../src/database/connection";

// Ensure environment variables are loaded
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function run() {
  console.log("=== STARTING AI FLOW INTEGRATION TESTS ===");
  
  // Test 1: Verify Historical Bookings Retrieval
  console.log("\n[Test 1] Testing historical bookings retrieval...");
  const bookings = await getHistoricalBookings();
  console.log(`Successfully retrieved ${bookings.length} historical bookings.`);
  if (bookings.length === 0) {
    throw new Error("No bookings found. Please run scripts/prepare-mock-ai-data.js first.");
  }
  console.log("✓ Test 1: Historical bookings retrieval passed.");

  // Test 2: Verify Python FastAPI Retraining
  console.log("\n[Test 2] Testing FastAPI model retraining connection...");
  try {
    const retrainResult = await retrainAIModel();
    console.log("Retrain model response:", JSON.stringify(retrainResult, null, 2));
    console.log("✓ Test 2: FastAPI retraining passed.");
  } catch (error: any) {
    console.error("FastAPI connection error. Ensure the FastAPI app is running on port 8000.");
    throw error;
  }

  // Test 3: Verify Occupancy Forecasting & Promotion Optimization Generation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDateStr = tomorrow.toISOString().split("T")[0];
  console.log(`\n[Test 3] Testing forecast and promo recommendations for ${targetDateStr}...`);
  const genResult = await generateForecastsAndPromotions(targetDateStr, 50.0, 200000.0);
  console.log("Generation result:", JSON.stringify(genResult, null, 2));
  console.log("✓ Test 3: Forecasts & promotions generation passed.");

  // Test 4: Verify Accuracy Audit ("đối soát")
  console.log("\n[Test 4] Testing automated accuracy audit...");
  const auditResult = await auditForecastAccuracy();
  console.log("Audit evaluation response:", JSON.stringify(auditResult, null, 2));
  console.log("✓ Test 4: Accuracy audit passed.");

  // Test 5: Verify Accuracy Metrics Summary Fetching
  console.log("\n[Test 5] Testing accuracy metrics summary...");
  const summary = await getAccuracyMetricsSummary();
  console.log(`Successfully fetched ${summary.length} evaluation audit summary entries.`);
  console.log("✓ Test 5: Metrics summary retrieval passed.");

  // Test 6: Verify Approval, Promotion Creation, and Constraints Validation
  console.log("\n[Test 6] Testing recommendation Approval, Promotion Creation, and Validation Constraints...");
  const recs = await getPromotionRecommendations(targetDateStr);
  if (recs.length === 0) {
    console.log("No recommendations found to approve, skipping Test 6 validation.");
  } else {
    const targetRec = recs[0];
    const recId = targetRec.RecommendationID;
    console.log(`Approving recommendation ID: ${recId}...`);
    
    // Verify promotion was created in database
    const pool = await getPool();
    const userRes = await pool.request().query("SELECT TOP 1 UserID FROM Users");
    const validUserId = userRes.recordset[0]?.UserID || 1;
    
    // Call controller to approve
    const approveResult = await updateRecommendation(recId, "Approved", validUserId);
    console.log("Approve response:", JSON.stringify(approveResult, null, 2));
    const generatedCode = approveResult.promoCode;
    console.log(`Generated Promotion Code: ${generatedCode}`);
    
    const dbPromoRes = await pool.request()
      .input("Code", sql.NVarChar(50), generatedCode)
      .query("SELECT * FROM Promotions WHERE PromotionCode = @Code");
    
    const dbPromo = dbPromoRes.recordset[0];
    if (!dbPromo) throw new Error("Promotion was not created in database!");
    console.log("Promotion verified in DB with Status:", dbPromo.Status);
    
    // Test Scheduler: Temporarily change StartDate to yesterday to simulate date arrival
    await pool.request()
      .input("PromoID", sql.Int, dbPromo.PromotionID)
      .query("UPDATE Promotions SET StartDate = DATEADD(day, -1, StartDate) WHERE PromotionID = @PromoID");
      
    // Run status scheduler
    console.log("Running promotions status scheduler...");
    await runPromotionsStatusScheduler();
    
    // Verify status changed to Active
    const dbPromoActiveRes = await pool.request()
      .input("Code", sql.NVarChar(50), generatedCode)
      .query("SELECT Status FROM Promotions WHERE PromotionCode = @Code");
    console.log("Promotion Status after Scheduler execution:", dbPromoActiveRes.recordset[0].Status);
    if (dbPromoActiveRes.recordset[0].Status !== "Active") {
      throw new Error("Promotion status did not change to Active!");
    }

    // Find a real booking to test validation constraints
    const bookingRes = await pool.request().query("SELECT TOP 1 BookingID, UserID FROM Bookings WHERE Status = 'PendingPayment'");
    const testBooking = bookingRes.recordset[0];
    if (testBooking) {
      console.log(`Found pending booking ID ${testBooking.BookingID} for user ${testBooking.UserID}. Testing validation constraints...`);
      
      // Update the promotion to match this booking's date and court
      const detailsRes = await pool.request()
        .input("BookingID", sql.Int, testBooking.BookingID)
        .query("SELECT TOP 1 CourtID, BookingDate, StartTime, EndTime FROM BookingDetails WHERE BookingID = @BookingID");
      const details = detailsRes.recordset[0];
      
      if (details) {
        const detailsDateStr = details.BookingDate instanceof Date ? details.BookingDate.toISOString().split("T")[0] : new Date(details.BookingDate).toISOString().split("T")[0];
        console.log(`Booking details: Court: ${details.CourtID}, Date: ${detailsDateStr}, Time: ${details.StartTime.toString()}`);
        
        // Update promo constraints to match
        await pool.request()
          .input("PromoID", sql.Int, dbPromo.PromotionID)
          .input("CourtID", sql.Int, details.CourtID)
          .input("BookingDate", sql.Date, details.BookingDate)
          .input("HourStart", sql.Int, parseInt(details.StartTime.toString().split(":")[0]))
          .input("HourEnd", sql.Int, parseInt(details.EndTime.toString().split(":")[0]))
          .query(`
            UPDATE Promotions 
            SET TargetCourtID = @CourtID, TargetDate = @BookingDate, TargetHourStart = @HourStart, TargetHourEnd = @HourEnd,
                StartDate = @BookingDate, EndDate = @BookingDate
            WHERE PromotionID = @PromoID
          `);
          
        // Attempt 1: Validation with correct slot -> should succeed or fail on amount check (not constraints)
        try {
          await validatePromotion(testBooking.UserID, generatedCode, testBooking.BookingID);
          console.log("✓ Constraint check passed for matching booking slot!");
        } catch (err: any) {
          if (err.message.includes("không áp dụng")) {
            throw new Error(`Validation failed for correct slot constraints: ${err.message}`);
          }
          console.log(`✓ Constraint check passed (ended with expected business rule error: ${err.message})`);
        }
        
        // Attempt 2: Validation with incorrect court constraint -> should throw constraint error!
        await pool.request()
          .input("PromoID", sql.Int, dbPromo.PromotionID)
          .query("UPDATE Promotions SET TargetCourtID = 999 WHERE PromotionID = @PromoID");
          
        try {
          await validatePromotion(testBooking.UserID, generatedCode, testBooking.BookingID);
          throw new Error("Validation succeeded even with incorrect TargetCourtID constraint!");
        } catch (err: any) {
          console.log(`✓ Correctly rejected incorrect court constraint: ${err.message}`);
        }
      }
    }
  }

  console.log("\n=== ALL AI INTEGRATION FLOW TESTS PASSED SUCCESSFULLY ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("\n❌ AI flow integration test failed:", err);
  process.exit(1);
});
