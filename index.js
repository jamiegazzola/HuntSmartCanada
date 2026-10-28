// HuntSmart Canada — Firebase Functions
// RevenueCat entitlement sync + privacy-safe aggregate growth analytics.

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

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isProUser(user) {
  const tier = String(user.subscriptionTier || "").toLowerCase();
  const status = String(user.subscriptionStatus || "").toLowerCase();
  return tier === "pro_monthly" || tier === "pro_annual" ||
    (status === "active" && tier.startsWith("pro"));
}

function normalizedSource(user) {
  const raw = String(user.firstTouchSource || user.referralSource || "direct").trim().toLowerCase();
  if (!raw || raw === "direct" || raw === "(direct)") return "Direct";
  if (raw.includes("google") && !raw.includes("ads")) return "Google Organic";
  if (raw.includes("google_ads") || raw.includes("google ads")) return "Google Ads";
  if (raw.includes("facebook") || raw === "fb" || raw.includes("fb.com")) return "Facebook";
  if (raw.includes("instagram")) return "Instagram";
  if (raw.includes("youtube") || raw.includes("youtu.be")) return "YouTube";
  if (raw.includes("reddit")) return "Reddit";
  if (raw.includes("bing") && !raw.includes("ads")) return "Bing Organic";
  if (raw.includes("microsoft_ads")) return "Microsoft Ads";
  if (raw.includes("huntsmartcanada")) return "Legacy internal referral";
  return raw.replace(/^www\./, "").replace(/(^|[-_.])\w/g, (match) => match.toUpperCase());
}

function normalizedBlogPath(user) {
  const path = String(user.firstTouchPath || "").trim();
  if (!path.startsWith("/blog")) return "";
  return path.replace(/\/+$/, "/");
}

function aggregateUsers(users, keyFn) {
  const rows = new Map();

  for (const user of users) {
    const key = keyFn(user);
    if (!key) continue;

    const current = rows.get(key) || { key, signups: 0, pro: 0, latest: null };
    current.signups += 1;
    if (isProUser(user)) current.pro += 1;

    const created = asDate(user.createdAt);
    if (created && (!current.latest || created > current.latest)) current.latest = created;
    rows.set(key, current);
  }

  return [...rows.values()]
    .sort((a, b) => b.signups - a.signups || b.pro - a.pro || a.key.localeCompare(b.key))
    .map((row) => ({
      key: row.key,
      signups: row.signups,
      pro: row.pro,
      proRate: row.signups ? Number((row.pro / row.signups).toFixed(4)) : 0,
      latestSignupAt: row.latest ? row.latest.toISOString() : null
    }));
}

function summarizeWindow(allUsers, days) {
  const cutoff = days ? Date.now() - days * 86400000 : null;
  const users = cutoff
    ? allUsers.filter((user) => {
        const created = asDate(user.createdAt);
        return created && created.getTime() >= cutoff;
      })
    : allUsers;

  const measured = users.filter((user) => user.firstTouchSource || user.referralSource);
  const blogUsers = users.filter((user) => normalizedBlogPath(user));
  const proUsers = users.filter(isProUser);
  const blogProUsers = blogUsers.filter(isProUser);

  return {
    signups: users.length,
    proAccounts: proUsers.length,
    blogAttributedSignups: blogUsers.length,
    blogAttributedPro: blogProUsers.length,
    attributionCoverage: users.length ? Number((measured.length / users.length).toFixed(4)) : 0,
    sources: aggregateUsers(users, normalizedSource),
    blogs: aggregateUsers(blogUsers, normalizedBlogPath)
  };
}

exports.growthSummary = onRequest(
  {
    region: "us-central1",
    cors: true,
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const snap = await db.collection("users").get();
      const users = snap.docs.map((doc) => doc.data());

      res.set("Cache-Control", "public, max-age=300, s-maxage=300");
      res.status(200).json({
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        privacy: {
          aggregateOnly: true,
          userIdentifiersIncluded: false,
          emailsIncluded: false,
          namesIncluded: false
        },
        windows: {
          last7Days: summarizeWindow(users, 7),
          last30Days: summarizeWindow(users, 30),
          allTime: summarizeWindow(users, 0)
        }
      });
    } catch (error) {
      console.error("[growthSummary] failed", error);
      res.status(500).json({ error: "Growth summary unavailable" });
    }
  }
);

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
