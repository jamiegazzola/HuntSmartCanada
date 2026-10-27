import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDgiLQD2MVdX-OoeviFpQSRPT6isZNJVVQ',
  authDomain: 'huntsmart-canada.firebaseapp.com',
  projectId: 'huntsmart-canada',
  storageBucket: 'huntsmart-canada.firebasestorage.app',
  messagingSenderId: '342472703908',
  appId: '1:342472703908:web:f9ca542982549d4e1d8b31',
  measurementId: 'G-VK3HNNDEW2'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch (_) { return null; }
}

function clean(value, max = 250) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function looksNew(user) {
  const created = Date.parse(user?.metadata?.creationTime || '');
  const signed = Date.parse(user?.metadata?.lastSignInTime || '');
  return Number.isFinite(created) && Number.isFinite(signed) && Math.abs(signed - created) < 10000;
}

async function waitForProfile(uid) {
  const ref = doc(db, 'users', uid);
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) return { ref, snap };
    } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return null;
}

function trackSignupOnce(user, firstTouch) {
  const key = `hs_signup_analytics_${user.uid}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch (_) {}

  const params = {
    method: 'firebase_auth',
    acquisition_source: clean(firstTouch?.source || 'direct', 80),
    acquisition_medium: clean(firstTouch?.medium || 'none', 80),
    landing_page: clean(firstTouch?.landingPath || '/', 180)
  };
  if (window.HSAnalytics?.track) window.HSAnalytics.track('sign_up', params);
  else if (typeof window.gtag === 'function') window.gtag('event', 'sign_up', params);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const firstTouch = readJson('hs_first_touch_v1');
  const lastTouch = readJson('hs_last_touch_v1');
  const isNew = looksNew(user);

  if (isNew) trackSignupOnce(user, firstTouch);

  const profile = await waitForProfile(user.uid);
  if (!profile) return; // never create the user doc here; auth.js owns profile creation.

  const updates = {
    attributionUpdatedAt: serverTimestamp()
  };

  if (lastTouch) {
    updates.lastTouchSource = clean(lastTouch.source, 80) || 'direct';
    updates.lastTouchMedium = clean(lastTouch.medium, 80) || 'none';
    updates.lastTouchCampaign = clean(lastTouch.campaign, 100) || null;
    updates.lastTouchPath = clean(lastTouch.landingPath, 220) || '/';
  }

  if (isNew && firstTouch) {
    updates.firstTouchSource = clean(firstTouch.source, 80) || 'direct';
    updates.firstTouchMedium = clean(firstTouch.medium, 80) || 'none';
    updates.firstTouchCampaign = clean(firstTouch.campaign, 100) || null;
    updates.firstTouchContent = clean(firstTouch.content, 100) || null;
    updates.firstTouchTerm = clean(firstTouch.term, 100) || null;
    updates.firstTouchPath = clean(firstTouch.landingPath, 220) || '/';
    updates.firstTouchTitle = clean(firstTouch.landingTitle, 160) || null;
    updates.firstTouchReferrer = clean(firstTouch.referrer, 300) || null;
    updates.firstTouchCapturedAt = clean(firstTouch.capturedAt, 40) || null;
    // Keep the legacy admin referral field useful, but make the durable first-touch
    // value authoritative for newly measured signups.
    updates.referralSource = updates.firstTouchSource;
  }

  try {
    await setDoc(profile.ref, updates, { merge: true });
  } catch (error) {
    console.warn('[attribution] profile attribution update failed', error);
  }
});
