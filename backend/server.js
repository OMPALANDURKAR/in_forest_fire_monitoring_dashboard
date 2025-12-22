const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// --------------------
// CREATE APP
// --------------------
const app = express();

app.use(cors());
app.use(express.json());

// --------------------
// LOAD DATA SAFELY
// --------------------
const fireData = require("./data/fires_with_location.json");
const districtRisk = require("./data/district_risk.json");

// 🔴 IMPORTANT: Read GeoJSON using fs (Vercel-safe)
const districtsGeoJSON = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data", "india_districts.geojson"),
    "utf8"
  )
);

// --------------------
// ROOT ROUTE
// --------------------
app.get("/", (req, res) => {
  res.send("🔥 Forest Fire Monitoring Backend is running");
});

// --------------------
// API: FIRE POINTS
// --------------------
app.get("/api/fires", (req, res) => {
  res.json(fireData);
});

// --------------------
// API: DISTRICT RISK
// --------------------
app.get("/api/district-risk", (req, res) => {
  res.json(districtRisk);
});

// --------------------
// API: DISTRICT BOUNDARIES
// --------------------
app.get("/api/districts", (req, res) => {
  res.json(districtsGeoJSON);
});

// --------------------
// EXPORT APP (NO app.listen)
// --------------------
module.exports = app;
