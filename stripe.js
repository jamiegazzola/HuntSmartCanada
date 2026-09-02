// stripe.js — HuntSmart Canada
// PRO preview mode.
// Shows the HuntSmart PRO paywall/pricing, but does NOT start trials,
// does NOT create Stripe Checkout sessions, and does NOT charge anyone.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ─────────────────────────────────────────────────────────────
// PAYMENT SAFETY SWITCH
// Leave this false until you are ready to actually charge users.
// In preview mode, all PRO buttons stay visible but no Stripe calls run.
// ─────────────────────────────────────────────────────────────
const PAYMENTS_LIVE = false;
const PREVIEW_GRANTS_ACCESS = true;

// ── Firebase config — same project as auth.js ─────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDgiLQD2MVdX-OoeviFpQSRPT6isZNJVVQ",
  authDomain: "huntsmart-canada.firebaseapp.com",
  projectId: "huntsmart-canada",
  storageBucket: "huntsmart-canada.firebasestorage.app",
  messagingSenderId: "342472703908",
  appId: "1:342472703908:web:f9ca542982549d4e1d8b31",
  measurementId: "G-VK3HNNDEW2"
};

// Re-use existing Firebase app if auth.js already initialized it.
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ── Subscription state ────────────────────────────────────────
let _subStatus = null;
let _trialEnd = null;
let _unsubscribe = null;
let _selectedPlan = "monthly";

// ─────────────────────────────────────────────────────────────
// Boot — watch auth, then watch Firestore subscription doc.
// In preview mode this is only used to keep future compatibility.
// Access is still granted while PREVIEW_GRANTS_ACCESS is true.
// ─────────────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (_unsubscribe) _unsubscribe();

  if (!user) {
    _subStatus = null;
    _trialEnd = null;
    updateTrialBar();
    return;
  }

  _unsubscribe = onSnapshot(
    doc(db, "users", user.uid),
    (snap) => {
      const data = snap.data() || {};
      _subStatus = data.subscriptionStatus || "none";
      _trialEnd = data.trialEndDate?.toDate ? data.trialEndDate.toDate() : null;
      updateTrialBar();
      checkUrlForStripeReturn();
    },
    (err) => {
      console.warn("[stripe-preview] subscription listener failed:", err);
      _subStatus = null;
      _trialEnd = null;
      updateTrialBar();
    }
  );
});

// ─────────────────────────────────────────────────────────────
// hasAccess() — call this anywhere you gate features.
// Preview mode keeps the full app open while payments are disabled.
// ─────────────────────────────────────────────────────────────
export function hasAccess() {
  if (!PAYMENTS_LIVE && PREVIEW_GRANTS_ACCESS) return true;
  return _subStatus === "active" || _subStatus === "trialing";
}

function getTrialDaysLeft() {
  if (_subStatus !== "trialing" || !_trialEnd) return null;
  return Math.max(0, Math.ceil((_trialEnd - new Date()) / 86400000));
}

// ─────────────────────────────────────────────────────────────
// Trial bar
// Hidden in preview mode so users are not confused by a fake countdown.
// ─────────────────────────────────────────────────────────────
function updateTrialBar() {
  const bar = document.getElementById("hsTrialBar");
  const daysEl = document.getElementById("hsTrialDaysLeft");
  if (!bar) return;

  if (!PAYMENTS_LIVE) {
    bar.style.display = "none";
    return;
  }

  if (_subStatus === "trialing") {
    const days = getTrialDaysLeft();
    if (daysEl) daysEl.textContent = days;
    bar.style.display = "block";
  } else {
    bar.style.display = "none";
  }
}

