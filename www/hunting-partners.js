// ══════════════════════════════════════════════════════════════
// ── HUNTING-PARTNERS.JS  —  Add Friends / Social Feature
// ══════════════════════════════════════════════════════════════
// Firestore schema:
//   users/{uid}/friends/{friendUid}  → { email, displayName, status, addedAt }
//     status: 'pending_sent' | 'pending_received' | 'accepted'
//
// To look up a user by email we store a mirror:
//   usersByEmail/{encodedEmail} → { uid, displayName }
// ══════════════════════════════════════════════════════════════

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// ── Firestore instance (reuse existing app) ───────────────────
function getDB() {
  const apps = getApps();
  if (!apps.length) return null;
  return getFirestore(apps[0]);
}

// ── Encode email for Firestore doc ID (no dots/@ allowed as keys) ──
function encodeEmail(email) {
  return email.toLowerCase().replace(/\./g, ',').replace(/@/g, '__at__');
}

// ── Ensure current user has a usersByEmail record ─────────────
async function ensureUserRecord(user) {
  if (!user) return;
  const db = getDB();
  if (!db) return;
  const key = encodeEmail(user.email);
  const ref = doc(db, 'usersByEmail', key);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      createdAt: serverTimestamp()
    });
  }
}

// ── State ─────────────────────────────────────────────────────
let _modal = null;
let _currentTab = 'friends';   // 'friends' | 'requests'
let _unsubscribe = null;
let _friendsData = [];         // accepted friends
let _requestsData = [];        // pending_received requests
let _viewingFriend = null;     // { uid, email, displayName } when viewing their draws

// ══════════════════════════════════════════════════════════════
// ── OPEN / CLOSE
// ══════════════════════════════════════════════════════════════
export function openFriendsModal() {
  const user = window._authUser;
  if (!user) {
    if (window.openAuthModal) window.openAuthModal();
    return;
  }
  ensureUserRecord(user);

  if (_modal) { _showModal(); return; }
  _buildModal();
  _showModal();
  _subscribeToFriends(user.uid);
}

function _showModal() {
  if (!_modal) return;
  document.body.appendChild(_modal);
  requestAnimationFrame(() => _modal.classList.add('hp-modal--open'));
}

function _closeModal() {
  if (!_modal) return;
  _modal.classList.add('hp-modal--closing');
  _modal.classList.remove('hp-modal--open');
  setTimeout(() => {
    if (_modal && _modal.parentNode) _modal.parentNode.removeChild(_modal);
    _modal = null;
    _viewingFriend = null;
  }, 240);
  if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
}

// ══════════════════════════════════════════════════════════════
// ── BUILD MODAL SHELL
// ══════════════════════════════════════════════════════════════
function _buildModal() {
  const overlay = document.createElement('div');
  overlay.className = 'hp-modal-overlay';
  overlay.id = 'hpModalOverlay';
  overlay.addEventListener('click', e => { if (e.target === overlay) _closeModal(); });

  overlay.innerHTML = `
    <div class="hp-modal" id="hpModal">
      <div class="hp-modal-header">
        <div class="hp-modal-title-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-bright)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span class="hp-modal-title">Add Friends</span>
        </div>
        <button class="hp-modal-close" id="hpModalClose">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="hp-tabs" id="hpTabs">
        <button class="hp-tab hp-tab--active" data-tab="friends" id="hpTabFriends">
          Friends <span class="hp-tab-count" id="hpFriendsCount">0</span>
        </button>
        <button class="hp-tab" data-tab="requests" id="hpTabRequests">
          Requests <span class="hp-tab-badge" id="hpRequestsBadge" style="display:none">0</span>
        </button>
      </div>

      <div class="hp-modal-body" id="hpModalBody">
        <div class="hp-loading"><div class="hp-spinner"></div></div>
      </div>

      <div class="hp-modal-footer" id="hpModalFooter">
        <div class="hp-add-row">
          <div class="hp-add-field-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <input class="hp-email-input" id="hpEmailInput" type="email" placeholder="Friend's email address" autocomplete="off" />
          </div>
          <button class="hp-send-btn" id="hpSendBtn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Add
          </button>
        </div>
        <div class="hp-add-msg" id="hpAddMsg" style="display:none"></div>
      </div>
    </div>
  `;

  // Wire up close
  overlay.querySelector('#hpModalClose').addEventListener('click', _closeModal);

  // Wire up tabs
  overlay.querySelectorAll('.hp-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _currentTab = btn.dataset.tab;
      overlay.querySelectorAll('.hp-tab').forEach(b => b.classList.remove('hp-tab--active'));
      btn.classList.add('hp-tab--active');
      _viewingFriend = null;
      _renderBody();
    });
  });

  // Wire up send
  overlay.querySelector('#hpSendBtn').addEventListener('click', _sendFriendRequest);
  overlay.querySelector('#hpEmailInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') _sendFriendRequest();
  });

  _modal = overlay;
}

