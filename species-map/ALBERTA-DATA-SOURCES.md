# Alberta species distribution integration: source status (2026-11-12)

HuntSmart's BC map remains intact. Alberta is separated at the catalogue and
camera-state levels. Do not label administrative draw boundaries or incidental
sightings as population density or confirmed distribution.

## Published
- **Boreal caribou**, ECCC federal ranges (2012 range boundaries, used by
  2020 disturbance mapping). ArcGIS MapServer layer 4, query restricted to
  AB1–AB12 herd codes; simplified broad polygons, NOT exact animal locations,
  mountain-caribou range, or density.
  Source: https://open.canada.ca/data/en/dataset/63e1cda6-debe-4b9b-b075-3666443e30b4
  Licence: Open Government Licence – Canada, commercial reuse permitted
  subject to attribution.

## Candidates: NOT published as spatial overlays
- Alberta Government Wildlife Sensitivity layers: caribou, grizzly bear,
  mountain goat/sheep. Government's ArcGIS layer metadata specifically asks
  that commercial digital and hard-copy maps not be distributed. Obtain
  written permission before republishing derived contours.
  https://www.alberta.ca/wildlife-sensitivity-maps
- FWMIS: raw observation redistribution expressly prohibited and sensitive
  occurrence locations require additional safeguards. Do not import.
  https://www.alberta.ca/fisheries-and-wildlife-management-information-system-overview
- ABMI: modeled habitat suitability and relative abundance for elk and
  other taxa. Confirm raster availability, provenance, freshness, licensing
  and commercial redistribution rights before any deployment.
  https://abmi.ca/abmi-home/data-resources/mapping-portal
- Alberta aerial population surveys: use for external validation, not as
  distribution geometry absent spatial products and their licences.
  https://www.alberta.ca/aerial-wildlife-survey-reports

## Next data acceptance checks
1. Authoritative geometry/source date and scientific meaning established.
2. Explicit permission for commercial display and redistribution documented.
3. Geometry generalized sufficiently to protect vulnerable populations.
4. Region validation and species taxonomy reconciled with BC catalogue.
5. Download + provenance checksums, coverage and uncertainty notes recorded.
6. Mobile render, species-switch, source error, and deployment checks pass.
