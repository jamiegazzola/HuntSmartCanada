import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const TARGET_URL = process.env.HUNTSMART_LIVE_URL || 'https://huntsmartcanada.netlify.app/';
const OUT_DIR = path.resolve(process.env.HUNTSMART_PROMO_OUT || 'promo-output-live-desktop');
fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function safe(page, fn, arg) {
  try { return await page.evaluate(fn, arg); }
  catch (e) { console.log('[promo] non-fatal:', e?.message || e); return null; }
}

async function injectPromoUI(page) {
  await safe(page, () => {
    if (document.getElementById('hs-live-desktop-promo-style')) return;
    const style = document.createElement('style');
    style.id = 'hs-live-desktop-promo-style';
    style.textContent = `
      html,body{scrollbar-width:none!important}body::-webkit-scrollbar{display:none!important}
      #hsPromoCaption{position:fixed;left:52px;bottom:42px;z-index:2147483646;pointer-events:none;max-width:760px;padding:16px 20px;border-radius:16px;background:linear-gradient(180deg,rgba(8,12,9,.12),rgba(8,12,9,.82));backdrop-filter:blur(10px);box-shadow:0 14px 42px rgba(0,0,0,.28);opacity:0;transform:translateY(10px);transition:opacity .25s ease,transform .25s ease;color:#fff;font-family:'DM Sans',system-ui,sans-serif}
      #hsPromoCaption.show{opacity:1;transform:translateY(0)}
      #hsPromoCaption .k{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#74df91;margin-bottom:5px}
      #hsPromoCaption .t{font-size:34px;line-height:1.05;letter-spacing:-.035em;font-weight:800;text-shadow:0 2px 12px rgba(0,0,0,.5)}
      .hsPromoFocus{outline:3px solid rgba(116,223,145,.9)!important;outline-offset:4px!important;box-shadow:0 0 0 9px rgba(116,223,145,.08),0 18px 55px rgba(0,0,0,.35)!important}
    `;
    document.head.appendChild(style);
    const cap = document.createElement('div');
    cap.id = 'hsPromoCaption';
    cap.innerHTML = '<div class="k"></div><div class="t"></div>';
    document.body.appendChild(cap);
  });
}

async function caption(page, kicker, title) {
  await safe(page, ({ kicker, title }) => {
    const el = document.getElementById('hsPromoCaption');
    if (!el) return;
    el.querySelector('.k').textContent = kicker;
    el.querySelector('.t').textContent = title;
    el.classList.add('show');
  }, { kicker, title });
}

async function clearCaption(page) {
  await safe(page, () => document.getElementById('hsPromoCaption')?.classList.remove('show'));
  await sleep(280);
}

async function homeScene(page) {
  await safe(page, () => {
    if (typeof showPage === 'function') showPage('home');
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await caption(page, 'HuntSmart Canada', 'Know your odds before you apply.');
  await sleep(2400);
  await safe(page, () => window.scrollTo({ top: 430, behavior: 'smooth' }));
  await sleep(1500);
  await clearCaption(page);
}

async function mapScene(page) {
  await safe(page, () => {
    if (typeof showPage === 'function') showPage('map');
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForSelector('#fullMapLeaflet', { state: 'visible', timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => {
    try { return typeof fullMapInstance !== 'undefined' && fullMapInstance && fullMapInstance.loaded(); }
    catch (_) { return false; }
  }, null, { timeout: 30000 }).catch(() => {});

  await caption(page, '3D E-scouting', 'Explore real terrain in the live HuntSmart map.');

  await safe(page, () => {
    try {
      if (typeof fullMapSetTile === 'function') fullMapSetTile('satellite');
    } catch (_) {}
  });
  await sleep(1900);

  await safe(page, () => {
    try {
      if (typeof fullMapInstance !== 'undefined' && fullMapInstance) {
        fullMapInstance.flyTo({
          center: [-121.75, 49.62],
          zoom: 8.8,
          pitch: 62,
          bearing: -24,
          duration: 3000,
          essential: true
        });
      }
    } catch (_) {}
  });
  await sleep(3300);

  await safe(page, () => {
    try {
      if (typeof fullMapInstance !== 'undefined' && fullMapInstance) {
        fullMapInstance.easeTo({ zoom: 9.5, pitch: 66, bearing: 28, duration: 2600, essential: true });
      }
    } catch (_) {}
  });
  await sleep(2900);
  await clearCaption(page);
}

async function filterScene(page) {
  await safe(page, () => {
    if (typeof showPage === 'function') showPage('filter');
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await sleep(1000);
  await caption(page, 'Draw intelligence', 'Filter BC draws by species, odds and success.');

  const elk = page.locator('#fpSpeciesChips button, #fpSpeciesChips .fp-chip, #fpSpeciesChips [role="button"]').filter({ hasText: /elk/i }).first();
  if (await elk.count()) {
    await elk.click({ timeout: 2500 }).catch(() => {});
    await sleep(900);
  }

  const odds = page.locator('#fpOddsSlider').first();
  if (await odds.count()) {
    await odds.evaluate(el => {
      el.value = '3';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }).catch(() => {});
  }
  await sleep(1100);

  await safe(page, () => window.scrollTo({ top: 520, behavior: 'smooth' }));
  await sleep(1600);

  const card = page.locator('.draw-card, .leh-card, [class*="draw-card"], [class*="hunt-card"]').first();
  if (await card.count()) {
    await card.scrollIntoViewIfNeeded().catch(() => {});
    await card.evaluate(el => el.classList.add('hsPromoFocus')).catch(() => {});
    await sleep(1700);
    await card.evaluate(el => el.classList.remove('hsPromoFocus')).catch(() => {});
  }
  await clearCaption(page);
}

async function endScene(page) {
  await safe(page, () => {
    if (typeof showPage === 'function') showPage('home');
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await sleep(500);
  await caption(page, 'HuntSmart Canada', 'Data. Maps. Terrain. One place.');
  await sleep(2200);
}

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader-webgl','--ignore-gpu-blocklist']
});

const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  screen: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
  recordVideo: { dir: OUT_DIR, size: { width: 1920, height: 1080 } }
});

const page = await context.newPage();
page.on('console', msg => console.log(`[browser:${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => console.log('[browser:error]', err.message));

console.log('[promo] opening LIVE app', TARGET_URL);
await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => typeof window.showPage === 'function', null, { timeout: 30000 }).catch(() => {});
await page.keyboard.press('Escape').catch(() => {});
await injectPromoUI(page);
await sleep(1800);

await homeScene(page);
await mapScene(page);
await filterScene(page);
await endScene(page);

const video = page.video();
await page.close();
await context.close();
await browser.close();

if (!video) throw new Error('No video was created');
const rawPath = await video.path();
const finalRaw = path.join(OUT_DIR, 'huntsmart-live-desktop-promo-raw.webm');
if (path.resolve(rawPath) !== path.resolve(finalRaw)) fs.renameSync(rawPath, finalRaw);
console.log('[promo] raw desktop video:', finalRaw);
