// ================================
// IMPORTS
// ================================
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Gemini AI (ONLY for popup explanation)
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ================================
// CREATE APP
// ================================
const app = express();

// ✅ IMPORTANT: use env PORT (Render requirement)
const PORT = process.env.PORT || 5000;

// ================================
// MIDDLEWARE
// ================================
app.use(
  cors({
    origin: "*", // allow Vercel & other devices
    methods: ["GET"],
  })
);

app.use(express.json());

// ================================
// LOAD DATA (ONCE AT STARTUP)
// ================================

// 🔹 HISTORICAL FIRE DATA
const fireData = require("./data/fires_with_location.json");

// 🔹 DISTRICT RISK SUMMARY
const districtRisk = require("./data/district_risk.json");

// 🔹 REAL-TIME FIRMS DATA
let realtimeFires = [];
try {
  realtimeFires = require("./data/fires_realtime.json");
} catch {
  realtimeFires = [];
}

// 🔹 DISTRICT BOUNDARIES
const districtsGeoJSON = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "data", "india_districts.geojson"),
    "utf8"
  )
);

// ================================
// GEMINI AI SETUP
// ================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

// ================================
// CONFIG
// ================================
const MAX_FIRES = 300;

// ================================
// ROUTES
// ================================

// 🔹 HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
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

// 🔴 REAL-TIME FIRMS (ALL INDIA)
app.get("/api/fires-realtime", (req, res) => {
  res.json(realtimeFires || []);
});

// 🔴 REAL-TIME FIRMS (DISTRICT)
app.get("/api/realtime/:district", (req, res) => {
  const district = req.params.district.toLowerCase();

  const matches = realtimeFires.filter(
    f => f.district && f.district.toLowerCase() === district
  );

  if (matches.length === 0) {
    return res.json(null);
  }

  res.json({
    count: matches.length,
    status: "Active fire detected",
  });
});

// 🔮 FUTURE RISK (LOGIC BASED)
app.get("/api/predict/:district", (req, res) => {
  const district = req.params.district.toLowerCase();
  const data = districtRisk[district];

  if (!data) {
    return res.json(null);
  }

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

// 🤖 GEMINI AI (POPUP)
app.get("/api/ai/predict/:district", async (req, res) => {
  try {
    const districtName = req.params.district.toLowerCase();
    const data = districtRisk[districtName];

    if (!data) {
      return res.status(404).json({ error: "District not found" });
    }

    const prompt = `
You are an environmental risk analysis AI.

District: ${districtName}
Total Fires: ${data.count}
Risk Level: ${data.risk}

Respond ONLY in valid JSON:
{
  "predictedRisk": "Low | Medium | High",
  "trend": "Increasing | Stable | Decreasing",
  "alert": true or false,
  "explanation": "short explanation"
}
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

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
