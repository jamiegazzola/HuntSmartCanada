// Combines the 3 GeoJSON parts into AB_WMU_GEOJSON
// Load ab-wmu-geojson-1.js, ab-wmu-geojson-2.js, ab-wmu-geojson-3.js first
const AB_WMU_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    ...AB_WMU_GEOJSON_PART1.features,
    ...AB_WMU_GEOJSON_PART2.features,
    ...AB_WMU_GEOJSON_PART3.features
  ]
};
