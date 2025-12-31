const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// --------------------
// CREATE APP
// --------------------
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// --------------------
// LOAD DATA (ONCE)
// --------------------
const fireData = require("./data/fires_with_location.json");
const districtRisk = require("./data/district_risk.json");

const districtsGeoJSON = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "data", "india_districts.geojson"),
    "utf8"
  )
);

// --------------------
// CONFIG (PERFORMANCE)
// --------------------
const MAX_FIRES = 300;   // 🔥 LIMIT FIRE POINTS

// --------------------
// ROUTES
// --------------------
app.get("/", (req, res) => {
  res.send("🔥 Forest Fire Monitoring Backend is running");
});

/**
 * 🔥 FIRE POINTS (THROTTLED)
 * Returns only first 800 records for performance
 */
app.get("/api/fires", (req, res) => {
  res.json(fireData.slice(0, MAX_FIRES));
});

/**
 * 📊 DISTRICT RISK (LIGHTWEIGHT)
 */
app.get("/api/district-risk", (req, res) => {
  res.json(districtRisk);
});

/**
 * 🗺️ DISTRICT BOUNDARIES (STATIC)
 * Loaded once, reused
 */
app.get("/api/districts", (req, res) => {
  res.json(districtsGeoJSON);
});

// --------------------
// START SERVER
// --------------------
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