// ─────────────────────────────────────────────────────────────
// showPaywall() — visible PRO preview, no payment required.
// ─────────────────────────────────────────────────────────────
export function showPaywall() {
  if (document.getElementById("hs-paywall")) return;

  const isTrialing = PAYMENTS_LIVE && _subStatus === "trialing";
  const daysLeft = getTrialDaysLeft();

  const overlay = document.createElement("div");
  overlay.id = "hs-paywall";
  overlay.innerHTML = `
    <div class="hs-paywall-backdrop" onclick="window._hsClosePaywall()"></div>
    <div class="hs-paywall-modal">
      <button class="hs-paywall-close" onclick="window._hsClosePaywall()">✕</button>

      ${isTrialing ? `<div class="hs-trial-badge">⏳ ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left in your trial</div>` : ""}
      ${!PAYMENTS_LIVE ? `<div class="hs-trial-badge">Preview Mode · Payments Not Live Yet</div>` : ""}

      <div class="hs-paywall-logo">
        <img src="Images/logo.png" alt="HuntSmart Canada" class="hs-paywall-logo-img" />
        <div class="hs-pro-badge">PRO</div>
      </div>

      <h2 class="hs-paywall-title">Unlock HuntSmart PRO</h2>
      <p class="hs-paywall-sub">
        Full access to BC & Alberta draw odds, saved draws, compare tools, WMU maps, filters, and trend data.
        ${!PAYMENTS_LIVE ? "<br><br><strong style='color:#3aad52'>Payments are not turned on yet, so access is free for now.</strong>" : ""}
      </p>

      <div class="hs-plan-toggle">
        <button id="hsPlanMonthly" class="hs-plan-btn active" onclick="window._hsSelectPlan('monthly')">Monthly</button>
        <button id="hsPlanYearly" class="hs-plan-btn" onclick="window._hsSelectPlan('yearly')">
          Yearly <span class="hs-save-badge">Save 37%</span>
        </button>
      </div>

      <div class="hs-price-display">
        <div id="hsPriceMonthly">
          <span class="hs-price-amount">$3.99</span>
          <span class="hs-price-period">CAD / month</span>
        </div>
        <div id="hsPriceYearly" style="display:none">
          <span class="hs-price-amount">$29.99</span>
          <span class="hs-price-period">CAD / year</span>
          <div class="hs-price-equiv">that's just $2.50/mo</div>
        </div>
      </div>

      ${!PAYMENTS_LIVE ? `
        <button class="hs-cta-btn" onclick="window._hsContinueFree()">Continue Free</button>
        <p class="hs-no-card">No card required · Payments are currently disabled</p>
        <button class="hs-cta-btn hs-cta-btn-outline" onclick="window._hsPreviewCheckout()">Preview Plans Only</button>
      ` : isTrialing ? `
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

window._hsSelectPlan = (plan) => {
  _selectedPlan = plan === "yearly" ? "yearly" : "monthly";
  document.getElementById("hsPlanMonthly")?.classList.toggle("active", _selectedPlan === "monthly");
  document.getElementById("hsPlanYearly")?.classList.toggle("active", _selectedPlan === "yearly");

  const monthly = document.getElementById("hsPriceMonthly");
  const yearly = document.getElementById("hsPriceYearly");
  if (monthly) monthly.style.display = _selectedPlan === "monthly" ? "block" : "none";
  if (yearly) yearly.style.display = _selectedPlan === "yearly" ? "block" : "none";
};

window._hsContinueFree = () => {
  window._hsClosePaywall();
  _showBanner("HuntSmart PRO is free during preview mode.");
  if (typeof showPage === "function") showPage("map");
};

window._hsPreviewCheckout = () => {
  _showBanner("Payments are not live yet, so checkout is disabled for now.");
};

// This function intentionally does NOT call Stripe while PAYMENTS_LIVE is false.
window._hsGoToCheckout = async (mode = "trial") => {
  if (!PAYMENTS_LIVE) {
    window._hsClosePaywall();
    _showBanner("Payments are not live yet — HuntSmart PRO is free for now.");
    if (typeof showPage === "function") showPage("map");
    return;
  }

  // Future live-payment logic can be restored here when you are ready.
  console.warn("[stripe] Payments are disabled. No Stripe Checkout session was created.", { mode, plan: _selectedPlan });
};

// ─────────────────────────────────────────────────────────────
// redirectToCheckout(plan)
// Kept as an exported no-op so existing imports do not break.
// ─────────────────────────────────────────────────────────────
export async function redirectToCheckout(plan = "monthly") {
  console.warn("[stripe] Checkout blocked because PAYMENTS_LIVE is false.", { plan });
  _showBanner("Payments are not live yet — checkout is disabled for now.");
  return { preview: true, plan };
}

// ─────────────────────────────────────────────────────────────
// checkUrlForStripeReturn
// Cleans up old Stripe return params without implying payment happened.
// ─────────────────────────────────────────────────────────────
function checkUrlForStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  if (!status) return;

  if (status === "success") {
    window.history.replaceState({}, "", window.location.pathname);
    if (PAYMENTS_LIVE) {
      _showBanner("✅ You're subscribed! Welcome to HuntSmart PRO.");
      setTimeout(() => { if (typeof showPage === "function") showPage("map"); }, 500);
    } else {
      _showBanner("Payments are disabled right now, so no charge was processed.");
    }
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
  const existing = document.querySelector(".hs-banner");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.className = `hs-banner hs-banner-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

// ─────────────────────────────────────────────────────────────
// Make PRO helpers globally accessible for existing inline HTML.
// ─────────────────────────────────────────────────────────────
window.showPaywall = showPaywall;
window.hasAccess = hasAccess;

// Your homepage currently calls startFreeTrial() directly.
// In preview mode, make that open the PRO modal instead of calling Stripe.
window.startFreeTrial = () => {
  showPaywall();
};

// If any button calls showPage('paywall'), catch that and open the modal.
// This works even if showPage is defined later by another script.
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
const _patchTimer = setInterval(patchShowPageForPaywall, 250);
setTimeout(() => clearInterval(_patchTimer), 8000);
