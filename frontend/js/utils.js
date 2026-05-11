/* ============================================================
   KRAMANIK — Shared Utilities
   ============================================================ */

// ── FORMAT ───────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString('en-IN');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── BADGES ───────────────────────────────────────────────────
function statusBadge(s) {
  const map = {
    PAID:    ['badge-green',  'Paid'],
    PENDING: ['badge-orange', 'Pending'],
    OVERDUE: ['badge-red',    'Overdue'],
    PARTIAL: ['badge-blue',   'Partial'],
  };
  const [cls, label] = map[s] || ['badge-muted', s];
  return `<span class="badge ${cls}">${label}</span>`;
}

function attendanceBadge(s) {
  const map = {
    PRESENT: ['badge-green',  'Present'],
    ABSENT:  ['badge-red',    'Absent'],
    LATE:    ['badge-orange', 'Late'],
  };
  const [cls, label] = map[s] || ['badge-muted', s || '—'];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── TOAST ────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : type === 'warn' ? '⚠' : '✕';
  el.innerHTML = `<span>${icon}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── MODAL ────────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function initModalClose() {
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target === el) el.classList.remove('open');
    });
  });
}

// ── LOADING ROW ──────────────────────────────────────────────
function loadingRow(cols) {
  return `<tr class="loading-row"><td colspan="${cols}"><span class="spinner"></span></td></tr>`;
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" style="text-align:center;padding:40px;color:var(--muted)">${msg}</td></tr>`;
}

// ── AUTH USER INFO ────────────────────────────────────────────
function initUserInfo() {
  const email = localStorage.getItem('kramanik_email') || 'admin@kramanik.in';
  const name  = email.split('@')[0];
  const av    = document.getElementById('sidebar-avatar');
  const un    = document.getElementById('sidebar-username');
  if (av) av.textContent  = name[0].toUpperCase();
  if (un) un.textContent  = name;
}

function doLogout() {
  localStorage.removeItem('kramanik_token');
  localStorage.removeItem('kramanik_email');
  window.location.href = 'index.html';
}

// Call loadPlanBadge after initUserInfo so badge appears on every page
const _origInitUserInfo = initUserInfo;
function initUserInfo() {
  _origInitUserInfo();
  if (typeof loadPlanBadge === "function") loadPlanBadge();
}

/* ============================================================
   SPRINT 10 — Error handling, loading states, mobile helpers
   ============================================================ */

// ── API ERROR ROW ─────────────────────────────────────────────
function errorRow(cols, msg) {
  return `<tr class="api-error-row"><td colspan="${cols}">⚠ ${msg} — <a href="javascript:location.reload()" style="color:var(--accent)">Retry</a></td></tr>`;
}

// ── BUTTON LOADING ────────────────────────────────────────────
function setButtonLoading(btn, loading, text) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = text || 'Please wait...';
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || text || 'Done';
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// ── UPGRADE BANNER ────────────────────────────────────────────
function showUpgradeBanner(message) {
  const existing = document.getElementById('upgrade-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'upgrade-banner';
  banner.className = 'upgrade-banner';
  banner.innerHTML = `
    <div>
      <div class="upgrade-banner-text">⚡ ${message}</div>
      <div class="upgrade-banner-sub">Upgrade your plan to continue adding more.</div>
    </div>
    <a href="settings.html" class="btn btn-warn btn-sm">View Plans →</a>
  `;
  const content = document.querySelector('.content-area');
  if (content) content.prepend(banner);
}

// ── GLOBAL API ERROR INTERCEPTOR ─────────────────────────────
// Wraps apiCall to catch 402 (plan limit) automatically
const _originalApiCall = window.apiCall;
if (typeof apiCall !== 'undefined') {
  const _wrappedApiCall = async (path, method, body) => {
    try {
      return await _originalApiCall(path, method, body);
    } catch (e) {
      if (e.message && e.message.includes('402')) {
        showUpgradeBanner(e.message);
      }
      throw e;
    }
  };
}

// ── MOBILE SIDEBAR TOGGLE ─────────────────────────────────────
function initMobileSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');
  if (!sidebar) return;

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
}

// ── INJECT MOBILE HEADER ──────────────────────────────────────
function injectMobileHeader() {
  if (document.querySelector('.mobile-header')) return;
  const header = document.createElement('div');
  header.className = 'mobile-header';
  header.innerHTML = `
    <div class="mobile-logo">Krama<span>nik</span></div>
    <button class="hamburger" id="hamburger-btn">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6"  x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  `;
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';

  const main = document.querySelector('.main');
  if (main) {
    main.prepend(header);
    document.body.appendChild(overlay);
    initMobileSidebar();
  }
}

// Auto-inject mobile header after layout renders
const _origInitUserInfo = typeof initUserInfo !== 'undefined' ? initUserInfo : null;
if (_origInitUserInfo) {
  window.initUserInfo = function() {
    _origInitUserInfo();
    setTimeout(injectMobileHeader, 50);
  };
}
