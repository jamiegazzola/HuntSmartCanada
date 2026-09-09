// stripe.js — HuntSmart Canada preview billing bridge
// Preview-safe RevenueCat integration. Real checkout remains disabled here.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { BILLING_CONFIG } from "./billing-config.js";

const firebaseConfig = {
  apiKey: "AIzaSyDgiLQD2MVdX-OoeviFpQSRPT6isZNJVVQ",
  authDomain: "huntsmart-canada.firebaseapp.com",
  projectId: "huntsmart-canada",
  storageBucket: "huntsmart-canada.firebasestorage.app",
  messagingSenderId: "342472703908",
  appId: "1:342472703908:web:f9ca542982549d4e1d8b31",
  measurementId: "G-VK3HNNDEW2"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const ENTITLEMENT_ID = BILLING_CONFIG.entitlementId;
const RC_PUBLIC_API_KEY = BILLING_CONFIG.revenueCatPublicApiKey;
const PREVIEW_GRANTS_ACCESS = BILLING_CONFIG.previewGrantsAccess;

let purchases = null;
let configuredUid = null;
let hasPremiumEntitlement = false;
let selectedPlan = "yearly";
let sdkPromise = null;
let lastCustomerInfo = null;

function revenueCatConfigured() {
  return /^(rcb_sb_|rcb_)/.test(RC_PUBLIC_API_KEY || "");
}

function formatCad(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2
  }).format(value);
}

async function loadRevenueCatSdk() {
  if (window.Purchases?.Purchases) return window.Purchases.Purchases;
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = BILLING_CONFIG.revenueCatSdkUrl;
    script.async = true;
    script.dataset.hsRevenuecat = "1";
    script.onload = () => {
      if (window.Purchases?.Purchases) resolve(window.Purchases.Purchases);
      else reject(new Error("RevenueCat SDK loaded without the Purchases API."));
    };
    script.onerror = () => reject(new Error("RevenueCat SDK failed to load."));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

async function ensureRevenueCat(user = auth.currentUser) {
  if (!user || !revenueCatConfigured()) return null;
  const Purchases = await loadRevenueCatSdk();

  if (!purchases) {
    purchases = Purchases.configure({
      apiKey: RC_PUBLIC_API_KEY,
      // Cross-platform identity rule: RevenueCat App User ID === Firebase Auth UID.
      appUserId: user.uid
    });
    configuredUid = user.uid;
  } else if (configuredUid !== user.uid && typeof purchases.changeUser === "function") {
    await purchases.changeUser(user.uid);
    configuredUid = user.uid;
  }

  return purchases;
}

function entitlementActive(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
}

export async function refreshEntitlements() {
  const user = auth.currentUser;
  if (!user || !revenueCatConfigured()) {
    hasPremiumEntitlement = false;
    lastCustomerInfo = null;
    publishState();
    return hasAccess();
  }

  try {
    const rc = await ensureRevenueCat(user);
    const customerInfo = await rc.getCustomerInfo();
    lastCustomerInfo = customerInfo;
    hasPremiumEntitlement = entitlementActive(customerInfo);
  } catch (err) {
    console.warn("[billing-preview] RevenueCat entitlement refresh failed:", err);
  }

  publishState();
  return hasAccess();
}

// Existing feature gates can keep using this synchronous helper.
export function hasAccess() {
  if (BILLING_CONFIG.mode === "preview" && PREVIEW_GRANTS_ACCESS) return true;
  return hasPremiumEntitlement;
}

function currentState() {
  return {
    mode: BILLING_CONFIG.mode,
    revenueCatConfigured: revenueCatConfigured(),
    entitlementId: ENTITLEMENT_ID,
    firebaseUid: auth.currentUser?.uid || null,
    revenueCatUid: configuredUid,
    entitlementActive: hasPremiumEntitlement,
    accessGranted: hasAccess(),
    checkoutEnabled: false,
    customerInfo: lastCustomerInfo
  };
}

function publishState() {
  window.HS = window.HS || {};
  window.HS.billing = window.HS.billing || {};
  window.HS.billing.state = currentState();
  window.dispatchEvent(new CustomEvent("huntsmart:billing-state", { detail: window.HS.billing.state }));
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    hasPremiumEntitlement = false;
    lastCustomerInfo = null;
    publishState();
    hideTrialBar();
    return;
  }

  await refreshEntitlements();
  hideTrialBar();
});

function hideTrialBar() {
  const bar = document.getElementById("hsTrialBar");
  if (bar) bar.style.display = "none";
}

