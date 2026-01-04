const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function predictDistrictRisk(districtName, districtData) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
You are an expert environmental risk analysis AI.

District Name: ${districtName}
Total Fire Incidents: ${districtData.count}
Current Risk Level: ${districtData.risk}
Risk Color Code: ${districtData.color}

Based on the historical fire frequency and severity,
predict the potential forest fire risk for this district
in the near future.

Respond strictly in this format:
Predicted Risk: <Low | Medium | High>
Reason: <2–3 lines explanation>
Alert: <Yes | No>
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { predictDistrictRisk };
