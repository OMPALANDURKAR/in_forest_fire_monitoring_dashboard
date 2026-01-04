// ================================
// IMPORTS
// ================================
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Gemini AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ================================
// CREATE APP
// ================================
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ================================
// LOAD DATA (ONCE – AT STARTUP)
// ================================
const fireData = require("./data/fires_with_location.json");
const districtRisk = require("./data/district_risk.json");

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
// CONFIG (PERFORMANCE)
// ================================
const MAX_FIRES = 300; // 🔥 limit markers for map performance

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
 * 🔥 FIRE POINTS (THROTTLED)
 */
app.get("/api/fires", (req, res) => {
  res.json(fireData.slice(0, MAX_FIRES));
});

/**
 * 📊 DISTRICT RISK DATA
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
 * 🤖 GEMINI AI – STRUCTURED DISTRICT RISK PREDICTION
 */
app.get("/api/ai/predict/:district", async (req, res) => {
  try {
    const districtName = req.params.district;

    const data = districtRisk[districtName];

    if (!data) {
      return res.status(404).json({
        error: "District not found in risk data"
      });
    }

    const prompt = `
You are an environmental risk analysis AI.

District Name: ${districtName}
Total Fire Incidents: ${data.count}
Current Risk Level: ${data.risk}
Risk Color Code: ${data.color}

Analyze the historical fire data and predict near-future
forest fire risk.

Respond ONLY in valid JSON format:
{
  "predictedRisk": "Low | Medium | High",
  "trend": "Increasing | Stable | Decreasing",
  "alert": true or false,
  "explanation": "short explanation"
}

Do not add anything outside JSON.
`;

    const result = await geminiModel.generateContent(prompt);

    let aiPrediction;
    try {
      aiPrediction = JSON.parse(result.response.text());
    } catch (parseError) {
      console.error("❌ Gemini JSON Parse Error:", result.response.text());
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
