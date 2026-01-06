// ================================
// GEMINI AI PREDICTOR (HISTORICAL)
// ================================

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ⚠️ Model initialized ONCE (performance + stability)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * Predict district-level forest fire risk
 * Uses ONLY historical data
 */
async function predictDistrictRisk(districtName, districtData) {
  const prompt = `
You are an expert environmental risk analysis AI.

District Name: ${districtName}
Total Fire Incidents: ${districtData.count}
Current Risk Level: ${districtData.risk}
Risk Color Code: ${districtData.color}

Analyze historical fire patterns and predict
near-future forest fire risk.

Respond ONLY in valid JSON format:
{
  "predictedRisk": "Low | Medium | High",
  "trend": "Increasing | Stable | Decreasing",
  "alert": true or false,
  "explanation": "short explanation (2-3 lines)"
}

Do not include any text outside JSON.
`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  try {
    return JSON.parse(rawText);
  } catch (error) {
    console.error("❌ Gemini JSON Parse Failed:", rawText);

    // 🛡️ Safe fallback (prevents frontend crash)
    return {
      predictedRisk: districtData.risk,
      trend: "Stable",
      alert: false,
      explanation: "AI response could not be parsed. Showing current risk."
    };
  }
}

module.exports = { predictDistrictRisk };
