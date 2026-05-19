// ══════════════════════════════════════════════════════════════
// ── AUTH.JS  —  Firebase Authentication
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initFirestore, loadUserDraws, clearUserDraws, syncSaveBCDraw, syncRemoveBCDraw, syncSaveABDraw, syncRemoveABDraw, syncLoadHomeCity, syncSaveHomeCity } from "./sync.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDgiLQD2MVdX-OoeviFpQSRPT6isZNJVVQ",
  authDomain: "huntsmart-canada.firebaseapp.com",
  projectId: "huntsmart-canada",
  storageBucket: "huntsmart-canada.firebasestorage.app",
  messagingSenderId: "342472703908",
  appId: "1:342472703908:web:f9ca542982549d4e1d8b31",
  measurementId: "G-VK3HNNDEW2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
initFirestore(app);

// ── AUTH STATE LISTENER ──────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const isFreshSignIn = !window._authUser;
    window._authUser = user;
    updateAuthUI(user);
    loadUserDraws(user.uid);
    syncLoadHomeCity(user.uid);
    await _trackLogin(user);
    _migrateBCDraws(user.uid);
    // Show Results gate: user signed in from filter page.
    // Just clear the flag — stay on the filter page, let them press Show Results.
    if (isFreshSignIn && window._pendingShowResults) {
      window._pendingShowResults = null;
    }
  } else {
    window._authUser = null;
    updateAuthUI(null);
    clearUserDraws();
  }
});

// ── ONE-TIME BC DRAWS MIGRATION ───────────────────────────────
async function _migrateBCDraws(uid) {
  if (localStorage.getItem('bc_migration_done')) return;
  try {
    const local = JSON.parse(localStorage.getItem('huntodds_saved') || '[]');
    if (!local.length) { localStorage.setItem('bc_migration_done','1'); return; }
    let count = 0;
    for (const draw of local) {
      if (!draw || !draw.Species || !draw.Class) continue;
      const key = draw._key || (draw.Species + '_' + draw.Class + '_' + (draw.MU || '')).replace(/[\s\/\\'"]/g, '_');
      await syncSaveBCDraw({ ...draw, _key: key });
      count++;
    }
    localStorage.setItem('bc_migration_done', '1');
    if (count > 0) console.log(`[migration] synced ${count} BC draws to Firestore`);
  } catch(e) {
    console.warn('[migration] BC draws migration failed', e);
  }
}

// ── LOGIN TRACKING ────────────────────────────────────────────
async function _trackLogin(user) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const urlParams  = new URLSearchParams(window.location.search);
    const utmSource  = urlParams.get('utm_source');
    const ref        = urlParams.get('ref');
    const snap   = await getDoc(userRef);
    const isNew  = !snap.exists();
    const updates = {
      email:       user.email,
      displayName: user.displayName || null,
      photoURL:    user.photoURL    || null,
      lastLogin:   serverTimestamp(),
      loginCount:  increment(1),
    };
    if (isNew) {
      updates.createdAt      = serverTimestamp();
      updates.totalSearches  = 0;
      updates.bcSearches     = 0;
      updates.abSearches     = 0;
      let refSource = 'direct';
      if (utmSource) {
        refSource = utmSource;
      } else if (ref) {
        refSource = ref;
      } else if (document.referrer) {
        try { refSource = new URL(document.referrer).hostname; } catch (_) {}
      }
      updates.referralSource = refSource;
    }
    await setDoc(userRef, updates, { merge: true });
  } catch (e) {
    console.warn('[tracking] login track failed', e);
  }
}

// ── SEARCH TRACKING ──────────────────────────────────────────
export async function trackSearch(province, species, method) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const field = province === 'AB' ? 'abSearches' : 'bcSearches';
    const updates = {
      totalSearches:        increment(1),
      [field]:              increment(1),
      lastSearchedProvince: province,
      lastSearchAt:         serverTimestamp(),
    };
    if (species) {
      const speciesField = province === 'AB' ? 'abSpeciesSearches.' + species : 'bcSpeciesSearches.' + species;
      updates[speciesField] = increment(1);
    }
    if (method) {
      updates['searchMethods.' + method] = increment(1);
    }
    await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
  } catch (e) {
    console.warn('[tracking] search track failed', e);
  }
}

