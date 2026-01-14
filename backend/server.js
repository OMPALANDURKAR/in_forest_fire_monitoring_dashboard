// ================================
// IMPORTS
// ================================
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const turf = require("@turf/turf");

// Gemini AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ================================
// CREATE APP
// ================================
const app = express();
app.set("trust proxy", 1);

// ✅ Render provides PORT automatically
const PORT = process.env.PORT || 10000;

// ================================
// MIDDLEWARE
// ================================
app.use(
  cors({
    origin: "*",
    methods: ["GET"],
  })
);

app.use(express.json());

// ================================
// LOAD DATA
// ================================

// 🔹 HISTORICAL FIRE DATA (already mapped)
let fireData = [];
try {
  fireData = require("./data/fires_with_location.json");
} catch (err) {
  console.error("❌ Failed to load fires_with_location.json", err);
}

// 🔹 DISTRICT RISK SUMMARY
let districtRisk = {};
try {
  districtRisk = require("./data/district_risk.json");
} catch (err) {
  console.error("❌ Failed to load district_risk.json", err);
}

// 🔹 REAL-TIME FIRMS DATA (RAW)
let realtimeFires = [];
try {
  realtimeFires = require("./data/fires_realtime.json");
} catch {
  realtimeFires = [];
}

// 🔹 DISTRICT BOUNDARIES
let districtsGeoJSON = {};
try {
  districtsGeoJSON = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "data", "india_districts.geojson"),
      "utf8"
    )
  );
} catch (err) {
  console.error("❌ Failed to load india_districts.geojson", err);
}

// ================================
// GEMINI AI SETUP
// ================================
let geminiModel = null;

if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
} else {
  console.warn("⚠️ GEMINI_API_KEY not set. AI route disabled.");
}

// ================================
// CONFIG
// ================================
const MAX_FIRES = 300;

// ================================
// 🔑 POINT → DISTRICT MAPPER (NEW)
// ================================
const getDistrictFromPoint = (lat, lon) => {
  const point = turf.point([lon, lat]);

  for (const feature of districtsGeoJSON.features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      return {
        district:
          feature.properties.DISTRICT ||
          feature.properties.NAME_3 ||
          feature.properties.NAME_2 ||
          "Unknown",
        state:
          feature.properties.STATE ||
          feature.properties.NAME_1 ||
          "Unknown",
      };
    }
  }

  return { district: "Unknown", state: "Unknown" };
};

// ================================
// ROUTES
// ================================

// 🔹 HEALTH CHECK
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "🔥 Forest Fire Monitoring Backend is running",
  });
});

// 🔥 HISTORICAL FIRE POINTS
app.get("/api/fires", (req, res) => {
  res.json(fireData.slice(0, MAX_FIRES));
});

// 📊 DISTRICT RISK
app.get("/api/district-risk", (req, res) => {
  res.json(districtRisk);
});

// 🗺️ DISTRICT BOUNDARIES
app.get("/api/districts", (req, res) => {
  res.json(districtsGeoJSON);
});

// 🔴 REAL-TIME FIRMS (ALL INDIA) — ✅ MAPPED
app.get("/api/fires-realtime", (req, res) => {
  const enriched = realtimeFires.map(f => {
    const lat = Number(f.latitude);
    const lon = Number(f.longitude);

    const location = getDistrictFromPoint(lat, lon);

    return {
      ...f,
      district: location.district,
      state: location.state,
    };
  });

  res.json(enriched);
});

// 🔴 REAL-TIME FIRMS (DISTRICT)
app.get("/api/realtime/:district", (req, res) => {
  const district = req.params.district.toLowerCase();

  const matches = realtimeFires.filter(f => {
    const location = getDistrictFromPoint(
      Number(f.latitude),
      Number(f.longitude)
    );
    return location.district.toLowerCase() === district;
  });

  if (!matches.length) return res.json(null);

  res.json({
    count: matches.length,
    status: "Active fire detected",
  });
});

// 🔮 FUTURE RISK (LOGIC BASED)
app.get("/api/predict/:district", (req, res) => {
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

// 🤖 GEMINI AI (OPTIONAL)
app.get("/api/ai/predict/:district", async (req, res) => {
  if (!geminiModel) {
    return res.status(503).json({ error: "AI service unavailable" });
  }

  try {
    const districtName = req.params.district.toLowerCase();
    const data = districtRisk[districtName];

    if (!data) return res.status(404).json({ error: "District not found" });

    const prompt = `
You are an environmental risk analysis AI.

District: ${districtName}
Total Fires: ${data.count}
Risk Level: ${data.risk}
`;

    const result = await geminiModel.generateContent(prompt);
    const aiPrediction = JSON.parse(result.response.text());

    res.json({
      district: districtName,
      currentRisk: data.risk,
      aiPrediction,
    });
  } catch (err) {
    console.error("❌ Gemini AI Error:", err);
    res.status(500).json({ error: "Gemini AI prediction failed" });
  }
});

// 🔻 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
