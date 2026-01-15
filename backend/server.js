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
// 🔥 HEALTH CHECK
// ================================
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// ================================
// IN-MEMORY CACHES
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
// HELPERS
// ================================
const normalize = (name) =>
  name
    ? name.toLowerCase().replace(/district/g, "").replace(/\s+/g, "").trim()
    : "";

// ================================
// LOADERS
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

// 🔴 REAL-TIME STATUS (FIRMS)
app.get("/api/realtime/:district", (req, res) => {
  loadRealtimeFires();

  const district = normalize(req.params.district);

  const matches = realtimeFires.filter(
    f => normalize(f.district) === district
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

// 🗺️ DISTRICT GEOJSON
app.get("/api/districts", (req, res) => {
  loadDistrictsGeoJSON();
  res.json(districtsGeoJSON);
});

// 🔮 AI RISK OUTLOOK (HISTORICAL LOGIC)
app.get("/api/predict/:district", (req, res) => {
  loadHistoricalFires();

  const district = normalize(req.params.district);

  const count = historicalFires.filter(
    f => normalize(f.district) === district
  ).length;

  let riskLevel = "Low";
  let riskPercentage = 20;

  if (count > 80) {
    riskLevel = "High";
    riskPercentage = 85;
  } else if (count > 20) {
    riskLevel = "Medium";
    riskPercentage = 55;
  }

  res.json({
    district,
    historicalFireCount: count,
    riskLevel,
    riskPercentage,
    logic: "Derived from historical fire frequency",
  });
});

// 📊 ✅ DISTRICT HISTORY (POPUP — FINAL FIX)
app.get("/api/history/:district", (req, res) => {
  loadHistoricalFires();

  const district = normalize(req.params.district);

  const fires = historicalFires.filter(
    f => normalize(f.district) === district
  );

  if (!fires.length) {
    return res.json({
      district,
      totalFires: 0,
      firstFireDate: null,
      lastFireDate: null,
      message: "No historical fire records found",
    });
  }

  const dates = fires
    .map(f => new Date(f.acq_date))
    .filter(d => !isNaN(d))
    .sort((a, b) => a - b);

  res.json({
    district,
    totalFires: fires.length,
    firstFireDate: dates[0].toISOString().split("T")[0],
    lastFireDate: dates[dates.length - 1].toISOString().split("T")[0],
  });
});
// 🔴 FIRMS NEAR REAL-TIME (ALL INDIA)
app.get("/api/fires-realtime", (req, res) => {
  loadRealtimeFires();
  res.json(realtimeFires);
});

// 🔻 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
