// functions/index.js — HuntSmart Canada
// Cloud Functions: startFreeTrial, createCheckoutSession, stripeWebhook

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest }          = require("firebase-functions/v2/https");
const admin                  = require("firebase-admin");
const Stripe                 = require("stripe");

admin.initializeApp();
const db = admin.firestore();

// ── CONFIG — swap sk_test_ for sk_live_ when going live ───────
const STRIPE_SECRET_KEY    = "";
const STRIPE_WEBHOOK_SECRET = ""; // set after step below
const PRICE_MONTHLY        = "price_1TJLjmEJqvSsHrrUjaGVFN1K";
const PRICE_YEARLY         = "price_1TJLjmEJqvSsHrrUW0X4SDXt";
const TRIAL_DAYS           = 7;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" });

// ─────────────────────────────────────────────────────────────
// startFreeTrial — called when user clicks "Try Free for 7 Days"
// Creates a Stripe customer + subscription in trial mode
// Writes subscriptionStatus: "trialing" to Firestore
// ─────────────────────────────────────────────────────────────
exports.startFreeTrial = onCall({ region: "us-central1" }, async (request) => {
  const uid   = request.auth?.uid;
  const email = request.auth?.token?.email;
  if (!uid) throw new HttpsError("unauthenticated", "Must be signed in.");

  const userRef = db.collection("users").doc(uid);
  const snap    = await userRef.get();
  const data    = snap.data() || {};

  // Don't allow a second trial
  if (data.subscriptionStatus && data.subscriptionStatus !== "none") {
    throw new HttpsError("already-exists", "Trial already used.");
  }

  // Create or reuse Stripe customer
  let customerId = data.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { firebaseUID: uid } });
    customerId = customer.id;
  }

  // Create subscription with trial — no payment method required yet
  const subscription = await stripe.subscriptions.create({
    customer:           customerId,
    items:              [{ price: PRICE_MONTHLY }],
    trial_period_days:  TRIAL_DAYS,
    payment_settings:   { save_default_payment_method: "on_subscription" },
    trial_settings:     { end_behavior: { missing_payment_method: "cancel" } },
  });

  // Write to Firestore
  await userRef.set({
    stripeCustomerId:   customerId,
    stripeSubId:        subscription.id,
    subscriptionStatus: "trialing",
    trialEndDate:       admin.firestore.Timestamp.fromMillis(subscription.trial_end * 1000),
    plan:               "monthly",
  }, { merge: true });

  return { ok: true };
});

// ─────────────────────────────────────────────────────────────
// createCheckoutSession — called for "pay now" or adding card
// after trial. Redirects user to Stripe Checkout.
// ─────────────────────────────────────────────────────────────
exports.createCheckoutSession = onCall({ region: "us-central1" }, async (request) => {
  const uid       = request.auth?.uid;
  const email     = request.auth?.token?.email;
  const { plan, returnUrl } = request.data || {};
  if (!uid) throw new HttpsError("unauthenticated", "Must be signed in.");

  const priceId = plan === "yearly" ? PRICE_YEARLY : PRICE_MONTHLY;

  const userRef = db.collection("users").doc(uid);
  const snap    = await userRef.get();
  const data    = snap.data() || {};

  // Create or reuse Stripe customer
  let customerId = data.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { firebaseUID: uid } });
    customerId = customer.id;
    await userRef.set({ stripeCustomerId: customerId }, { merge: true });
  }

  const sessionParams = {
    customer:             customerId,
    mode:                 "subscription",
    line_items:           [{ price: priceId, quantity: 1 }],
    success_url:          `${returnUrl}?status=success`,
    cancel_url:           `${returnUrl}?status=cancelled`,
    allow_promotion_codes: true,
    subscription_data:    {},
  };

  // If user is already trialing, attach to existing sub instead of new trial
  if (data.subscriptionStatus === "trialing" && data.stripeSubId) {
    sessionParams.mode = "setup";
    sessionParams.setup_intent_data = {
      metadata: { subscription_id: data.stripeSubId, firebase_uid: uid }
    };
    delete sessionParams.line_items;
    delete sessionParams.subscription_data;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { url: session.url };
});

// ─────────────────────────────────────────────────────────────
// stripeWebhook — listens for Stripe events and keeps Firestore
// in sync (subscription activated, cancelled, trial ended, etc.)
// ─────────────────────────────────────────────────────────────
exports.stripeWebhook = onRequest({ region: "us-central1" }, async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const obj = event.data.object;

  // Find the Firebase user by Stripe customer ID
  async function getUserRef(customerId) {
    const q = await db.collection("users")
      .where("stripeCustomerId", "==", customerId)
      .limit(1).get();
    return q.empty ? null : q.docs[0].ref;
  }

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const ref = await getUserRef(obj.customer);
      if (!ref) break;
      await ref.set({
        subscriptionStatus: obj.status,           // "active", "trialing", "past_due", etc.
        stripeSubId:        obj.id,
        plan:               obj.items.data[0]?.price.id === PRICE_YEARLY ? "yearly" : "monthly",
        trialEndDate:       obj.trial_end
          ? admin.firestore.Timestamp.fromMillis(obj.trial_end * 1000)
          : null,
        currentPeriodEnd:   admin.firestore.Timestamp.fromMillis(obj.current_period_end * 1000),
      }, { merge: true });
      break;
    }

    case "customer.subscription.deleted": {
      const ref = await getUserRef(obj.customer);
      if (!ref) break;
      await ref.set({ subscriptionStatus: "cancelled" }, { merge: true });
      break;
    }

    case "invoice.payment_failed": {
      const ref = await getUserRef(obj.customer);
      if (!ref) break;
      await ref.set({ subscriptionStatus: "past_due" }, { merge: true });
      break;
    }

    case "invoice.payment_succeeded": {
      const ref = await getUserRef(obj.customer);
      if (!ref) break;
      await ref.set({ subscriptionStatus: "active" }, { merge: true });
      break;
    }
  }

  res.json({ received: true });
});
