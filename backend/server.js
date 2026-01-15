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

// ================================
// 🔥 LIGHTWEIGHT HEALTH CHECK (MUST BE FIRST)
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
const MAX_REALTIME_FIRES = 500;

// ================================
// HELPER LOADERS (SAFE + LAZY)
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

// 🔥 HISTORICAL FIRE DATA
app.get("/api/fires", (req, res) => {
  loadHistoricalFires();
  res.json(historicalFires.slice(0, MAX_HISTORICAL_FIRES));
});

// 🔴 REALTIME FIRE DATA
app.get("/api/fires-realtime", (req, res) => {
  loadRealtimeFires();
  res.json(realtimeFires.slice(0, MAX_REALTIME_FIRES));
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

// 🔴 DISTRICT REALTIME STATUS
app.get("/api/realtime/:district", (req, res) => {
  loadHistoricalFires();

  const district = req.params.district.toLowerCase();
  const matches = historicalFires.filter(
    f => f.district?.toLowerCase() === district
  );

  if (!matches.length) return res.json(null);

  res.json({
    count: matches.length,
    status: "Fire activity detected",
  });
});

// 🔮 FUTURE RISK PREDICTION
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