// ── EXPOSE ON WINDOW FOR NON-MODULE SCRIPTS ──────────────────
window.HS = window.HS || {};
window.HS.trackSearch      = trackSearch;
window.HS.syncSaveBCDraw   = syncSaveBCDraw;
window.HS.syncRemoveBCDraw = syncRemoveBCDraw;
window.HS.syncSaveABDraw   = syncSaveABDraw;
window.HS.syncRemoveABDraw = syncRemoveABDraw;
window.syncSaveHomeCity    = syncSaveHomeCity;

// ── SIGN UP ──────────────────────────────────────────────────
export async function signUp(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    window.closeAuthModal();
    if (typeof fbq === 'function') fbq('track', 'CompleteRegistration');
    return { ok: true, user: cred.user };
  } catch (err) {
    _logAuthError('email_signup', err.code, err.message);
    return { ok: false, error: friendlyError(err.code) };
  }
}

// ── SIGN IN ──────────────────────────────────────────────────
export async function signIn(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    window.closeAuthModal();
    return { ok: true, user: cred.user };
  } catch (err) {
    _logAuthError('email_signin', err.code, err.message);
    return { ok: false, error: friendlyError(err.code) };
  }
}

// ── SIGN OUT ─────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth);
}
// Also expose directly on window so any inline handler can call it safely
window._authLogOut = logOut;

// ── GOOGLE SIGN IN ───────────────────────────────────────────
// Always popup — signInWithRedirect is broken on Safari 16.1+, Firefox 109+,
// Chrome 115+ due to third-party cookie blocking (Firebase issue #8329).
// Popup works on mobile when the click handler is wired synchronously via
// addEventListener before DOM insertion (see openAuthModal below).
export async function signInWithGoogle() {
  const ua = navigator.userAgent;
  const isInApp = /Instagram|FBAN|FBAV|FB_IAB|Twitter|TikTok|Line|KAKAOTALK/i.test(ua);
  if (isInApp) {
    return { ok: false, error: 'Open this page in Safari or Chrome to sign in with Google.' };
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const cred = await signInWithPopup(auth, provider);
    window.closeAuthModal && window.closeAuthModal();
    // Fire pixel only for new Google signups (not returning users)
    const isNew = cred.user.metadata.creationTime === cred.user.metadata.lastSignInTime;
    if (isNew && typeof fbq === 'function') fbq('track', 'CompleteRegistration');
    return { ok: true, user: cred.user };
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request') {
      // Still log cancellations so we can see how many people bailed
      _logAuthError('google', err.code, 'cancelled');
      return { ok: false, error: null };
    }
    _logAuthError('google', err.code, err.message);
    return { ok: false, error: friendlyError(err.code) };
  }
}

// ── AUTH ERROR LOGGING ────────────────────────────────────────
async function _logAuthError(method, code, message) {
  try {
    const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await addDoc(collection(db, 'auth_errors'), {
      timestamp:   new Date(),
      method,                          // 'google' | 'email'
      errorCode:   code   || 'unknown',
      errorMsg:    (message || '').slice(0, 200),
      userAgent:   navigator.userAgent.slice(0, 300),
      isInApp:     /Instagram|FBAN|FBAV|FB_IAB|Twitter|TikTok/i.test(navigator.userAgent),
      isMobile:    /Mobi|Android/i.test(navigator.userAgent),
    });
  } catch(e) {
    // Silently fail — don't break auth flow if logging fails
  }
}

// ── UI HELPERS ───────────────────────────────────────────────
function updateAuthUI(user) {
  const btn = document.getElementById('authNavBtn');
  if (!btn) return;
  if (user) {
    const initials = (user.displayName || user.email || '?')[0].toUpperCase();
    btn.innerHTML = `<span class="auth-avatar">${initials}</span>`;
    btn.title = user.email;
    btn.dataset.authState = 'signed-in';
  } else {
    btn.innerHTML = 'Sign In';
    btn.title = '';
    btn.dataset.authState = 'signed-out';
  }
}

