import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

# Load fire CSV
fires = pd.read_csv("fires.csv")

# Convert fire points to GeoDataFrame
geometry = [Point(xy) for xy in zip(fires.longitude, fires.latitude)]
fires_gdf = gpd.GeoDataFrame(fires, geometry=geometry, crs="EPSG:4326")

# Load district GeoJSON
districts = gpd.read_file("india_districts.geojson")
districts = districts.to_crs("EPSG:4326")

# Spatial join: point inside district
joined = gpd.sjoin(fires_gdf, districts, how="left", predicate="within")

# Create final dataset with location names
final = joined[[
    "latitude",
    "longitude",
    "brightness",
    "confidence",
    "acq_date",
    "NAME_2",   # District
    "NAME_1"    # State
]].rename(columns={
    "NAME_2": "district",
    "NAME_1": "state"
})

# Save to JSON
final.to_json("fires_with_location.json", orient="records")

print("✅ Successfully mapped fire points to districts & states")
print("Total records:", len(final))
