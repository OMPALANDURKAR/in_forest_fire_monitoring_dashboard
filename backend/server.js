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
// LOAD DATA SAFELY
// --------------------
const fireData = require("./data/fires_with_location.json");
const districtRisk = require("./data/district_risk.json");

// 🔴 IMPORTANT: Read GeoJSON via fs (NOT require)
const districtsGeoJSON = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "data", "india_districts.geojson"),
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
// START SERVER
// --------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
