# HuntSmart Mapbox Standard Satellite Preview

Branch: `mapbox-standard-satellite-preview`

This branch keeps the production app unchanged and adds a preview-only entry point that loads the existing app, upgrades Mapbox GL JS to v3.30.0, and replaces Satellite Streets v12 with Mapbox Standard Satellite. Dark and Topo are intentionally left unchanged for the first A/B test.

Preview entry point: `/mapbox-preview.html`
