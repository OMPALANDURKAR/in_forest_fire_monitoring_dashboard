import json
from collections import defaultdict

with open("fires_with_location.json") as f:
    fires = json.load(f)

state_counts = defaultdict(int)

for fire in fires:
    state = fire.get("state")
    if state:
        state_counts[state] += 1

state_risk = []

for state, count in state_counts.items():
    if count > 100:
        risk = "High"
    elif count > 40:
        risk = "Medium"
    else:
        risk = "Low"

    state_risk.append({
        "state": state,
        "fireCount": count,
        "risk": risk
    })

with open("state_risk.json", "w") as f:
    json.dump(state_risk, f, indent=2)
