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
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ================================
// LOAD DATA (ONCE AT STARTUP)
// ================================

// 🔹 HISTORICAL FIRE DATA (mapped to districts)
const fireData = require("./data/fires_with_location.json");

// 🔹 HISTORICAL DISTRICT RISK SUMMARY
const districtRisk = require("./data/district_risk.json");

// 🔹 REAL-TIME FIRMS DATA (district not guaranteed)
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
// GEMINI AI SETUP (POPUP ONLY)
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

/**
 * ROOT CHECK
 */
app.get("/", (req, res) => {
  res.send("🔥 Forest Fire Monitoring Backend is running");
});

/**
 * 🔥 HISTORICAL FIRE POINTS (MAP)
 */
app.get("/api/fires", (req, res) => {
  res.json(fireData.slice(0, MAX_FIRES));
});

/**
 * 📊 HISTORICAL DISTRICT RISK
 */
app.get("/api/district-risk", (req, res) => {
  res.json(districtRisk);
});

/**
 * 🗺️ DISTRICT BOUNDARIES
 */
app.get("/api/districts", (req, res) => {
  res.json(districtsGeoJSON);
});

/**
 * 🔴 REAL-TIME FIRMS (RIGHT PANEL – INDIA)
 */
app.get("/api/fires-realtime", (req, res) => {
  res.json(realtimeFires || []);
});

/**
 * 🔴 REAL-TIME FIRMS (SIDEBAR – DISTRICT)
 * Returns null if no fires found
 */
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
    status: "Active fire detected"
  });
});

/**
 * 🔮 FUTURE RISK PREDICTION (SIDEBAR – SIMPLE LOGIC)
 * Explainable, NOT AI
 */
app.get("/api/predict/:district", (req, res) => {
  const district = req.params.district.toLowerCase();
  const data = districtRisk[district];

  if (!data) {
    return res.json(null);
  }

  // 🔹 Simple explainable formula
  const historicalAvg = 10; // baseline
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
      "Prediction based on historical fire frequency compared to long-term average"
  });
});

/**
 * 🤖 GEMINI AI – DISTRICT POPUP (OPTIONAL)
 */
app.get("/api/ai/predict/:district", async (req, res) => {
  try {
    const districtName = req.params.district.toLowerCase();
    const data = districtRisk[districtName];

    if (!data) {
      return res.status(404).json({
        error: "District not found in risk data"
      });
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

    let aiPrediction;
    try {
      aiPrediction = JSON.parse(result.response.text());
    } catch {
      return res.status(500).json({
        error: "Invalid AI response format"
      });
    }

    res.json({
      district: districtName,
      currentRisk: data.risk,
      aiPrediction
    });

  } catch (error) {
    console.error("❌ Gemini AI Error:", error);
    res.status(500).json({
      error: "Gemini AI prediction failed"
    });
  }
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
