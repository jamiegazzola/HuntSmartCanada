import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const TARGET_URL = process.env.HUNTSMART_PROMO_URL || 'https://huntsmartcanada-preview.netlify.app/';
const OUT_DIR = path.resolve(process.env.HUNTSMART_PROMO_OUT || 'promo-output');
const SCENE_MS = Number(process.env.HUNTSMART_PROMO_SCENE_MS || 1800);

fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function safeEvaluate(page, fn, arg) {
  try { return await page.evaluate(fn, arg); } catch (err) {
    console.log('[promo] non-fatal evaluate error:', err?.message || err);
    return null;
  }
}

async function setCaption(page, title, kicker = '') {
  await safeEvaluate(page, ({ title, kicker }) => {
    let root = document.getElementById('hs-promo-caption');
    if (!root) {
      root = document.createElement('div');
      root.id = 'hs-promo-caption';
      root.innerHTML = '<div class="hs-promo-kicker"></div><div class="hs-promo-title"></div>';
      document.body.appendChild(root);
      const style = document.createElement('style');
      style.id = 'hs-promo-style';
      style.textContent = `
        html,body{scrollbar-width:none!important} body::-webkit-scrollbar{display:none!important}
        #hs-promo-caption{position:fixed;left:18px;right:18px;bottom:76px;z-index:2147483646;pointer-events:none;padding:14px 16px;border-radius:16px;background:linear-gradient(180deg,rgba(8,12,9,.16),rgba(8,12,9,.82));backdrop-filter:blur(8px);box-shadow:0 12px 34px rgba(0,0,0,.28);transform:translateY(10px);opacity:0;transition:opacity .32s ease,transform .32s ease;color:white;font-family:'DM Sans',system-ui,sans-serif}
        #hs-promo-caption.hs-show{opacity:1;transform:translateY(0)}
        #hs-promo-caption .hs-promo-kicker{font-size:10px;line-height:1.2;letter-spacing:.14em;text-transform:uppercase;color:#74df91;font-weight:800;margin-bottom:5px}
        #hs-promo-caption .hs-promo-title{font-size:24px;line-height:1.04;letter-spacing:-.03em;font-weight:800;text-shadow:0 2px 12px rgba(0,0,0,.45)}
      `;
      document.head.appendChild(style);
    }
    root.querySelector('.hs-promo-kicker').textContent = kicker;
    root.querySelector('.hs-promo-title').textContent = title;
    requestAnimationFrame(() => root.classList.add('hs-show'));
  }, { title, kicker });
}

async function clearCaption(page) {
  await safeEvaluate(page, () => {
    const root = document.getElementById('hs-promo-caption');
    if (root) root.classList.remove('hs-show');
  });
  await sleep(350);
}

async function waitForApp(page) {
  await page.waitForFunction(() => typeof window.showPage === 'function', null, { timeout: 30000 }).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
  await safeEvaluate(page, () => window.scrollTo({ top: 0, behavior: 'instant' }));
}

async function homeScene(page) {
  await setCaption(page, 'Know your odds. Scout smarter.', 'HuntSmart Canada');
  await sleep(SCENE_MS + 500);
  await safeEvaluate(page, () => window.scrollTo({ top: Math.min(520, document.body.scrollHeight * .2), behavior: 'smooth' }));
  await sleep(SCENE_MS);
  await clearCaption(page);
}

