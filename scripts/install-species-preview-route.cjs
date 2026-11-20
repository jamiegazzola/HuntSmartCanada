'use strict';
/* Preview builds cannot read the private KMZ submodule. Preserve the existing
   public species viewer for route/layout QA without fabricating distribution
   assets or copying private datasets into publicly accessible files. */
const fs=require('node:fs');
const path='site/species-map/index.html';
if (!fs.existsSync(path)) throw new Error('Species preview source missing');
let html=fs.readFileSync(path,'utf8');
if (!html.includes('class="species-control"') || !html.includes('</head>')) throw new Error('Species preview markup mismatch');
if (html.includes('hs-preview-species-back')) throw new Error('Preview link already installed');
html=html.replace('</head>', `  <style>
  .hs-preview-species-back {
    position: fixed; z-index: 10003;
    left: max(10px, env(safe-area-inset-left, 0px));
    bottom: calc(76px + env(safe-area-inset-bottom, 0px));
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 44px; padding: 0 16px;
    border: 1px solid rgba(255,255,255,.16);
    border-radius: 11px; background: rgba(20,28,23,.96);
    color: #e9f3eb; font: 700 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    text-decoration: none;
  }
  .hs-preview-species-back:focus-visible { outline: 2px solid #9fe6ab; outline-offset: 2px; }
  </style>
</head>`);
html=html.replace('<main id="map"', '<a class="hs-preview-species-back" href="/?map=interactive" aria-label="Return to HuntSmart hunting map">← Maps</a>\n  <main id="map"');
fs.writeFileSync(path,html);
console.log('Installed public-data species-map preview route and return navigation; private KMZ assets remain production-only.');