export function showPaywall() {
  if (document.getElementById("hs-paywall")) return;

  const monthly = formatCad(BILLING_CONFIG.monthlyPriceCad);
  const annual = formatCad(BILLING_CONFIG.annualPriceCad);
  const annualMonthly = formatCad(BILLING_CONFIG.annualPriceCad / 12);
  const rcStatus = revenueCatConfigured()
    ? "RevenueCat Preview Connected"
    : "Preview Mode · RevenueCat Key Pending";

  const overlay = document.createElement("div");
  overlay.id = "hs-paywall";
  overlay.innerHTML = `
    <div class="hs-paywall-backdrop" onclick="window._hsClosePaywall()"></div>
    <div class="hs-paywall-modal">
      <button class="hs-paywall-close" onclick="window._hsClosePaywall()">✕</button>
      <div class="hs-trial-badge">${rcStatus}</div>

      <div class="hs-paywall-logo">
        <img src="Images/logo.png" alt="HuntSmart Canada" class="hs-paywall-logo-img" />
        <div class="hs-pro-badge">PRO</div>
      </div>

      <h2 class="hs-paywall-title">Unlock HuntSmart Premium</h2>
      <p class="hs-paywall-sub">Advanced LEH research, premium mapping, terrain tools, travel-time analysis, and future premium e-scouting features.</p>

      <div class="hs-plan-toggle">
        <button id="hsPlanMonthly" class="hs-plan-btn" onclick="window._hsSelectPlan('monthly')">Monthly</button>
        <button id="hsPlanYearly" class="hs-plan-btn active" onclick="window._hsSelectPlan('yearly')">Annual <span class="hs-save-badge">Best Value</span></button>
      </div>

      <div class="hs-price-display">
        <div id="hsPriceMonthly" style="display:none">
          <span class="hs-price-amount">${monthly}</span>
          <span class="hs-price-period">CAD / month</span>
        </div>
        <div id="hsPriceYearly">
          <span class="hs-price-amount">${annual}</span>
          <span class="hs-price-period">CAD / year</span>
          <div class="hs-price-equiv">about ${annualMonthly}/mo</div>
        </div>
      </div>

      <button class="hs-cta-btn" onclick="window._hsContinueFree()">Continue Free in Preview</button>
      <p class="hs-no-card">Preview-safe: no real checkout or charge can run here.</p>
      <button class="hs-cta-btn hs-cta-btn-outline" onclick="window._hsPreviewCheckout()">Preview Subscription Flow</button>

      <ul class="hs-features">
        <li>✓ Advanced BC & Alberta draw analytics</li>
        <li>✓ Premium Mapbox layers and interaction</li>
        <li>✓ Terrain and e-scouting tools</li>
        <li>✓ Travel-time analysis</li>
        <li>✓ Cross-platform premium entitlement</li>
      </ul>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("hs-visible"));
}

window._hsClosePaywall = () => document.getElementById("hs-paywall")?.remove();

window._hsSelectPlan = (plan) => {
  selectedPlan = plan === "monthly" ? "monthly" : "yearly";
  document.getElementById("hsPlanMonthly")?.classList.toggle("active", selectedPlan === "monthly");
  document.getElementById("hsPlanYearly")?.classList.toggle("active", selectedPlan === "yearly");
  const monthly = document.getElementById("hsPriceMonthly");
  const yearly = document.getElementById("hsPriceYearly");
  if (monthly) monthly.style.display = selectedPlan === "monthly" ? "block" : "none";
  if (yearly) yearly.style.display = selectedPlan === "yearly" ? "block" : "none";
};

window._hsContinueFree = () => {
  window._hsClosePaywall();
  showBanner("HuntSmart Premium remains unlocked on the preview site.");
  if (typeof window.showPage === "function") window.showPage("map");
};

window._hsPreviewCheckout = () => {
  const message = revenueCatConfigured()
    ? `RevenueCat entitlement checks are connected. ${selectedPlan === "yearly" ? "Annual" : "Monthly"} checkout is intentionally disabled in preview.`
    : "RevenueCat code is wired. Add the RevenueCat sandbox public key to test entitlement syncing.";
  showBanner(message);
};

// Retain old HuntSmart hooks, but never execute a transaction from preview.
window._hsGoToCheckout = window._hsPreviewCheckout;
export async function redirectToCheckout(plan = "yearly") {
  selectedPlan = plan === "monthly" ? "monthly" : "yearly";
  window._hsPreviewCheckout();
  return { preview: true, plan: selectedPlan };
}

function showBanner(msg, type = "success") {
  document.querySelector(".hs-banner")?.remove();
  const el = document.createElement("div");
  el.className = `hs-banner hs-banner-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

window.showPaywall = showPaywall;
window.hasAccess = hasAccess;
window.startFreeTrial = showPaywall;
window.HS = window.HS || {};
window.HS.billing = {
  refreshEntitlements,
  getState: currentState,
  state: currentState()
};

function patchShowPageForPaywall() {
  if (typeof window.showPage !== "function" || window.showPage._hsPaywallPatched) return;
  const originalShowPage = window.showPage;
  function patchedShowPage(page, ...args) {
    if (page === "paywall") {
      showPaywall();
      return;
    }
    return originalShowPage.call(this, page, ...args);
  }
  patchedShowPage._hsPaywallPatched = true;
  window.showPage = patchedShowPage;
}

patchShowPageForPaywall();
window.addEventListener("DOMContentLoaded", patchShowPageForPaywall);
const patchTimer = setInterval(patchShowPageForPaywall, 250);
setTimeout(() => clearInterval(patchTimer), 8000);

publishState();
