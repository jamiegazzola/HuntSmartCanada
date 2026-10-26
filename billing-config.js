// HuntSmart Canada — public billing configuration
// This file is safe to ship to browsers. Never put Stripe secret keys,
// RevenueCat secret API keys, or webhook secrets here.

export const BILLING_CONFIG = Object.freeze({
  // preview = no real checkout; sandbox = RevenueCat/Stripe test checkout; live = real payments
  mode: "preview",

  // Add the RevenueCat Web Billing PUBLIC key here when the RevenueCat sandbox is ready.
  // Sandbox keys begin with rcb_sb_. Production web keys begin with rcb_.
  revenueCatPublicApiKey: "",

  entitlementId: "premium_maps_analytics",
  previewGrantsAccess: true,

  // Fallback display prices while the RevenueCat Offering is not connected.
  monthlyPriceCad: 7.99,
  annualPriceCad: 49.99,

  // Pinned browser SDK build. Keep this version explicit so preview behavior is reproducible.
  revenueCatSdkUrl: "https://unpkg.com/@revenuecat/purchases-js@1.59.0"
});
