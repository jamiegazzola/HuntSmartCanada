// ══════════════════════════════════════════════════════════════
// ── SYNC.JS  —  Firestore Saved Draws
// Syncs savedDraws (BC) and abSavedDraws (AB) to Firestore.
// Falls back to localStorage when user is not logged in.
// ══════════════════════════════════════════════════════════════

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let db = null;

export function initFirestore(app) {
  db = getFirestore(app);
}

// ── LOAD USER DRAWS FROM FIRESTORE ───────────────────────────
export async function loadUserDraws(uid) {
  if (!db) return;
  try {
    // Load BC saved draws
    const bcSnap = await getDocs(collection(db, 'users', uid, 'bcSavedDraws'));
    const bcDraws = [];
    bcSnap.forEach(d => bcDraws.push(d.data()));
    // Filter out corrupt/incomplete draws missing required fields
    const validBcDraws = bcDraws.filter(d => d && d.Species && d.Class);
    const corruptBcDraws = bcDraws.filter(d => !d || !d.Species || !d.Class);
    if (validBcDraws.length > 0) {
      savedDraws = validBcDraws;
    }
    // Silently delete corrupt BC draws from Firestore
    corruptBcDraws.forEach(d => {
      if (d && d._key) deleteDoc(doc(db, 'users', uid, 'bcSavedDraws', d._key)).catch(() => {});
    });

    // Load AB saved draws
    const abSnap = await getDocs(collection(db, 'users', uid, 'abSavedDraws'));
    const abDraws = [];
    abSnap.forEach(d => abDraws.push(d.data()));
    // Filter out corrupt/incomplete draws missing required fields
    const validAbDraws = abDraws.filter(d => d && d.species && d.wmu);
    const corruptAbDraws = abDraws.filter(d => !d || !d.species || !d.wmu);
    if (validAbDraws.length > 0) {
      abSavedDraws = validAbDraws;
    }
    // Silently delete corrupt AB draws from Firestore
    corruptAbDraws.forEach(d => {
      if (d && d._key) deleteDoc(doc(db, 'users', uid, 'abSavedDraws', d._key)).catch(() => {});
    });

    // Re-render if on saved/compare page
    if (typeof renderSavedDraws === 'function') renderSavedDraws();
    if (typeof renderComparePage === 'function') renderComparePage();

    console.log(`[sync] Loaded ${bcDraws.length} BC + ${abDraws.length} AB draws for user ${uid}`);
  } catch (err) {
    console.error('[sync] Failed to load user draws:', err);
  }
}

// ── CLEAR DRAWS ON LOGOUT ────────────────────────────────────
export function clearUserDraws() {
  // Don't wipe localStorage draws — just leave as-is
  // User logged out, localStorage still works
  if (typeof renderSavedDraws === 'function') renderSavedDraws();
  if (typeof renderComparePage === 'function') renderComparePage();
}

// ── SAVE A BC DRAW ───────────────────────────────────────────
export async function syncSaveBCDraw(draw) {
  const uid = getCurrentUID();
  if (!uid || !db) return; // fallback: localStorage already handled in bc-saved-compare.js
  // Validate required fields before saving to Firestore
  if (!draw || !draw.Species || !draw.Class) {
    console.warn('[sync] Skipping BC draw — missing required fields:', draw);
    return;
  }
  try {
    const key = draw._key || (draw.Species + '_' + draw.Class + '_' + (draw.MU || '')).replace(/[\s\/\\'"]/g, '_');
    await setDoc(doc(db, 'users', uid, 'bcSavedDraws', key), { ...draw, _key: key });
  } catch (err) {
    console.error('[sync] Failed to save BC draw:', err);
  }
}

// ── REMOVE A BC DRAW ─────────────────────────────────────────
export async function syncRemoveBCDraw(key) {
  const uid = getCurrentUID();
  if (!uid || !db) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'bcSavedDraws', key));
  } catch (err) {
    console.error('[sync] Failed to remove BC draw:', err);
  }
}

// ── SAVE AN AB DRAW ──────────────────────────────────────────
export async function syncSaveABDraw(draw) {
  const uid = getCurrentUID();
  if (!uid || !db) return;
  try {
    const key = draw._key || (draw.species + '_' + draw.wmu).replace(/\s+/g, '_');
    await setDoc(doc(db, 'users', uid, 'abSavedDraws', key), { ...draw, _key: key });
  } catch (err) {
    console.error('[sync] Failed to save AB draw:', err);
  }
}

// ── REMOVE AN AB DRAW ────────────────────────────────────────
export async function syncRemoveABDraw(key) {
  const uid = getCurrentUID();
  if (!uid || !db) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'abSavedDraws', key));
  } catch (err) {
    console.error('[sync] Failed to remove AB draw:', err);
  }
}

// ── SAVE HOME CITY ──────────────────────────────────────────
export async function syncSaveHomeCity(cityId) {
  const uid = getCurrentUID();
  if (!uid || !db) return;
  try {
    await setDoc(doc(db, 'users', uid), { homeCity: cityId || null }, { merge: true });
  } catch (err) {
    console.warn('[sync] Failed to save homeCity:', err);
  }
}

// ── LOAD HOME CITY FROM FIRESTORE ────────────────────────────
export async function syncLoadHomeCity(uid) {
  if (!uid || !db) return;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.homeCity && typeof setHomeCity === 'function') {
        if (!localStorage.getItem('hs_home_city')) {
          setHomeCity(data.homeCity);
        }
      }
    }
  } catch (err) {
    console.warn('[sync] Failed to load homeCity:', err);
  }
}

// ── HELPER ───────────────────────────────────────────────────
function getCurrentUID() {
  // auth is initialized in auth.js and exposed on window
  return window._authUser ? window._authUser.uid : null;
}
