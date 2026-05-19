// stripe.js — HuntSmart Canada
// Handles: trial start, paywall, checkout redirect, subscription state

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-functions.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// ── Firebase config (same project as auth.js) ────────────────
const firebaseConfig = {
  apiKey: "AIzaSyD-placeholder-will-be-read-from-auth-js",
  authDomain: "huntsmart-canada.firebaseapp.com",
  projectId: "huntsmart-canada",
  storageBucket: "huntsmart-canada.appspot.com",
  messagingSenderId: "342472703908",
  appId: "1:342472703908:web:f9ca542982549d4e1d8b31"
};

// Re-use existing Firebase app if already initialized by auth.js
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const functions = getFunctions(app, "us-central1");
const db = getFirestore(app);
const auth = getAuth(app);

// ── Callable refs ─────────────────────────────────────────────
const _startFreeTrial        = httpsCallable(functions, "startFreeTrial");
const _createCheckoutSession = httpsCallable(functions, "createCheckoutSession");

// ── Subscription state ────────────────────────────────────────
let _subStatus = null;
let _trialEnd  = null;
let _unsubscribe = null;

// ─────────────────────────────────────────────────────────────
// Boot — watch auth, then watch Firestore subscription doc
// ─────────────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (_unsubscribe) _unsubscribe();

  if (!user) {
    _subStatus = null;
    _trialEnd  = null;
    updateTrialBar();
    return;
  }

  _unsubscribe = onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};
    _subStatus = data.subscriptionStatus || "none";
    _trialEnd  = data.trialEndDate?.toDate() || null;
    updateTrialBar();
    checkUrlForStripeReturn();
  });
});

// ─────────────────────────────────────────────────────────────
// hasAccess() — call this anywhere you gate features
// ─────────────────────────────────────────────────────────────
export function hasAccess() {
  return _subStatus === "active" || _subStatus === "trialing";
}

function getTrialDaysLeft() {
  if (_subStatus !== "trialing" || !_trialEnd) return null;
  return Math.max(0, Math.ceil((_trialEnd - new Date()) / 86400000));
}

// ─────────────────────────────────────────────────────────────
// Trial bar
// ─────────────────────────────────────────────────────────────
function updateTrialBar() {
  const bar = document.getElementById("hsTrialBar");
  const daysEl = document.getElementById("hsTrialDaysLeft");
  if (!bar) return;

  if (_subStatus === "trialing") {
    const days = getTrialDaysLeft();
    if (daysEl) daysEl.textContent = days;
    bar.style.display = "block";
  } else {
    bar.style.display = "none";
  }
}