// ══════════════════════════════════════════════════════════════
// ── FIRESTORE REALTIME LISTENER
// ══════════════════════════════════════════════════════════════
function _subscribeToFriends(uid) {
  const db = getDB();
  if (!db) return;
  const ref = collection(db, 'users', uid, 'friends');
  _unsubscribe = onSnapshot(ref, snap => {
    _friendsData = [];
    _requestsData = [];
    snap.forEach(d => {
      const data = { id: d.id, ...d.data() };
      if (data.status === 'accepted') _friendsData.push(data);
      else if (data.status === 'pending_received') _requestsData.push(data);
    });
    _updateTabCounts();
    _renderBody();
    _updateNavBadge();
  });
}

function _updateTabCounts() {
  if (!_modal) return;
  const fc = _modal.querySelector('#hpFriendsCount');
  const rb = _modal.querySelector('#hpRequestsBadge');
  if (fc) fc.textContent = _friendsData.length;
  if (rb) {
    rb.textContent = _requestsData.length;
    rb.style.display = _requestsData.length > 0 ? 'inline-block' : 'none';
  }
}

function _updateNavBadge() {
  const badge = document.getElementById('hpNavBadge');
  if (!badge) return;
  const count = _requestsData.length;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'inline-block' : 'none';
}

// ══════════════════════════════════════════════════════════════
// ── RENDER BODY
// ══════════════════════════════════════════════════════════════
function _renderBody() {
  const body = _modal && _modal.querySelector('#hpModalBody');
  if (!body) return;

  if (_viewingFriend) {
    _renderFriendDraws(body, _viewingFriend);
    return;
  }

  if (_currentTab === 'friends') _renderFriendsList(body);
  else _renderRequestsList(body);
}

// ── Friends list ──────────────────────────────────────────────
function _renderFriendsList(body) {
  if (_friendsData.length === 0) {
    body.innerHTML = `
      <div class="hp-empty">
        <div class="hp-empty-icon">🦌</div>
        <div class="hp-empty-title">No friends yet</div>
        <div class="hp-empty-sub">Add friends by email below to see their saved draws and compare hunting plans.</div>
      </div>`;
    return;
  }

  body.innerHTML = `<div class="hp-partners-list" id="hpPartnersList"></div>`;
  const list = body.querySelector('#hpPartnersList');
  _friendsData.forEach(f => {
    const row = document.createElement('div');
    row.className = 'hp-partner-row';
    const initials = (f.displayName || f.email || '?')[0].toUpperCase();
    row.innerHTML = `
      <div class="hp-avatar">${initials}</div>
      <div class="hp-partner-info">
        <div class="hp-partner-name">${_esc(f.displayName || f.email)}</div>
        ${f.displayName ? `<div class="hp-partner-email">${_esc(f.email)}</div>` : ''}
      </div>
      <div class="hp-partner-actions">
        <button class="hp-btn-ghost hp-view-draws-btn" data-uid="${f.id}" data-email="${_esc(f.email)}" data-name="${_esc(f.displayName || f.email)}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View Draws
        </button>
        <button class="hp-btn-remove hp-remove-btn" data-uid="${f.id}">Remove</button>
      </div>`;
    list.appendChild(row);
  });

  // Events
  list.querySelectorAll('.hp-view-draws-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _viewingFriend = { uid: btn.dataset.uid, email: btn.dataset.email, displayName: btn.dataset.name };
      _renderBody();
    });
  });
  list.querySelectorAll('.hp-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => _removeFriend(btn.dataset.uid));
  });
}

