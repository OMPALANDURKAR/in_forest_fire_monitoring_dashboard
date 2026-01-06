// ================================
// AI ROUTES – HISTORICAL DATA ONLY
// ================================

const express = require("express");
const router = express.Router();

// Gemini predictor service
const { predictDistrictRisk } = require("../services/geminiPredictor");

// Historical district risk data
const districtRisk = require("../data/district_risk.json");

/**
 * 🤖 AI PREDICTION
 * Triggered ONLY when user clicks a district
 * Uses ONLY historical fire data
 */
router.get("/predict/:district", async (req, res) => {
  try {
    const districtName = req.params.district;

    // 🔍 Fetch historical district data
    const districtData = districtRisk[districtName];

    if (!districtData) {
      return res.status(404).json({
        error: "District not found in historical risk data"
      });
    }

    // 🧠 AI prediction using historical trends
    const aiPrediction = await predictDistrictRisk(
      districtName,
      districtData
    );

    res.json({
      district: districtName,
      currentRisk: districtData.risk,
      aiPrediction
    });

  } catch (error) {
    console.error("❌ Gemini AI Prediction Error:", error);
    res.status(500).json({
      error: "Gemini AI prediction failed"
    });
  }
});

module.exports = router;