// ─────────────────────────────────────────────────────────────
// showPaywall() — call instead of showing gated content
// ─────────────────────────────────────────────────────────────
export function showPaywall() {
  if (document.getElementById("hs-paywall")) return;

  const isTrialing = _subStatus === "trialing";
  const daysLeft   = getTrialDaysLeft();

  const overlay = document.createElement("div");
  overlay.id = "hs-paywall";
  overlay.innerHTML = `
    <div class="hs-paywall-backdrop" onclick="window._hsClosePaywall()"></div>
    <div class="hs-paywall-modal">
      <button class="hs-paywall-close" onclick="window._hsClosePaywall()">✕</button>

      ${isTrialing ? `<div class="hs-trial-badge">⏳ ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left in your trial</div>` : ""}

      <div class="hs-paywall-logo">
        <img src="Images/logo.png" alt="HuntSmart Canada" class="hs-paywall-logo-img" />
        <div class="hs-pro-badge">PRO</div>
      </div>
      <h2 class="hs-paywall-title">Unlock HuntSmart PRO</h2>
      <p class="hs-paywall-sub">Full access to BC & Alberta draw odds, saved draws, compare tool, WMU maps, and filters.</p>

      <div class="hs-plan-toggle">
        <button id="hsPlanMonthly" class="hs-plan-btn active" onclick="window._hsSelectPlan('monthly')">Monthly</button>
        <button id="hsPlanYearly"  class="hs-plan-btn"        onclick="window._hsSelectPlan('yearly')">
          Yearly <span class="hs-save-badge">Save 30%</span>
        </button>
      </div>

      <div class="hs-price-display">
        <div id="hsPriceMonthly">
          <span class="hs-price-amount">$2.99</span>
          <span class="hs-price-period">CAD / month</span>
        </div>
        <div id="hsPriceYearly" style="display:none">
          <span class="hs-price-amount">$24.99</span>
          <span class="hs-price-period">CAD / year</span>
          <div class="hs-price-equiv">that's just $2.08/mo</div>
        </div>
      </div>

      ${isTrialing ? `
        <button class="hs-cta-btn" onclick="window._hsGoToCheckout('pay')">Subscribe Now</button>
      ` : `
        <button class="hs-cta-btn" onclick="window._hsGoToCheckout('trial')">Try Free for 7 Days</button>
        <p class="hs-no-card">No credit card required to start</p>
        <button class="hs-cta-btn hs-cta-btn-outline" onclick="window._hsGoToCheckout('pay')">Subscribe Now</button>
      `}

      <ul class="hs-features">
        <li>✓ BC & Alberta draw odds</li>
        <li>✓ Save & compare draws</li>
        <li>✓ WMU map filters</li>
        <li>✓ Draw history & trend charts</li>
        <li>✓ Personal odds calculator (AB)</li>
      </ul>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("hs-visible"));
}

// ── Paywall helpers exposed to inline onclick ─────────────────
window._hsClosePaywall = () => {
  document.getElementById("hs-paywall")?.remove();
};

let _selectedPlan = "monthly";
window._hsSelectPlan = (plan) => {
  _selectedPlan = plan;
  document.getElementById("hsPlanMonthly").classList.toggle("active", plan === "monthly");
  document.getElementById("hsPlanYearly").classList.toggle("active", plan === "yearly");
  document.getElementById("hsPriceMonthly").style.display = plan === "monthly" ? "block" : "none";
  document.getElementById("hsPriceYearly").style.display  = plan === "yearly"  ? "block" : "none";
};

window._hsGoToCheckout = async (mode = "trial") => {
  const user = auth.currentUser;
  if (!user) {
    window._hsClosePaywall();
    if (typeof openAuthModal === "function") openAuthModal();
    return;
  }

  if (mode === "pay" || _subStatus === "trialing") {
    // Go straight to Stripe checkout
    await redirectToCheckout(_selectedPlan);
    return;
  }

  // Start free trial — no card needed
  try {
    _showLoading("Starting your free trial…");
    await _startFreeTrial();
    // Optimistically grant access immediately
    _subStatus = "trialing";
    _trialEnd  = new Date(Date.now() + 7 * 86400000);
    _hideLoading();
    window._hsClosePaywall();
    updateTrialBar();
    _showBanner("🎉 Your 7-day free trial has started!");
    // Navigate to map now that access is granted
    if (typeof showPage === "function") showPage("map");
  } catch (err) {
    _hideLoading();
    if (err.code === "already-exists") {
      // Already had a trial — just grant access
      _subStatus = "trialing";
      window._hsClosePaywall();
      if (typeof showPage === "function") showPage("map");
    } else {
      _showBanner("Something went wrong. Please try again.", "error");
      console.error(err);
    }
  }
};

// ─────────────────────────────────────────────────────────────
// redirectToCheckout(plan) — sends user to Stripe Checkout
// ─────────────────────────────────────────────────────────────
export async function redirectToCheckout(plan = "monthly") {
  try {
    _showLoading("Loading secure checkout…");
    const result = await _createCheckoutSession({
      plan,
      returnUrl: window.location.href.split("?")[0],
    });
    window.location.href = result.data.url;
  } catch (err) {
    _hideLoading();
    _showBanner("Checkout failed. Please try again.", "error");
    console.error(err);
  }
}

// ─────────────────────────────────────────────────────────────
// checkUrlForStripeReturn — handles redirect back from Stripe
// ─────────────────────────────────────────────────────────────
function checkUrlForStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  if (status === "success") {
    window.history.replaceState({}, "", window.location.pathname);
    _showBanner("✅ You're subscribed! Welcome to HuntSmart PRO.");
    // Navigate to map after successful payment
    setTimeout(() => { if (typeof showPage === "function") showPage("map"); }, 500);
  } else if (status === "cancelled") {
    window.history.replaceState({}, "", window.location.pathname);
  }
}

// ── UI helpers ────────────────────────────────────────────────
function _showLoading(msg) {
  let el = document.getElementById("hs-loading");
  if (!el) {
    el = document.createElement("div");
    el.id = "hs-loading";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = "flex";
}

function _hideLoading() {
  document.getElementById("hs-loading")?.style.setProperty("display", "none");
}

function _showBanner(msg, type = "success") {
  const el = document.createElement("div");
  el.className = `hs-banner hs-banner-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

// ─────────────────────────────────────────────────────────────
// Make showPaywall globally accessible so other JS files can
// call it without needing to import this module
// ─────────────────────────────────────────────────────────────
window.showPaywall = showPaywall;
window.hasAccess   = hasAccess;
