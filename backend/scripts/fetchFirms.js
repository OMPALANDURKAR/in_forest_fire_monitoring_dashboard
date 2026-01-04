require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");

const MAP_KEY = process.env.FIRMS_KEY;

if (!MAP_KEY) {
  console.error("❌ FIRMS_KEY missing");
  process.exit(1);
}

const FIRMS_URL =
  "https://firms.modaps.eosdis.nasa.gov/api/area/csv/" +
  MAP_KEY +
  "/VIIRS_SNPP_NRT/68,6,97,37/1";

async function fetchFires() {
  try {
    console.log("🔥 Fetching FIRMS CSV...");
    const res = await fetch(FIRMS_URL);
    const text = await res.text();

    if (text.startsWith("<")) {
      throw new Error("FIRMS returned HTML (access/format issue)");
    }

    const rows = text.trim().split("\n");
    const headers = rows[0].split(",");

    const cleaned = rows.slice(1).map(row => {
      const values = row.split(",");
      const obj = {};
      headers.forEach((h, i) => (obj[h] = values[i]));

      return {
        latitude: Number(obj.latitude),
        longitude: Number(obj.longitude),
        brightness: Number(obj.brightness),
        confidence: obj.confidence,
        acq_date: obj.acq_date,
        acq_time: obj.acq_time
      };
    });

    fs.writeFileSync(
      "./data/fires_realtime.json",
      JSON.stringify(cleaned, null, 2)
    );

    console.log(`✅ FIRMS CSV saved (${cleaned.length} records)`);
  } catch (err) {
    console.error("❌ FIRMS fetch failed:", err.message);
  }
}

fetchFires();