// ── Requests list ─────────────────────────────────────────────
function _renderRequestsList(body) {
  if (_requestsData.length === 0) {
    body.innerHTML = `
      <div class="hp-empty">
        <div class="hp-empty-icon">📬</div>
        <div class="hp-empty-title">No pending requests</div>
        <div class="hp-empty-sub">When someone adds you by email, their request will appear here.</div>
      </div>`;
    return;
  }

  body.innerHTML = `
    <div class="hp-req-section-label">Pending Requests</div>
    <div class="hp-partners-list" id="hpRequestsList"></div>`;
  const list = body.querySelector('#hpRequestsList');

  _requestsData.forEach(r => {
    const row = document.createElement('div');
    row.className = 'hp-partner-row';
    const initials = (r.displayName || r.email || '?')[0].toUpperCase();
    row.innerHTML = `
      <div class="hp-avatar">${initials}</div>
      <div class="hp-partner-info">
        <div class="hp-partner-name">${_esc(r.displayName || r.email)}</div>
        ${r.displayName ? `<div class="hp-partner-email">${_esc(r.email)}</div>` : ''}
        <div class="hp-partner-status">Wants to be your hunting partner</div>
      </div>
      <div class="hp-partner-actions">
        <button class="hp-btn-accept hp-accept-btn" data-uid="${r.id}" data-email="${_esc(r.email)}" data-name="${_esc(r.displayName || '')}">Accept</button>
        <button class="hp-btn-remove hp-decline-btn" data-uid="${r.id}">Decline</button>
      </div>`;
    list.appendChild(row);
  });

  list.querySelectorAll('.hp-accept-btn').forEach(btn => {
    btn.addEventListener('click', () => _acceptRequest(btn.dataset.uid, btn.dataset.email, btn.dataset.name));
  });
  list.querySelectorAll('.hp-decline-btn').forEach(btn => {
    btn.addEventListener('click', () => _declineRequest(btn.dataset.uid));
  });
}