async function mapScene(page) {
  await safeEvaluate(page, () => {
    if (typeof showPage === 'function') showPage('map');
    window.scrollTo(0, 0);
  });

  await page.waitForSelector('#fullMapLeaflet', { state: 'visible', timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => {
    try { return typeof fullMapInstance !== 'undefined' && fullMapInstance && fullMapInstance.loaded(); }
    catch (_) { return false; }
  }, null, { timeout: 30000 }).catch(() => {});

  await setCaption(page, 'Real 3D terrain. Real hunt geography.', 'Interactive map');

  await safeEvaluate(page, () => {
    try {
      if (typeof fullMapSetTile === 'function') fullMapSetTile('satellite');
    } catch (_) {}
  });
  await sleep(1500);

  await safeEvaluate(page, () => {
    try {
      if (typeof fullMapToggle3D === 'function') {
        if (typeof _fullMapTerrain3D === 'undefined' || !_fullMapTerrain3D) fullMapToggle3D();
      }
      if (typeof fullMapInstance !== 'undefined' && fullMapInstance) {
        fullMapInstance.flyTo({
          center: [-121.78, 49.58],
          zoom: 8.35,
          pitch: 63,
          bearing: -28,
          duration: 3200,
          essential: true
        });
      }
    } catch (_) {}
  });
  await sleep(3600);

  await clearCaption(page);
  await setCaption(page, 'Rotate, zoom and read the country before you go.', '3D e-scouting');
  await safeEvaluate(page, () => {
    try {
      if (typeof fullMapInstance !== 'undefined' && fullMapInstance) {
        fullMapInstance.easeTo({ bearing: 34, pitch: 68, zoom: 9.1, duration: 3000, essential: true });
      }
    } catch (_) {}
  });
  await sleep(3300);
  await clearCaption(page);
}

async function filterScene(page) {
  await safeEvaluate(page, () => {
    if (typeof showPage === 'function') showPage('filter');
    window.scrollTo(0, 0);
  });
  await sleep(1600);
  await setCaption(page, 'Filter thousands of draws in seconds.', 'Draw intelligence');

  const elkButton = page.locator('#fpSpeciesChips button, #fpSpeciesChips .fp-chip').filter({ hasText: /elk/i }).first();
  if (await elkButton.count()) {
    await elkButton.click({ timeout: 3000 }).catch(() => {});
    await sleep(1200);
  }

  const oddsSlider = page.locator('#fpOddsSlider').first();
  if (await oddsSlider.count()) {
    await oddsSlider.evaluate(el => {
      el.value = '3';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }).catch(() => {});
  }
  await sleep(1800);

  const findButton = page.getByRole('button', { name: /find|show|view.*hunt|apply/i }).first();
  if (await findButton.count()) {
    await findButton.click({ timeout: 2500 }).catch(() => {});
    await sleep(1700);
  } else {
    await safeEvaluate(page, () => window.scrollTo({ top: 560, behavior: 'smooth' }));
    await sleep(1600);
  }
  await clearCaption(page);
}

async function dataScene(page) {
  await setCaption(page, 'Draw history + harvest success, together.', 'Make better applications');
  const card = page.locator('.draw-card, .leh-card, [class*="draw-card"], [class*="hunt-card"]').first();
  if (await card.count()) {
    await card.scrollIntoViewIfNeeded().catch(() => {});
    await sleep(1200);
    await card.click({ timeout: 2500 }).catch(() => {});
    await sleep(2100);
  } else {
    await safeEvaluate(page, () => window.scrollBy({ top: 460, behavior: 'smooth' }));
    await sleep(2100);
  }
  await clearCaption(page);
}

async function endScene(page) {
  await safeEvaluate(page, () => {
    if (typeof showPage === 'function') showPage('home');
    window.scrollTo(0, 0);
  });
  await sleep(800);
  await setCaption(page, 'HuntSmart Canada', 'Data · Maps · Terrain');
  await sleep(2200);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 432, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  recordVideo: { dir: OUT_DIR, size: { width: 1080, height: 1920 } }
});

const page = await context.newPage();
page.on('console', msg => console.log(`[browser:${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => console.log('[browser:error]', err.message));

console.log('[promo] opening', TARGET_URL);
await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await waitForApp(page);
await sleep(2200);

await homeScene(page);
await mapScene(page);
await filterScene(page);
await dataScene(page);
await endScene(page);

const video = page.video();
await page.close();
await context.close();
await browser.close();

if (!video) throw new Error('Playwright did not create a video');
const rawPath = await video.path();
const finalRaw = path.join(OUT_DIR, 'huntsmart-promo-raw.webm');
if (path.resolve(rawPath) !== path.resolve(finalRaw)) fs.renameSync(rawPath, finalRaw);
console.log('[promo] raw video:', finalRaw);
