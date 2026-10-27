// Mapbox token — keep this file out of git (.gitignore)
const MAPBOX_TOKEN = 'pk.eyJ1IjoiamFtaWVnYXp6b2xhIiwiYSI6ImNtcGdpbzM3dzA2ejAyd3E1NHZjZXlyMGIifQ.NKi0eSr7pXtLTO6nnrvF3A';

// Load the guided-tour controller only on the interactive map guide, after the stable map core is ready.
window.addEventListener('load', () => {
  if (!document.getElementById('hsMapDemo')) return;
  if (document.getElementById('hs-map-guide-controller')) return;
  const script = document.createElement('script');
  script.id = 'hs-map-guide-controller';
  script.src = './blog-map-guide-controller.js?v=20261026a';
  document.body.appendChild(script);
});