// ── AUTH MENU (avatar dropdown) ──────────────────────────────
function openAuthMenu() {
  const existing = document.getElementById('authMenu');
  if (existing) { existing.remove(); return; }
  const btn  = document.getElementById('authNavBtn');
  const rect = btn.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.id = 'authMenu';
  menu.style.cssText = `position:fixed;top:${rect.bottom + 6}px;right:${window.innerWidth - rect.right}px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:6px;z-index:9998;box-shadow:0 8px 32px rgba(0,0,0,0.4);min-width:200px`;
  const user = window._authUser;
  menu.innerHTML = `
    <div style="padding:8px 12px 6px;font-size:11px;color:var(--text-secondary);border-bottom:1px solid var(--border);margin-bottom:4px">${user ? user.email : ''}</div>
    <button class="auth-menu-item hp-dropdown-item" id="hpDropdownItem" onclick="document.getElementById('authMenu').remove();window._hpOpen && window._hpOpen()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      Add Friends
      <span id="hpNavBadge" class="hp-nav-badge" style="display:none">0</span>
    </button>
    <div style="height:1px;background:var(--border);margin:4px 0"></div>
    <button class="auth-menu-item" onclick="document.getElementById('authMenu').remove();window.openHomeCityModal()" style="width:100%;text-align:left;display:flex;align-items:center;gap:8px;padding:8px 12px;background:none;border:none;color:var(--text);font-size:13px;cursor:pointer;border-radius:8px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      Home City
      <span id="authMenuCityName" style="margin-left:auto;font-size:11px;color:var(--accent-bright);opacity:0.85"></span>
    </button>
    <div style="height:1px;background:var(--border);margin:4px 0"></div>
    <button class="auth-signout-btn" onclick="document.getElementById('authMenu').remove();window._authLogOut()">Sign Out</button>
  `;
  document.body.appendChild(menu);
  setTimeout(() => {
    if (window._hpUpdateBadge) window._hpUpdateBadge();
    // Show current home city in menu
    const cityBadge = document.getElementById('authMenuCityName');
    if (cityBadge && typeof getHomeCity === 'function') {
      const cid = getHomeCity();
      const city = cid && typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === cid) : null;
      if (cityBadge) cityBadge.textContent = city ? city.name : '';
    }
  }, 0);
  setTimeout(() => document.addEventListener('click', function close(e) {
    if (!menu.contains(e.target) && e.target !== btn) { menu.remove(); document.removeEventListener('click', close); }
  }), 10);
}
window.openAuthMenu = openAuthMenu;

