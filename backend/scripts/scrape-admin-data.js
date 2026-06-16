const fs = require("fs");
const path = require("path");

require("dotenv").config();

const API_BASE_URL = (
  process.env.ADMIN_SCRAPE_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const OUTPUT_FORMAT = (process.env.ADMIN_SCRAPE_FORMAT || "json").toLowerCase();

function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

function timestampStr() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function request(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    throw new Error(
      `Cannot connect to ${API_BASE_URL}${endpoint}. ` +
        "Make sure the backend is running and ADMIN_SCRAPE_API_URL is correct. " +
        `Original error: ${error.message}`
    );
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `${options.method || "GET"} ${endpoint} failed (${response.status}): ` +
        (payload?.message || text || response.statusText)
    );
  }

  return payload?.data ?? payload;
}

async function getAdminToken() {
  if (ADMIN_TOKEN) {
    return ADMIN_TOKEN;
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "Missing credentials. Set ADMIN_TOKEN or set ADMIN_EMAIL and ADMIN_PASSWORD in .env."
    );
  }

  const result = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });

  if (!result?.token) {
    throw new Error("Login succeeded but no token was returned.");
  }

  return result.token;
}

async function scrapeAdminData(token) {
  const today = todayStr();
  const staffPage = await request("/api/admin/users?page=1&limit=100&roleName=Staff", { token });

  return {
    scrapedAt: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    dashboard: await request("/api/admin/dashboard", { token }),
    dailyBookings: await request(`/api/bookings/daily?date=${today}`, { token }),
    courts: await request("/api/courts", { token }),
    coaches: await request("/api/admin/coaches", { token }),
    staff: staffPage,
    staffItems: staffPage?.items || [],
    promotions: await request("/api/admin/promotions", { token }),
  };
}

function ensureOutputDir() {
  const outputDir = path.join(__dirname, "..", "exports", "admin-scrape");
  fs.mkdirSync(outputDir, { recursive: true });
  return outputDir;
}

function flattenValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function toCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "";
  }

  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escapeCell = (value) => `"${flattenValue(value).replaceAll('"', '""')}"`;

  return [
    keys.map(escapeCell).join(","),
    ...rows.map((row) => keys.map((key) => escapeCell(row[key])).join(",")),
  ].join("\r\n");
}

function writeJson(outputDir, data) {
  const outputPath = path.join(outputDir, `admin-data-${timestampStr()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
  return [outputPath];
}

function writeCsv(outputDir, data) {
  const written = [];

  for (const [name, value] of Object.entries(data)) {
    if (!Array.isArray(value)) {
      continue;
    }

    const outputPath = path.join(outputDir, `${name}-${timestampStr()}.csv`);
    fs.writeFileSync(outputPath, `\uFEFF${toCsv(value)}`, "utf8");
    written.push(outputPath);
  }

  return written;
}

async function main() {
  const token = await getAdminToken();
  const data = await scrapeAdminData(token);
  const outputDir = ensureOutputDir();

  const written =
    OUTPUT_FORMAT === "csv"
      ? writeCsv(outputDir, data)
      : OUTPUT_FORMAT === "all"
        ? [...writeJson(outputDir, data), ...writeCsv(outputDir, data)]
        : writeJson(outputDir, data);

  console.log("Admin data scraped successfully.");
  for (const file of written) {
    console.log(`- ${file}`);
  }
}

main().catch((error) => {
  console.error("Admin data scraping failed:");
  console.error(error.message);
  process.exit(1);
});
