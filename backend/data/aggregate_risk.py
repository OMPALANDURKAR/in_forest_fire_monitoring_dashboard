import json
from collections import defaultdict

# Load enriched fire data
with open("fires_with_location.json", "r") as f:
    fires = json.load(f)

district_data = defaultdict(lambda: {
    "state": None,
    "fire_count": 0,
    "risk": "Low"
})

for fire in fires:
    district_raw = fire.get("district")
    state = fire.get("state")

    # ✅ SAFELY handle null districts
    if district_raw is None:
        continue

    district = district_raw.strip().lower()

    district_data[district]["fire_count"] += 1
    district_data[district]["state"] = state

# Assign risk levels
for d in district_data:
    count = district_data[d]["fire_count"]

    if count >= 200:
        district_data[d]["risk"] = "High"
    elif count >= 50:
        district_data[d]["risk"] = "Medium"
    else:
        district_data[d]["risk"] = "Low"

# Save output
with open("district_risk.json", "w") as f:
    json.dump(district_data, f, indent=2)

print("✅ District-wise fire risk generated successfully")
print("Total districts:", len(district_data))