// ── AUTH MODAL ───────────────────────────────────────────────
export function openAuthModal() {
  // Never open if already signed in
  if (window._authUser) return;
  const existing = document.getElementById('authModal');
  if (existing) existing.remove();

  // Build modal structure
  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.className = 'auth-modal-overlay';

  const inner = document.createElement('div');
  inner.className = 'auth-modal';
  inner.innerHTML = `
    <button class="auth-close" onclick="window.closeAuthModal()">✕</button>
    <img src="./Images/logo.png" class="auth-logo-img" alt="HuntSmart Canada" />
    <p class="auth-sub">Save your draws across all devices</p>
    <div class="auth-tabs">
      <button class="auth-tab active" id="tabSignIn" onclick="window.switchAuthTab('signin')">Sign In</button>
      <button class="auth-tab" id="tabSignUp" onclick="window.switchAuthTab('signup')">Create Account</button>
    </div>
    <div id="authError" class="auth-error" style="display:none"></div>
    <input class="auth-input" id="authEmail" type="email" placeholder="Email address" autocomplete="email" />
    <input class="auth-input" id="authPassword" type="password" placeholder="Password" autocomplete="current-password" />
    <div id="authConfirmWrap" style="display:none">
      <input class="auth-input" id="authConfirm" type="password" placeholder="Confirm password" />
    </div>
    <button class="auth-submit" id="authSubmitBtn" onclick="window.submitAuth()">Sign In</button>
    <div class="auth-divider"><span>or</span></div>
  `;

  // ── CRITICAL FOR MOBILE ──────────────────────────────────────
  // Build the Google button as a real DOM element and attach the
  // click listener BEFORE appending to the document. This keeps
  // the event handler in the same synchronous call stack as the
  // user's tap gesture, which is required for Safari/iOS to allow
  // signInWithPopup to open. Using innerHTML + querySelector after
  // insertion breaks the gesture chain on mobile.
  const googleBtn = document.createElement('button');
  googleBtn.className = 'auth-google-btn';
  googleBtn.id = 'authGoogleBtn';
  googleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg> Continue with Google`;

  // Attach listener before DOM insertion — preserves gesture context
  googleBtn.addEventListener('click', () => {
    const errEl = document.getElementById('authError');
    if (errEl) errEl.style.display = 'none';
    signInWithGoogle().then(result => {
      if (result && !result.ok && result.error) showAuthError(result.error);
    });
  });

  inner.appendChild(googleBtn);
  modal.appendChild(inner);
  modal.addEventListener('click', (e) => { if (e.target === modal) window.closeAuthModal(); });
  document.body.appendChild(modal);
}
window.openAuthModal = openAuthModal;

window.closeAuthModal = function() {
  const modal = document.getElementById('authModal');
  if (modal) modal.remove();
};

window.switchAuthTab = function(tab) {
  const isSignUp = tab === 'signup';
  document.getElementById('tabSignIn').classList.toggle('active', !isSignUp);
  document.getElementById('tabSignUp').classList.toggle('active', isSignUp);
  document.getElementById('authConfirmWrap').style.display = isSignUp ? 'block' : 'none';
  document.getElementById('authSubmitBtn').textContent = isSignUp ? 'Create Account' : 'Sign In';
  document.getElementById('authSubmitBtn').dataset.mode = tab;
  document.getElementById('authError').style.display = 'none';
};

window.submitAuth = async function() {
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const mode     = document.getElementById('authSubmitBtn').dataset.mode || 'signin';
  if (!email || !password) { showAuthError('Please enter your email and password.'); return; }
  if (mode === 'signup') {
    const confirm = document.getElementById('authConfirm').value;
    if (password !== confirm) { showAuthError('Passwords do not match.'); return; }
    if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
    const result = await signUp(email, password);
    if (!result.ok) showAuthError(result.error);
  } else {
    const result = await signIn(email, password);
    if (!result.ok) showAuthError(result.error);
  }
};

function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'That email is already registered. Try signing in.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password. Try again.',
    'auth/invalid-credential':   'Incorrect email or password.',
    'auth/too-many-requests':    'Too many attempts. Please wait a moment.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// ── WIRE NAV BUTTON ───────────────────────────────────────────
// Single addEventListener — no inline onclick, no race condition.
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('authNavBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (window._authUser) {
        openAuthMenu();
      } else {
        openAuthModal();
      }
    });
  }
});

// ── AUTO-PATCH STAR FUNCTIONS ─────────────────────────────────
window.addEventListener('load', () => {
  const origToggleStar = window.toggleStar;
  if (typeof origToggleStar === 'function') {
    window.toggleStar = function(i) {
      origToggleStar(i);
      if (window._authUser) {
        setTimeout(() => {
          const r = window.filtered && window.filtered[i];
          if (!r) return;
          const key = r._key || (r.Species + '_' + r.Class + '_' + (r.MU || '')).replace(/[\s\/\\'"]/g, '_');
          import('./sync.js').then(s => {
            const saved = window.savedDraws || [];
            if (saved.some(d => d._key === key)) { s.syncSaveBCDraw({ ...r, _key: key }); }
            else { s.syncRemoveBCDraw(key); }
          });
        }, 50);
      }
    };
  }
  const origRemoveSaved = window.removeSaved;
  if (typeof origRemoveSaved === 'function') {
    window.removeSaved = function(key) {
      origRemoveSaved(key);
      if (window._authUser) import('./sync.js').then(s => s.syncRemoveBCDraw(key));
    };
  }
  const origAbToggleStar = window.abToggleStar;
  if (typeof origAbToggleStar === 'function') {
    window.abToggleStar = function(idx) {
      origAbToggleStar(idx);
      if (window._authUser) {
        setTimeout(() => {
          const card = window.abLastFilteredCards && window.abLastFilteredCards[idx];
          if (!card) return;
          import('./sync.js').then(s => {
            if (window.abIsStarred && window.abIsStarred(card)) {
              s.syncSaveABDraw({ ...card, _key: card.species + '_' + card.wmu + '_' + card.draw });
            } else {
              s.syncRemoveABDraw(card.species + '_' + card.wmu + '_' + card.draw);
            }
          });
        }, 50);
      }
    };
  }
  const origAbRemoveSaved = window.abRemoveSaved;
  if (typeof origAbRemoveSaved === 'function') {
    window.abRemoveSaved = function(key) {
      origAbRemoveSaved(key);
      if (window._authUser) import('./sync.js').then(s => s.syncRemoveABDraw(key));
    };
  }
});
