const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");

const inputCSV = path.join(__dirname, "fires.csv");
const outputJSON = path.join(__dirname, "fires.json");

csv()
  .fromFile(inputCSV)
  .then((jsonArray) => {
    // Clean & format data
    const cleanedData = jsonArray.map(row => ({
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      brightness: Number(row.brightness),
      confidence: row.confidence,
      acq_date: row.acq_date
    }));

    fs.writeFileSync(outputJSON, JSON.stringify(cleanedData, null, 2));
    console.log("✅ CSV converted to JSON successfully");
  })
  .catch(err => {
    console.error("❌ Error converting CSV:", err);
  });
