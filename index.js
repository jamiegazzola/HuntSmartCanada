// HuntSmart Canada — RevenueCat entitlement sync (preview branch)
// This replaces the old hard-coded Stripe function secrets on the preview branch.
// It does not create charges or checkout sessions. RevenueCat remains the authority
// for subscription access and Firestore only mirrors the current entitlement state.

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const REVENUECAT_SECRET_API_KEY = defineSecret("REVENUECAT_SECRET_API_KEY");
const REVENUECAT_WEBHOOK_AUTH = defineSecret("REVENUECAT_WEBHOOK_AUTH");
const ENTITLEMENT_ID = "premium_maps_analytics";

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim()))];
}

async function resolveFirebaseUid(event) {
  const candidates = uniqueStrings([
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : [])
  ]).filter((id) => !id.startsWith("$RCAnonymousID:"));

  for (const candidate of candidates) {
    const snap = await db.collection("users").doc(candidate).get();
    if (snap.exists) return candidate;
  }

  return null;
}

function entitlementIsCurrentlyActive(entitlement) {
  if (!entitlement) return false;

  const now = Date.now();
  const expiresAt = entitlement.expires_date
    ? new Date(entitlement.expires_date).getTime()
    : null;
  const graceExpiresAt = entitlement.grace_period_expires_date
    ? new Date(entitlement.grace_period_expires_date).getTime()
    : null;

  // A null expiration represents a lifetime entitlement.
  if (expiresAt === null) return true;
  if (Number.isFinite(expiresAt) && expiresAt > now) return true;
  if (Number.isFinite(graceExpiresAt) && graceExpiresAt > now) return true;
  return false;
}

exports.revenuecatWebhook = onRequest(
  {
    region: "us-central1",
    secrets: [REVENUECAT_SECRET_API_KEY, REVENUECAT_WEBHOOK_AUTH]
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const expectedAuth = REVENUECAT_WEBHOOK_AUTH.value();
    const receivedAuth = req.get("authorization") || "";
    if (!expectedAuth || receivedAuth !== expectedAuth) {
      res.status(401).send("Unauthorized");
      return;
    }

    const event = req.body?.event;
    if (!event?.id || !event?.app_user_id) {
      res.status(400).send("Invalid RevenueCat event");
      return;
    }

    const eventRef = db.collection("revenuecatEvents").doc(event.id);
    const existingEvent = await eventRef.get();
    if (existingEvent.exists) {
      res.status(200).send("Already processed");
      return;
    }

    const firebaseUid = await resolveFirebaseUid(event);
    if (!firebaseUid) {
      console.warn("[revenuecatWebhook] No matching Firebase user", {
        eventId: event.id,
        appUserId: event.app_user_id
      });
      res.status(200).send("No matching Firebase user");
      return;
    }

    const apiResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(event.app_user_id)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${REVENUECAT_SECRET_API_KEY.value()}`,
          Accept: "application/json"
        }
      }
    );

    if (!apiResponse.ok) {
      console.error("[revenuecatWebhook] RevenueCat lookup failed", apiResponse.status);
      res.status(503).send("RevenueCat lookup failed");
      return;
    }

    const customer = await apiResponse.json();
    const entitlement = customer?.subscriber?.entitlements?.[ENTITLEMENT_ID] || null;
    const active = entitlementIsCurrentlyActive(entitlement);

    const entitlementRef = db.collection("billingEntitlements").doc(firebaseUid);
    const batch = db.batch();

    batch.set(
      entitlementRef,
      {
        entitlementId: ENTITLEMENT_ID,
        active,
        status: active ? "premium" : "free",
        productIdentifier: entitlement?.product_identifier || null,
        expiresAt: entitlement?.expires_date || null,
        gracePeriodExpiresAt: entitlement?.grace_period_expires_date || null,
        store: event.store || null,
        environment: event.environment || null,
        lastEventType: event.type || null,
        revenueCatAppUserId: event.app_user_id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    batch.set(eventRef, {
      firebaseUid,
      appUserId: event.app_user_id,
      type: event.type || null,
      environment: event.environment || null,
      receivedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    res.status(200).send("OK");
  }
);
