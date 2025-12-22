import geopandas as gpd

gdf = gpd.read_file("india_districts.geojson")

print("Total features:", len(gdf))
print("Geometry types:", gdf.geometry.type.unique())
print("Columns:", list(gdf.columns))
print(gdf.head(2))
