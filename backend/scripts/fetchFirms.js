const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");
const dotenv = require("dotenv");

dotenv.config();

const MAP_KEY = process.env.FIRMS_KEY;

if (!MAP_KEY) {
  console.error("❌ FIRMS API key missing");
  process.exit(1);
}

// CSV endpoint (THIS WORKS – you already confirmed)
const FIRMS_CSV_URL =
  "https://firms.modaps.eosdis.nasa.gov/api/area/csv/" +
  MAP_KEY +
  "/VIIRS_SNPP_NRT/68,6,97,37/1";

async function fetchFires() {
  try {
    console.log("🔥 Fetching FIRMS CSV data...");
    console.log("➡️ URL:", FIRMS_CSV_URL);

    const res = await fetch(FIRMS_CSV_URL);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const csvText = await res.text();

    const jsonData = await csv().fromString(csvText);

    const outputPath = path.join(__dirname, "../data/fires_realtime.json");
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

    console.log(`✅ FIRMS data saved (${jsonData.length} records)`);
  } catch (err) {
    console.error("❌ FIRMS fetch failed:", err.message);
  }
}

fetchFires();