// ── Friend's saved draws ──────────────────────────────────────
async function _renderFriendDraws(body, friend) {
  body.innerHTML = `<div class="hp-loading"><div class="hp-spinner"></div></div>`;

  const db = getDB();
  if (!db) return;

  try {
    // Fetch their saved BC draws
    const bcSnap = await getDocs(collection(db, 'users', friend.uid, 'savedDraws'));
    const abSnap = await getDocs(collection(db, 'users', friend.uid, 'savedABDraws'));

    const bcDraws = bcSnap.docs.map(d => ({ ...d.data(), _prov: 'BC' }));
    const abDraws = abSnap.docs.map(d => ({ ...d.data(), _prov: 'AB' }));
    const allDraws = [...bcDraws, ...abDraws];

    const total = allDraws.length;
    const name = friend.displayName || friend.email;

    body.innerHTML = `
      <div class="hp-partner-draws-header">
        <button class="hp-back-btn" id="hpBackBtn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="hp-partner-draws-title">${_esc(name)}'s Draws</div>
          <div class="hp-partner-draws-count">${total} saved</div>
        </div>
      </div>
      ${total === 0
        ? `<div class="hp-empty"><div class="hp-empty-icon">🎯</div><div class="hp-empty-title">No saved draws yet</div><div class="hp-empty-sub">Your friend hasn't saved any draws yet.</div></div>`
        : `<div class="hp-draws-list">${allDraws.map(d => _drawRowHTML(d)).join('')}</div>`
      }`;

    body.querySelector('#hpBackBtn').addEventListener('click', () => {
      _viewingFriend = null;
      _renderBody();
    });
  } catch (e) {
    body.innerHTML = `<div class="hp-empty"><div class="hp-empty-icon">⚠️</div><div class="hp-empty-title">Couldn't load draws</div><div class="hp-empty-sub">Unable to fetch this friend's saved draws.</div></div>`;
  }
}

function _drawRowHTML(d) {
  const prov = d._prov;
  // BC draws have draw_number + species; AB draws have draw + species + wmu
  const title = prov === 'BC'
    ? `${d.species || ''} — ${d.draw_number || d.draw || ''}`
    : `${d.species || ''} — WMU ${d.wmu || ''} (${d.draw || ''})`;

  const odds = prov === 'BC'
    ? (d.weighted_avg != null ? `${(d.weighted_avg * 100).toFixed(1)}%` : '—')
    : (d.weighted_avg != null ? `${(d.weighted_avg * 100).toFixed(1)}%` : '—');

  const zone = prov === 'BC' ? (d.zone || d.region || '') : (d.wmu || '');

  return `
    <div class="hp-draw-row">
      <div class="hp-draw-info">
        <div class="hp-draw-code">${_esc(title)}</div>
        <div class="hp-draw-meta"><span class="hp-draw-prov">${prov}</span>${zone ? ` · ${_esc(String(zone))}` : ''}</div>
      </div>
      <div class="hp-draw-odds">${odds}</div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════
// ── ACTIONS
// ══════════════════════════════════════════════════════════════

async function _sendFriendRequest() {
  const input = _modal && _modal.querySelector('#hpEmailInput');
  const email = input ? input.value.trim().toLowerCase() : '';
  const user = window._authUser;
  if (!user || !email) return;

  if (email === user.email.toLowerCase()) {
    _showAddMsg('You can\'t add yourself.', 'error'); return;
  }

  const btn = _modal.querySelector('#hpSendBtn');
  btn.disabled = true;

  const db = getDB();
  try {
    // Look up the target user by email
    const key = encodeEmail(email);
    const targetRef = doc(db, 'usersByEmail', key);
    const targetSnap = await getDoc(targetRef);

    if (!targetSnap.exists()) {
      _showAddMsg('No HuntSmart account found with that email.', 'error');
      btn.disabled = false; return;
    }

    const targetData = targetSnap.data();
    const targetUid = targetData.uid;

    // Check if already friends or pending
    const existingRef = doc(db, 'users', user.uid, 'friends', targetUid);
    const existingSnap = await getDoc(existingRef);
    if (existingSnap.exists()) {
      const status = existingSnap.data().status;
      _showAddMsg(
        status === 'accepted' ? 'You\'re already friends!' :
        status === 'pending_sent' ? 'Request already sent.' :
        'This user already sent you a request — check Requests tab.',
        'error'
      );
      btn.disabled = false; return;
    }

    // Write pending_sent on sender side
    await setDoc(doc(db, 'users', user.uid, 'friends', targetUid), {
      email: email,
      displayName: targetData.displayName || null,
      status: 'pending_sent',
      addedAt: serverTimestamp()
    });

    // Write pending_received on receiver side
    await setDoc(doc(db, 'users', targetUid, 'friends', user.uid), {
      email: user.email,
      displayName: user.displayName || null,
      status: 'pending_received',
      addedAt: serverTimestamp()
    });

    input.value = '';
    _showAddMsg('Friend request sent!', 'success');
  } catch (e) {
    console.error('HP send error:', e);
    _showAddMsg('Something went wrong. Try again.', 'error');
  }
  btn.disabled = false;
}

async function _acceptRequest(senderUid, senderEmail, senderName) {
  const user = window._authUser;
  if (!user) return;
  const db = getDB();
  try {
    // Update both sides to accepted
    await setDoc(doc(db, 'users', user.uid, 'friends', senderUid), {
      email: senderEmail,
      displayName: senderName || null,
      status: 'accepted',
      addedAt: serverTimestamp()
    });
    await setDoc(doc(db, 'users', senderUid, 'friends', user.uid), {
      email: user.email,
      displayName: user.displayName || null,
      status: 'accepted',
      addedAt: serverTimestamp()
    });
    _showToast('Friend added! 🤝');
  } catch (e) {
    console.error('HP accept error:', e);
  }
}

async function _declineRequest(senderUid) {
  const user = window._authUser;
  if (!user) return;
  const db = getDB();
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'friends', senderUid));
    await deleteDoc(doc(db, 'users', senderUid, 'friends', user.uid));
  } catch (e) {
    console.error('HP decline error:', e);
  }
}

async function _removeFriend(friendUid) {
  const user = window._authUser;
  if (!user) return;
  const db = getDB();
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'friends', friendUid));
    await deleteDoc(doc(db, 'users', friendUid, 'friends', user.uid));
    _showToast('Friend removed.');
  } catch (e) {
    console.error('HP remove error:', e);
  }
}

// ══════════════════════════════════════════════════════════════
// ── UI HELPERS
// ══════════════════════════════════════════════════════════════

function _showAddMsg(msg, type) {
  const el = _modal && _modal.querySelector('#hpAddMsg');
  if (!el) return;
  el.textContent = msg;
  el.className = `hp-add-msg hp-add-msg--${type}`;
  el.style.display = 'block';
  setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
}

function _showToast(msg) {
  const existing = document.getElementById('hpToast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'hpToast';
  toast.className = 'hp-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('hp-toast--show'));
  setTimeout(() => {
    toast.classList.remove('hp-toast--show');
    setTimeout(() => toast.remove(), 220);
  }, 2500);
}

function _esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ══════════════════════════════════════════════════════════════
// ── GLOBAL WIRING
// ══════════════════════════════════════════════════════════════
window._hpOpen = openFriendsModal;

// Badge update hook (called by auth.js after menu renders)
window._hpUpdateBadge = _updateNavBadge;
