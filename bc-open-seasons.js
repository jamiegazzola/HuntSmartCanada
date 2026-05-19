// ══════════════════════════════════════════════════════════════
// BC OPEN SEASONS  —  bc-open-seasons.js
// 2024–2026 Hunting & Trapping Regulations Synopsis
// Region 3 Thompson (preview — full province forthcoming)
// ══════════════════════════════════════════════════════════════

// ── DATA ─────────────────────────────────────────────────────
// Fields: region (int), region_name, species, management_units,
//         class, season_open, season_close, weapon_type,
//         bag_limit, notes
const BC_OS_DATA = [
  // ── Mule Deer (Black-tailed) ─────────────────────────────
  { region:3, region_name:'Thompson', species:'Mule Deer (Black-tailed)', management_units:'3-15 to 3-16 | 3-32 to 3-33',                        class:'4 Point Bucks',          season_open:'Sept 1',  season_close:'Sept 9',  weapon_type:'Rifle',      bag_limit:'1',                  notes:'Antlers must accompany species licence' },
  { region:3, region_name:'Thompson', species:'Mule Deer (Black-tailed)', management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'4 Point Bucks',          season_open:'Sept 10', season_close:'Sept 30', weapon_type:'Rifle',      bag_limit:'1',                  notes:'Antlers must accompany species licence' },
  { region:3, region_name:'Thompson', species:'Mule Deer (Black-tailed)', management_units:'3-46',                                               class:'4 Point Bucks',          season_open:'Sept 20', season_close:'Sept 30', weapon_type:'Rifle',      bag_limit:'1',                  notes:'Antlers must accompany species licence' },
  { region:3, region_name:'Thompson', species:'Mule Deer (Black-tailed)', management_units:'3-12 to 3-20 | 3-26 to 3-44 | 3-46',               class:'Bucks',                   season_open:'Oct 1',   season_close:'Oct 31',  weapon_type:'Rifle',      bag_limit:'1',                  notes:'' },
  { region:3, region_name:'Thompson', species:'Mule Deer (Black-tailed)', management_units:'3-12 to 3-20 | 3-26 to 3-44 | 3-46',               class:'4 Point Bucks',          season_open:'Nov 1',   season_close:'Dec 10',  weapon_type:'Rifle',      bag_limit:'1',                  notes:'Antlers must accompany species licence' },
  { region:3, region_name:'Thompson', species:'Mule Deer (Black-tailed)', management_units:'3-12 to 3-14 | 3-17 to 3-20 | 3-26 to 3-31 | 3-34 to 3-44', class:'Bucks',          season_open:'Sept 1',  season_close:'Sept 9',  weapon_type:'Youth Only', bag_limit:'1',                  notes:'Restricted to hunters under 18' },
  { region:3, region_name:'Thompson', species:'Mule Deer (Black-tailed)', management_units:'3-12 to 3-14 | 3-17 to 3-20 | 3-26 to 3-31 | 3-34 to 3-44', class:'Bucks',          season_open:'Sept 1',  season_close:'Sept 9',  weapon_type:'Bow Only',   bag_limit:'1',                  notes:'' },
  // ── White-tailed Deer ────────────────────────────────────
  { region:3, region_name:'Thompson', species:'White-tailed Deer',        management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Bucks',                   season_open:'Sept 10', season_close:'Dec 10',  weapon_type:'Rifle',      bag_limit:'2',                  notes:'' },
  { region:3, region_name:'Thompson', species:'White-tailed Deer',        management_units:'3-46',                                               class:'Bucks',                   season_open:'Sept 20', season_close:'Dec 10',  weapon_type:'Rifle',      bag_limit:'2',                  notes:'' },
  { region:3, region_name:'Thompson', species:'White-tailed Deer',        management_units:'3-12 to 3-20 | 3-26 to 3-44 | 3-46',               class:'Antlerless',              season_open:'Oct 10',  season_close:'Oct 31',  weapon_type:'Rifle',      bag_limit:'2',                  notes:'' },
  { region:3, region_name:'Thompson', species:'White-tailed Deer',        management_units:'3-12 to 3-20 | 3-26 to 3-44 | 3-46',               class:'Either Sex',              season_open:'Nov 1',   season_close:'Nov 30',  weapon_type:'Youth Only', bag_limit:'2',                  notes:'Restricted to hunters under 18' },
  { region:3, region_name:'Thompson', species:'White-tailed Deer',        management_units:'3-12 to 3-20 | 3-26 to 3-44 | 3-46',               class:'Bucks',                   season_open:'Sept 1',  season_close:'Sept 9',  weapon_type:'Youth Only', bag_limit:'2',                  notes:'Restricted to hunters under 18' },
  { region:3, region_name:'Thompson', species:'White-tailed Deer',        management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Bucks',                   season_open:'Sept 1',  season_close:'Sept 9',  weapon_type:'Bow Only',   bag_limit:'2',                  notes:'' },
  // ── Moose ────────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Moose',                    management_units:'3-34 to 3-38 | 3-40 to 3-44 | 3-46',               class:'Spike-fork Bulls',        season_open:'Sept 20', season_close:'Oct 31',  weapon_type:'Rifle',      bag_limit:'1',                  notes:'Compulsory Inspection required; mandatory hunter report by Jan 15' },
  { region:3, region_name:'Thompson', species:'Moose',                    management_units:'3-15 to 3-17 | 3-31 to 3-33',                        class:'Spike-fork Bulls',        season_open:'Oct 15',  season_close:'Nov 15',  weapon_type:'Rifle',      bag_limit:'1',                  notes:'Compulsory Inspection required; mandatory hunter report by Jan 15' },
  { region:3, region_name:'Thompson', species:'Moose',                    management_units:'3-12 to 3-14 | 3-18 to 3-20 | 3-26 to 3-30 | 3-39', class:'Spike-fork Bulls',       season_open:'Nov 1',   season_close:'Nov 15',  weapon_type:'Rifle',      bag_limit:'1',                  notes:'Compulsory Inspection required; mandatory hunter report by Jan 15' },
  // ── Bighorn Mountain Sheep ───────────────────────────────
  { region:3, region_name:'Thompson', species:'Bighorn Mountain Sheep',   management_units:'3-31 | 3-32 (portion)',                              class:'Full Curl Bighorn Rams',  season_open:'Sept 10', season_close:'Oct 20',  weapon_type:'Rifle',      bag_limit:'1',                  notes:'Compulsory Inspection required. Portion of 3-32 closed — see Map C21' },
  { region:3, region_name:'Thompson', species:'Bighorn Mountain Sheep',   management_units:'3-17 (portion)',                                     class:'Mature Bighorn Rams',     season_open:'Sept 10', season_close:'Oct 20',  weapon_type:'Rifle',      bag_limit:'1',                  notes:'Compulsory Inspection required. See Map C2' },
  // ── Black Bear ───────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Black Bear',               management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Sept 1',  season_close:'Nov 30',  weapon_type:'Rifle',      bag_limit:'2',                  notes:'Bears less than 2 years old or in company of cubs: closed' },
  { region:3, region_name:'Thompson', species:'Black Bear',               management_units:'3-46',                                               class:'Any',                     season_open:'Sept 20', season_close:'Nov 30',  weapon_type:'Rifle',      bag_limit:'2',                  notes:'' },
  { region:3, region_name:'Thompson', species:'Black Bear',               management_units:'3-12 to 3-20 | 3-26 to 3-44 | 3-46',               class:'Any',                     season_open:'Apr 1',   season_close:'June 30', weapon_type:'Rifle',      bag_limit:'2',                  notes:'Spring season' },
  // ── Wolf ─────────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Wolf',                     management_units:'3-12 to 3-16 | 3-18 to 3-20',                        class:'Any',                     season_open:'Sept 10', season_close:'June 15', weapon_type:'Rifle',      bag_limit:'3',                  notes:'' },
  { region:3, region_name:'Thompson', species:'Wolf',                     management_units:'3-17 | 3-26 to 3-44',                               class:'Any',                     season_open:'No closed season', season_close:'No closed season', weapon_type:'Rifle', bag_limit:'NBL', notes:'No bag limit; no closed season' },
  // ── Coyote ───────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Coyote',                   management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Sept 1',  season_close:'June 30', weapon_type:'Rifle',      bag_limit:'NBL',                notes:'' },
  // ── Cougar ───────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Cougar',                   management_units:'3-12 to 3-20 | 3-26 to 3-33',                        class:'Any',                     season_open:'Nov 15',  season_close:'Mar 31',  weapon_type:'Rifle',      bag_limit:'2',                  notes:'Compulsory Inspection required; cougar kitten closed' },
  { region:3, region_name:'Thompson', species:'Cougar',                   management_units:'3-34 to 3-44',                                       class:'Any',                     season_open:'Sept 10', season_close:'Mar 31',  weapon_type:'Rifle',      bag_limit:'2',                  notes:'Compulsory Inspection required; cougar kitten closed' },
  // ── Bobcat ───────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Bobcat',                   management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Nov 15',  season_close:'Feb 15',  weapon_type:'Rifle',      bag_limit:'1',                  notes:'Compulsory Reporting required' },
  // ── Lynx ─────────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Lynx',                     management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Nov 15',  season_close:'Feb 15',  weapon_type:'Rifle',      bag_limit:'1',                  notes:'Compulsory Reporting required' },
  // ── Raccoon ──────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Raccoon',                  management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'No closed season', season_close:'No closed season', weapon_type:'Rifle', bag_limit:'NBL', notes:'No closed season' },
  // ── Snowshoe Hare ────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Snowshoe Hare',            management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Aug 1',   season_close:'Apr 30',  weapon_type:'Rifle',      bag_limit:'10 daily',           notes:'' },
  // ── Columbian Ground Squirrel ────────────────────────────
  { region:3, region_name:'Thompson', species:'Columbian Ground Squirrel',management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'No closed season', season_close:'No closed season', weapon_type:'Rifle', bag_limit:'NBL', notes:'Private land only; landowner permission required' },
  // ── Grouse ───────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Grouse (Dusky/Blue/Ruffed/Spruce)', management_units:'3-12 to 3-20 | 3-26 to 3-44',             class:'Any',                     season_open:'Sept 10', season_close:'Nov 30',  weapon_type:'Rifle',      bag_limit:'5 each; 10 daily aggregate', notes:'Possession limit 30 aggregate' },
  { region:3, region_name:'Thompson', species:'Grouse (Dusky/Blue/Ruffed/Spruce)', management_units:'3-46',                                      class:'Any',                     season_open:'Sept 20', season_close:'Nov 30',  weapon_type:'Rifle',      bag_limit:'5 each; 10 daily aggregate', notes:'Possession limit 30 aggregate' },
  // ── Sharp-tailed Grouse ──────────────────────────────────
  { region:3, region_name:'Thompson', species:'Sharp-tailed Grouse',      management_units:'3-30 | 3-31 (portion)',                              class:'Any',                     season_open:'Sept 10', season_close:'Nov 30',  weapon_type:'Rifle',      bag_limit:'5 (10 possession)',  notes:'No season in portion of 3-30 south of Scottie Creek FSR' },
  // ── Ptarmigan ────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Ptarmigan',                management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Sept 1',  season_close:'Nov 30',  weapon_type:'Rifle',      bag_limit:'5 (15 possession)',  notes:'' },
  // ── Chukar Partridge ─────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Chukar Partridge',         management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Oct 1',   season_close:'Nov 30',  weapon_type:'Rifle',      bag_limit:'5 (15 possession)',  notes:'' },
  // ── Gray Partridge ───────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Gray Partridge (Hungarian)',management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Oct 1',   season_close:'Nov 30',  weapon_type:'Rifle',      bag_limit:'3 (9 possession)',   notes:'' },
  // ── Pheasant ─────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Pheasant',                 management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Cocks',                   season_open:'Oct 1',   season_close:'Nov 30',  weapon_type:'Rifle',      bag_limit:'2 (6 possession)',   notes:'' },
  // ── Dove ─────────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Dove (Mourning/Eurasian Collared)', management_units:'3-12 to 3-20 | 3-26 to 3-44',              class:'Any',                     season_open:'Sept 1',  season_close:'Sept 30', weapon_type:'Rifle',      bag_limit:'5 (15 possession)',  notes:'' },
  // ── Band-tailed Pigeon ───────────────────────────────────
  { region:3, region_name:'Thompson', species:'Band-tailed Pigeon',       management_units:'3-13 to 3-17',                                       class:'Any',                     season_open:'Sept 15', season_close:'Sept 30', weapon_type:'Shotgun',    bag_limit:'5 (15 possession)',  notes:'' },
  // ── Waterfowl ────────────────────────────────────────────
  { region:3, region_name:'Thompson', species:'Common Snipe',             management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Sept 8',  season_close:'Dec 23',  weapon_type:'Shotgun',    bag_limit:'10 (30 possession)', notes:'Non-toxic shot required' },
  { region:3, region_name:'Thompson', species:'Coots',                    management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Sept 8',  season_close:'Dec 23',  weapon_type:'Shotgun',    bag_limit:'10 (30 possession)', notes:'Non-toxic shot required' },
  { region:3, region_name:'Thompson', species:'Ducks',                    management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Sept 8',  season_close:'Dec 23',  weapon_type:'Shotgun',    bag_limit:'8 (24 possession)',  notes:'Daily aggregate 8. Max 4 Pintail; 4 Canvasback; 2 Goldeneye aggregate; 2 Harlequin. Non-toxic shot required' },
  { region:3, region_name:'Thompson', species:"Geese (Snow & Ross's)",    management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Sept 8',  season_close:'Dec 23',  weapon_type:'Shotgun',    bag_limit:'5 (15 possession)',  notes:'Non-toxic shot required' },
  { region:3, region_name:'Thompson', species:'Geese (White-fronted)',     management_units:'3-12 to 3-20 | 3-26 to 3-44',                        class:'Any',                     season_open:'Sept 8',  season_close:'Dec 23',  weapon_type:'Shotgun',    bag_limit:'5 (15 possession)',  notes:'Non-toxic shot required' },
  { region:3, region_name:'Thompson', species:'Geese (Canada & Cackling)', management_units:'3-12 to 3-20 | 3-26 to 3-44',                       class:'Any',                     season_open:'Sept 8',  season_close:'Sept 20', weapon_type:'Shotgun',    bag_limit:'10 (30 possession)', notes:'Non-toxic shot required' },
  { region:3, region_name:'Thompson', species:'Geese (Canada & Cackling)', management_units:'3-12 to 3-20 | 3-26 to 3-44',                       class:'Any',                     season_open:'Oct 1',   season_close:'Dec 23',  weapon_type:'Shotgun',    bag_limit:'10 (30 possession)', notes:'Non-toxic shot required' },
  { region:3, region_name:'Thompson', species:'Geese (Canada & Cackling)', management_units:'3-12 to 3-20 | 3-26 to 3-44',                       class:'Any',                     season_open:'Mar 1',   season_close:'Mar 10',  weapon_type:'Shotgun',    bag_limit:'10 (30 possession)', notes:'Non-toxic shot required' },
];

// ── SPECIES CATEGORIES ───────────────────────────────────────
// Defines display order and grouping. Big game renders first.
const OS_BIG_GAME_ORDER = [
  'Mule Deer (Black-tailed)', 'White-tailed Deer', 'Moose', 'Elk',
  'Caribou', 'Bison', 'Bighorn Mountain Sheep', 'Thinhorn Mountain Sheep',
  'Mountain Goat', 'Black Bear', 'Grizzly Bear',
  'Cougar', 'Wolf', 'Coyote', 'Bobcat', 'Lynx', 'Wolverine',
];
const OS_BIG_GAME_SET = new Set(OS_BIG_GAME_ORDER);

function osIsBigGame(sp) { return OS_BIG_GAME_SET.has(sp); }

// Sort species array: big game in defined order, then small game/birds alphabetically
function osSortedSpecies(arr) {
  const big   = OS_BIG_GAME_ORDER.filter(sp => arr.includes(sp));
  const small = arr.filter(sp => !OS_BIG_GAME_SET.has(sp)).sort();
  return { big, small };
}

// ── STATE ────────────────────────────────────────────────────
let osSelSpecies = '';
let osSelWeapon  = '';
let osSelMonth   = '';
let osSelMUs     = new Set();

let osMapInitialized = false;
let osMapInstance    = null;
let osWmuGeoLayer    = null;

// ── MONTH UTILITIES ──────────────────────────────────────────
const OS_MON = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };

function osParseMonth(s) {
  const m = String(s || '').toLowerCase().match(/^([a-z]{3})/);
  return m ? (OS_MON[m[1]] || null) : null;
}

function osRowInMonth(row, n) {
  if (!n) return true;
  const o = osParseMonth(row.season_open);
  const c = osParseMonth(row.season_close);
  if (!o || !c) return true; // "No closed season" rows — always include
  return (o <= c) ? (n >= o && n <= c) : (n >= o || n <= c); // handle year-wrap e.g. Nov–Mar
}

// ── MU RANGE EXPANDER ────────────────────────────────────────
// "3-12 to 3-20 | 3-26 to 3-44" → ["3-12", "3-13", ..., "3-44"]
function osParseMUs(s) {
  if (!s) return [];
  const out = [];
  for (const seg of s.split('|').map(x => x.trim())) {
    const range = seg.match(/^(\d+)-(\d+)\s+to\s+\d+-(\d+)$/);
    if (range) {
      const region = parseInt(range[1]);
      for (let i = parseInt(range[2]); i <= parseInt(range[3]); i++) out.push(`${region}-${i}`);
    } else {
      const single = seg.match(/^(\d+-\d+)/);
      if (single) out.push(single[1]);
    }
  }
  return out;
}

// ── FILTER ───────────────────────────────────────────────────
function osGetFiltered() {
  const mn = osSelMonth ? parseInt(osSelMonth) : null;
  return BC_OS_DATA.filter(row => {
    if (osSelSpecies && row.species !== osSelSpecies) return false;
    if (osSelWeapon  && row.weapon_type !== osSelWeapon) return false;
    if (mn && !osRowInMonth(row, mn)) return false;
    if (osSelMUs.size > 0 && !osParseMUs(row.management_units).some(mu => osSelMUs.has(mu))) return false;
    return true;
  });
}

function osGetActiveMUs() {
  const s = new Set();
  osGetFiltered().forEach(row => osParseMUs(row.management_units).forEach(mu => s.add(mu)));
  return s;
}

// ── MAP STYLES ───────────────────────────────────────────────
function osWmuStyle(feature, active) {
  const id = feature.properties.wmu_id || '';
  if (osSelMUs.has(id)) return { fillColor:'#4ade80', fillOpacity:0.75, color:'#ffffff', weight:2.5, opacity:1.0 };
  if (active.has(id))   return { fillColor:'#c47a1a', fillOpacity:0.50, color:'#1a1a1a', weight:0.9, opacity:0.85 };
  return                       { fillColor:'#2a2a2a', fillOpacity:0.20, color:'#1a1a1a', weight:0.5, opacity:0.60 };
}

function osRefreshMapStyles() {
  if (!osWmuGeoLayer) return;
  const active = osGetActiveMUs();
  osWmuGeoLayer.eachLayer(l => l.setStyle(osWmuStyle(l.feature, active)));
}
window.osRefreshMapStyles = osRefreshMapStyles;

// ── MAP INIT ─────────────────────────────────────────────────
function osInitMap() {
  if (osMapInitialized) return;
  osMapInitialized = true;

  function doInit(geojson) {
    const el = document.getElementById('osMapLeaflet');
    if (!el) return;

    osMapInstance = L.map('osMapLeaflet', {
      center: [54.0, -124.0], zoom: 5,
      minZoom: 4, maxZoom: 13,
      zoomControl: true, attributionControl: false,
      scrollWheelZoom: true, touchZoom: true
    });

    L.control.attribution({
      prefix: '&copy; <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      position: 'bottomright'
    }).addTo(osMapInstance);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: 'abc', maxZoom: 19
    }).addTo(osMapInstance);

    const active = osGetActiveMUs();

    osWmuGeoLayer = L.geoJSON(geojson, {
      style: f => osWmuStyle(f, active),
      onEachFeature: (feature, layer) => {
        const id = feature.properties.wmu_id || '';

        layer.on('mouseover', function(e) {
          const sel    = osSelMUs.has(id);
          const isAct  = osGetActiveMUs().has(id);
          this.setStyle(
            sel   ? { fillColor:'#4ade80', fillOpacity:0.90, weight:3.0, color:'#ffffff' } :
            isAct ? { fillColor:'#d4912a', fillOpacity:0.70, weight:1.5, color:'#c47a1a' } :
                    { fillColor:'#888888', fillOpacity:0.30, weight:1.0, color:'#555555' }
          );
          const speciesInMU = [...new Set(
            osGetFiltered()
              .filter(r => osParseMUs(r.management_units).includes(id))
              .map(r => r.species)
          )];
          const tipContent = (isAct || sel)
            ? `<strong style="color:#c47a1a">WMU ${id}</strong><br><span style="font-size:11px;color:#ccc">${speciesInMU.slice(0, 5).join(', ')}${speciesInMU.length > 5 ? ' +' + (speciesInMU.length - 5) + ' more' : ''}</span>`
            : `<strong>WMU ${id}</strong><br><span style="font-size:11px;color:#888">No open seasons match current filters</span>`;
          this.bindTooltip(tipContent, {
            sticky: true, direction: 'top', offset: [0, -4],
            opacity: 1, className: 'ab-wmu-tip'
          }).openTooltip(e.latlng);
        });

        layer.on('mouseout', function() {
          this.setStyle(osWmuStyle(feature, osGetActiveMUs()));
          this.closeTooltip();
        });

        layer.on('click', function() {
          if (osSelMUs.has(id)) osSelMUs.delete(id);
          else osSelMUs.add(id);
          osRefreshMapStyles();
          osUpdateMUChips();
          osRenderPanel();
        });
      }
    }).addTo(osMapInstance);

    osMapInstance.fitBounds([[48.3, -139.1], [60.1, -114.0]]);
  }

  // Reuse cached GeoJSON from BC draws map if available
  const cached = (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) ? bcWmuGeoJSON : null;
  if (cached) { doInit(cached); return; }

  const url = (typeof BC_WMU_GEOJSON_URL !== 'undefined')
    ? BC_WMU_GEOJSON_URL
    : 'https://raw.githubusercontent.com/jamiegazzola/HuntSmartCanada/main/bc_wmu.geojson';

  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (typeof window !== 'undefined') window.bcWmuGeoJSON = data;
      doInit(data);
    })
    .catch(err => console.error('[BC Open Seasons] GeoJSON load failed:', err));
}

// ── WMU CHIP ROW ─────────────────────────────────────────────
function osUpdateMUChips() {
  const row = document.getElementById('osMapChipsRow');
  if (!row) return;

  if (osSelMUs.size === 0) {
    row.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">Click WMUs on the map to filter by area</span>';
    return;
  }

  const chipStyle = 'display:inline-flex;align-items:center;gap:4px;padding:3px 10px 3px 10px;' +
    'background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.3);border-radius:12px;' +
    'font-size:11px;font-weight:700;color:#4ade80;letter-spacing:.02em';

  row.innerHTML = [...osSelMUs].sort().map(id =>
    `<span style="${chipStyle}">WMU&nbsp;${id}` +
    `<span onclick="osSelMUs.delete('${id}');osRefreshMapStyles();osUpdateMUChips();osRenderPanel();" ` +
    `style="cursor:pointer;opacity:.55;font-size:14px;line-height:1;margin-left:2px" title="Remove">&times;</span></span>`
  ).join('');

  if (osSelMUs.size > 1) {
    row.innerHTML +=
      `<span onclick="osSelMUs.clear();osRefreshMapStyles();osUpdateMUChips();osRenderPanel();" ` +
      `style="font-size:11px;color:var(--text-muted);text-decoration:underline;cursor:pointer;padding:3px 6px">Clear all</span>`;
  }
}
window.osUpdateMUChips = osUpdateMUChips;

// ── FILTER DROPDOWN BUILD ─────────────────────────────────────
function osBuildFilters() {
  // Species — optgroup: Big Game first, then Small Game & Birds
  const specSel = document.getElementById('osSpeciesSel');
  if (specSel && !specSel.dataset.built) {
    const all = [...new Set(BC_OS_DATA.map(r => r.species))];
    const { big, small } = osSortedSpecies(all);
    let html = '<option value="">All Species</option>';
    if (big.length)   html += `<optgroup label="Big Game">${big.map(s   => `<option value="${s}">${s}</option>`).join('')}</optgroup>`;
    if (small.length) html += `<optgroup label="Small Game &amp; Birds">${small.map(s => `<option value="${s}">${s}</option>`).join('')}</optgroup>`;
    specSel.innerHTML = html;
    specSel.dataset.built = '1';
  }

  // Weapon type
  const wpnSel = document.getElementById('osWeaponSel');
  if (wpnSel && !wpnSel.dataset.built) {
    const weapons = [...new Set(BC_OS_DATA.map(r => r.weapon_type))].filter(Boolean).sort();
    wpnSel.innerHTML = '<option value="">All Methods</option>' +
      weapons.map(w => `<option value="${w}">${w}</option>`).join('');
    wpnSel.dataset.built = '1';
  }

  // Month
  const monSel = document.getElementById('osMonthSel');
  if (monSel && !monSel.dataset.built) {
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    monSel.innerHTML = '<option value="">Any Month</option>' +
      months.map((m, i) => `<option value="${String(i + 1).padStart(2, '0')}">${m}</option>`).join('');
    monSel.dataset.built = '1';
  }
}

// ── ACCORDION TOGGLE ─────────────────────────────────────────
function osToggleCard(id) {
  const body    = document.getElementById('osbody-' + id);
  const chevron = document.getElementById('oschev-' + id);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
window.osToggleCard = osToggleCard;

// ── WEAPON BADGE STYLE ────────────────────────────────────────
function osWeaponBadge(w) {
  const styles = {
    'Bow Only':   { color:'#a78bfa', border:'rgba(167,139,250,.4)', bg:'rgba(167,139,250,.08)' },
    'Youth Only': { color:'#f59e0b', border:'rgba(245,158,11,.4)',  bg:'rgba(245,158,11,.08)'  },
    'Shotgun':    { color:'#60a5fa', border:'rgba(96,165,250,.4)',  bg:'rgba(96,165,250,.08)'  },
    'Rifle':      { color:'var(--text-muted)', border:'var(--border)', bg:'rgba(255,255,255,.04)' },
  };
  const s = styles[w] || styles['Rifle'];
  return `<span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:.04em;` +
    `text-transform:uppercase;padding:2px 8px;border-radius:20px;` +
    `color:${s.color};border:1px solid ${s.border};background:${s.bg};white-space:nowrap">${w || 'Rifle'}</span>`;
}

// ── RENDER PANEL ─────────────────────────────────────────────
function osRenderPanel() {
  const panel   = document.getElementById('osResultsPanel');
  const countEl = document.getElementById('osResultsCount');
  if (!panel) return;

  const filtered = osGetFiltered();
  const total    = filtered.length;

  if (countEl) {
    countEl.textContent = total > 0
      ? `${total} season${total !== 1 ? 's' : ''} found`
      : 'No seasons match filters';
  }

  if (total === 0) {
    panel.innerHTML =
      '<div style="padding:56px 24px;text-align:center">' +
        '<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px">No seasons match your filters</div>' +
        '<div style="font-size:12px;color:var(--text-muted);line-height:1.6">Try adjusting the species, method, or month filters,<br>or click a highlighted WMU on the map.</div>' +
      '</div>';
    return;
  }

  // Group rows by species
  const bySpecies = {};
  filtered.forEach(row => {
    if (!bySpecies[row.species]) bySpecies[row.species] = [];
    bySpecies[row.species].push(row);
  });

  const allSpecies = Object.keys(bySpecies);
  const { big, small } = osSortedSpecies(allSpecies);
  const groups = [
    { label: 'Big Game',           list: big   },
    { label: 'Small Game & Birds', list: small  },
  ].filter(g => g.list.length > 0);

  // Shared style tokens
  const S = {
    card:     'background:var(--bg-card);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:8px',
    header:   'display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;user-select:none',
    title:    'font-size:14px;font-weight:700;color:var(--text);flex:1;min-width:0',
    pill:     'font-size:11px;color:var(--text-muted);background:rgba(255,255,255,.06);padding:2px 9px;border-radius:20px;white-space:nowrap',
    count:    'font-size:11px;color:var(--text-muted);white-space:nowrap',
    chevron:  'font-size:11px;color:var(--text-muted);transition:transform .18s;flex-shrink:0',
    divider:  'border-top:1px solid var(--border)',
    row:      'display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:11px 16px;border-bottom:1px solid rgba(255,255,255,.04)',
    rowLeft:  'flex:1;min-width:0',
    rowRight: 'flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:6px;padding-top:1px',
    classLbl: 'font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px',
    season:   'font-size:12px;color:var(--text-muted);margin-bottom:4px',
    muLine:   'font-size:11px;color:var(--text-muted);line-height:1.5',
    note:     'margin-top:6px;padding:5px 9px;background:rgba(196,122,26,.08);border-left:2px solid rgba(196,122,26,.5);border-radius:0 4px 4px 0;font-size:11px;color:rgba(196,122,26,.9);line-height:1.5',
    bagLmt:   'font-size:11px;color:var(--text-muted);text-align:right',
    sectionHd:'font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);padding:14px 4px 6px;opacity:.7',
  };

  let cardIndex = 0;
  let html = '';

  for (const group of groups) {
    html += `<div style="${S.sectionHd}">${group.label}</div>`;

    for (const sp of group.list) {
      const rows   = bySpecies[sp];
      const cid    = 'c' + cardIndex++;
      const isOpen = rows[0].season_open === 'No closed season';

      // Compact season range for header pill
      const nonClosed = rows.filter(r => r.season_open !== 'No closed season');
      const pill = nonClosed.length > 0
        ? nonClosed[0].season_open + (nonClosed.length > 1 ? ' \u2013 ' + nonClosed[nonClosed.length - 1].season_close : ' \u2013 ' + nonClosed[0].season_close)
        : 'No closed season';

      // Build row items
      const rowItems = rows.map((row, ri) => {
        const seasonStr = row.season_open === 'No closed season'
          ? '<span style="color:#4ade80;font-weight:600;font-size:12px">No closed season</span>'
          : `<span style="font-size:12px;color:var(--text)">${row.season_open}</span>` +
            `<span style="font-size:12px;color:var(--text-muted)"> \u2013 ${row.season_close}</span>`;

        const noteHTML = row.notes
          ? `<div style="${S.note}">${row.notes}</div>`
          : '';

        const rowBorder = ri > 0 ? 'border-top:1px solid rgba(255,255,255,.04);' : '';

        return `<div style="${S.row.replace('border-bottom:1px solid rgba(255,255,255,.04)', rowBorder + 'border-bottom:1px solid rgba(255,255,255,.04)')}">` +
          `<div style="${S.rowLeft}">` +
            `<div style="${S.classLbl}">${row.class || 'Any'}</div>` +
            `<div style="${S.season}">${seasonStr}</div>` +
            `<div style="${S.muLine}">${row.management_units}</div>` +
            noteHTML +
          `</div>` +
          `<div style="${S.rowRight}">` +
            osWeaponBadge(row.weapon_type) +
            `<div style="${S.bagLmt}">${row.bag_limit || '\u2014'}</div>` +
          `</div>` +
        `</div>`;
      }).join('');

      html +=
        `<div style="${S.card}">` +
          `<div style="${S.header}" onclick="osToggleCard('${cid}')">` +
            `<div style="${S.title}">${sp}</div>` +
            `<span style="${S.pill}">${pill}</span>` +
            `<span style="${S.count}">${rows.length}&nbsp;season${rows.length !== 1 ? 's' : ''}</span>` +
            `<svg id="oschev-${cid}" style="width:14px;height:14px;color:var(--text-muted);flex-shrink:0;transition:transform .18s" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` +
          `</div>` +
          `<div id="osbody-${cid}" style="display:none;${S.divider}">` +
            rowItems +
          `</div>` +
        `</div>`;
    }
  }

  panel.innerHTML = html;
}
window.osRenderPanel = osRenderPanel;

// ── FILTER CHANGE HANDLERS ────────────────────────────────────
function osOnSpecies(v) { osSelSpecies = v; osRefreshMapStyles(); osRenderPanel(); }
function osOnWeapon(v)  { osSelWeapon  = v; osRefreshMapStyles(); osRenderPanel(); }
function osOnMonth(v)   { osSelMonth   = v; osRefreshMapStyles(); osRenderPanel(); }

function osClearAll() {
  osSelSpecies = ''; osSelWeapon = ''; osSelMonth = '';
  ['osSpeciesSel','osWeaponSel','osMonthSel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  osSelMUs.clear();
  osRefreshMapStyles();
  osUpdateMUChips();
  osRenderPanel();
}

window.osOnSpecies = osOnSpecies;
window.osOnWeapon  = osOnWeapon;
window.osOnMonth   = osOnMonth;
window.osClearAll  = osClearAll;

// ── PAGE ENTRY POINT ─────────────────────────────────────────
function initOpenSeasonsPage() {
  osBuildFilters();
  osRenderPanel();
  setTimeout(() => {
    if (!osMapInitialized) {
      osInitMap();
    } else if (osMapInstance) {
      osMapInstance.invalidateSize();
      osRefreshMapStyles();
    }
    osUpdateMUChips();
  }, 80);
}
window.initOpenSeasonsPage = initOpenSeasonsPage;
