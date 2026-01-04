const express = require("express");
const router = express.Router();

const { predictDistrictRisk } = require("../services/geminiPredictor");
const districtRisk = require("../data/district_risk.json");

// 🔮 AI Prediction API
router.get("/predict/:district", async (req, res) => {
  try {
    const districtName = req.params.district;

    const districtData = districtRisk[districtName];

    if (!districtData) {
      return res.status(404).json({
        error: "District not found in risk data"
      });
    }

    const aiPrediction = await predictDistrictRisk(
      districtName,
      districtData
    );

    res.json({
      district: districtName,
      currentRisk: districtData.risk,
      aiPrediction
    });

  } catch (err) {
    console.error("Gemini AI Error:", err);
    res.status(500).json({ error: "AI prediction failed" });
  }
});

module.exports = router;
