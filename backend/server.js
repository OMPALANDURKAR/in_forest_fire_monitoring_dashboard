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
const axios = require("axios");

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
// HEALTH CHECK
// ================================
app.get("/", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// ================================
// IN-MEMORY CACHES
// ================================
let historicalFires = null;
let districtRisk = null;
let districtsGeoJSON = null;
let statesGeoJSON = null;
let stateRisk = null;

/* 🔥 FIRMS LIVE CACHE */
let firmsCache = null;
let firmsLastFetch = null;

// ================================
// CONFIG
// ================================
const MAX_HISTORICAL_FIRES = 300;
const FIRMS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

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

function loadDistrictRisk() {
  if (!districtRisk) {
    districtRisk = require("./data/district_risk.json");
    console.log("✅ Loaded district_risk.json");
  }
}

function loadStateRisk() {
  if (!stateRisk) {
    stateRisk = require("./data/state_risk.json");
    console.log("✅ Loaded state_risk.json");
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
    console.log(`✅ Loaded india_districts.geojson`);
  }
}

function loadStatesGeoJSON() {
  if (!statesGeoJSON) {
    statesGeoJSON = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "data", "india_states.geojson"),
        "utf8"
      )
    );
    console.log(`✅ Loaded india_states.geojson`);
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

// 📊 DISTRICT RISK
app.get("/api/district-risk", (req, res) => {
  loadDistrictRisk();
  res.json(districtRisk);
});

// 📊 STATE RISK
app.get("/api/state-risk", (req, res) => {
  loadStateRisk();
  res.json(stateRisk);
});

// 🗺️ DISTRICT GEOJSON
app.get("/api/districts", (req, res) => {
  loadDistrictsGeoJSON();
  res.json(districtsGeoJSON);
});

// 🗺️ STATE GEOJSON
app.get("/api/states", (req, res) => {
  loadStatesGeoJSON();
  res.json(statesGeoJSON);
});

// 🔮 DISTRICT PREDICT
app.get("/api/predict/:district", (req, res) => {
  loadHistoricalFires();

  const district = normalize(req.params.district);

  const count = historicalFires.filter(
    (f) => normalize(f.district) === district
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

// 🔮 STATE PREDICT (FIXED USING state_risk.json)
app.get("/api/predict-state/:state", (req, res) => {
  loadStateRisk();

  const stateParam = normalize(req.params.state);

  const stateData = stateRisk.find(
    (s) => normalize(s.state) === stateParam
  );

  if (!stateData) {
    return res.status(404).json({ error: "State not found" });
  }

  res.json({
    state: stateData.state,
    historicalFireCount: stateData.fireCount,
    riskLevel: stateData.risk,
    riskPercentage:
      stateData.risk === "High"
        ? 85
        : stateData.risk === "Medium"
        ? 55
        : 20,
    logic: "Derived from aggregated historical fire frequency (state-level)",
  });
});

// 📊 DISTRICT HISTORY
app.get("/api/history/:district", (req, res) => {
  loadHistoricalFires();

  const district = normalize(req.params.district);

  const fires = historicalFires.filter(
    (f) => normalize(f.district) === district
  );

  if (!fires.length) {
    return res.json({
      district,
      totalFires: 0,
      firstFireDate: null,
      lastFireDate: null,
    });
  }

  const dates = fires
    .map((f) => new Date(f.acq_date))
    .filter((d) => !isNaN(d))
    .sort((a, b) => a - b);

  res.json({
    district,
    totalFires: fires.length,
    firstFireDate: dates[0].toISOString().split("T")[0],
    lastFireDate: dates[dates.length - 1].toISOString().split("T")[0],
  });
});

// 🔴 FIRMS LIVE DATA (WITH CACHE)
app.get("/api/fires-realtime", async (req, res) => {
  try {
    const now = Date.now();

    if (firmsCache && firmsLastFetch && now - firmsLastFetch < FIRMS_CACHE_DURATION) {
      return res.json(firmsCache);
    }

    const API_KEY = process.env.FIRMS_API_KEY;

const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${API_KEY}/VIIRS_NOAA20_NRT/60,0,100,40/5`;

    const response = await axios.get(url);
    const csvData = response.data;

    const rows = csvData.split("\n");
    const headers = rows[0].split(",");

    const parsed = rows.slice(1).map(row => {
      const values = row.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = values[i];
      });
      return obj;
    });

    firmsCache = parsed;
    firmsLastFetch = now;

    res.json(parsed);

  } catch (error) {
    console.error("❌ FIRMS fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch FIRMS data" });
  }
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
