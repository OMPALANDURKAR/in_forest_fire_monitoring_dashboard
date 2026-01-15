// ================================
// IMPORTS & ENV
// ================================
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const compression = require("compression");

// ================================
// APP INIT
// ================================
const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 10000;

// ================================
// MIDDLEWARE
// ================================
app.use(cors({ origin: "*", methods: ["GET"] }));
app.use(express.json());
app.use(compression());

// ================================
// 🔥 LIGHTWEIGHT HEALTH CHECK
// ================================
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// ================================
// IN-MEMORY CACHES (LAZY LOADED)
// ================================
let historicalFires = null;
let realtimeFires = null;
let districtRisk = null;
let districtsGeoJSON = null;

// ================================
// CONFIG
// ================================
const MAX_HISTORICAL_FIRES = 300;

// ================================
// HELPER LOADERS
// ================================
function loadHistoricalFires() {
  if (!historicalFires) {
    historicalFires = require("./data/fires_with_location.json");
    console.log("✅ Loaded fires_with_location.json");
  }
}

function loadRealtimeFires() {
  if (!realtimeFires) {
    realtimeFires = require("./data/fires_realtime.json");
    console.log("✅ Loaded fires_realtime.json");
  }
}

function loadDistrictRisk() {
  if (!districtRisk) {
    districtRisk = require("./data/district_risk.json");
    console.log("✅ Loaded district_risk.json");
  }
}

function loadDistrictsGeoJSON() {
  if (!districtsGeoJSON) {
    districtsGeoJSON = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "data", "india_districts.geojson"),
        "utf8"
      )
    );
    console.log(
      `✅ Loaded india_districts.geojson (${districtsGeoJSON.features.length} features)`
    );
  }
}

// ================================
// ROUTES
// ================================

// 🔥 HISTORICAL FIRE DATA (MAP + ANALYTICS)
app.get("/api/fires", (req, res) => {
  loadHistoricalFires();
  res.json(historicalFires.slice(0, MAX_HISTORICAL_FIRES));
});

// 🔴 REAL-TIME STATUS (FIRMS NRT ONLY) ✅ FIXED
app.get("/api/realtime/:district", (req, res) => {
  loadRealtimeFires();

  const district = req.params.district.toLowerCase();

  const matches = realtimeFires.filter(
    f => f.district?.toLowerCase() === district
  );

  res.json({
    district,
    activeFires: matches.length,
    status:
      matches.length > 0
        ? "Active Fires Detected"
        : "No Active Fires",
    source: "NASA FIRMS (Near Real-Time)",
    lastUpdated: new Date().toISOString(),
  });
});

// 📊 DISTRICT RISK SUMMARY
app.get("/api/district-risk", (req, res) => {
  loadDistrictRisk();
  res.json(districtRisk);
});

// 🗺️ DISTRICT BOUNDARIES
app.get("/api/districts", (req, res) => {
  loadDistrictsGeoJSON();
  res.json(districtsGeoJSON);
});

// 🔮 FUTURE RISK PREDICTION (HISTORICAL-BASED)
app.get("/api/predict/:district", (req, res) => {
  loadDistrictRisk();

  const district = req.params.district.toLowerCase();
  const data = districtRisk[district];

  if (!data) return res.json(null);

  const historicalAvg = 10;
  const percentage = Math.min(
    Math.round((data.count / historicalAvg) * 100),
    100
  );

  let level = "Low";
  if (percentage > 70) level = "High";
  else if (percentage > 40) level = "Medium";

  res.json({
    percentage,
    level,
    reason:
      "Prediction based on historical fire frequency compared to long-term average",
  });
});

// 🔻 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
