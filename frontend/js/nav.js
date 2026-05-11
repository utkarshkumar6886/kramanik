/* ============================================================
   KRAMANIK — Sidebar Navigation
   ============================================================ */

function renderSidebar(activePage) {
  const nav = [
    { id: 'dashboard',     label: 'Dashboard',     href: 'dashboard.html',     icon: iconGrid },
    { id: 'students',      label: 'Students',      href: 'students.html',      icon: iconUsers },
    { id: 'batches',       label: 'Batches',        href: 'batches.html',       icon: iconBook },
    { id: 'fees',          label: 'Fees',           href: 'fees.html',          icon: iconRupee },
    { id: 'attendance',    label: 'Attendance',     href: 'attendance.html',    icon: iconCheck },
    { id: 'notifications', label: 'Notifications',  href: 'notifications.html', icon: iconBell },
  ];

  const items = nav.map(n => `
    <a class="nav-item ${n.id === activePage ? 'active' : ''}" href="${n.href}">
      ${n.icon()}
      ${n.label}
    </a>
  `).join('');

  return `
    <aside class="sidebar">
      <div class="sidebar-logo">Krama<span>nik</span></div>
      <div class="nav-section">Main</div>
      ${items}
      <div class="nav-section" style="margin-top:8px">Account</div>
      <a class="nav-item ${activePage === 'settings' ? 'active' : ''}" href="settings.html">
        ${iconSettings()}
        Settings &amp; Plan
      </a>
      <div class="sidebar-footer">
        <div style="margin-bottom:10px;" id="plan-badge-wrap"></div>
        <div class="user-pill">
          <div class="avatar" id="sidebar-avatar">A</div>
          <div class="user-info">
            <div class="user-name" id="sidebar-username">Admin</div>
            <div class="user-role">Administrator</div>
          </div>
          <button class="logout-btn" onclick="doLogout()" title="Logout">
            ${iconLogout()}
          </button>
        </div>
      </div>
    </aside>
  `;
}

// Load and inject plan badge asynchronously (non-blocking)
function loadPlanBadge() {
  if (typeof API === 'undefined' || !localStorage.getItem('kramanik_token')) return;
  API.getInstituteProfile().then(p => {
    const wrap = document.getElementById('plan-badge-wrap');
    if (!wrap || !p) return;
    const colors = { FREE: '#6b7280', BASIC: '#4a9eff', PRO: '#f5a623' };
    const color  = colors[p.plan] || '#6b7280';
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:11px;color:var(--muted)">Plan</span>
        <a href="settings.html" style="
          display:inline-flex;align-items:center;gap:4px;
          background:rgba(${p.plan==='PRO'?'245,166,35':'74,158,255'},0.12);
          color:${color};border-radius:20px;padding:2px 10px;
          font-size:11px;font-weight:700;letter-spacing:0.4px;
          border:1px solid ${color}33;
        ">
          ${p.plan}
          ${p.plan !== 'PRO' ? '<span style="font-size:9px;opacity:0.8">↑ Upgrade</span>' : ''}
        </a>
      </div>
    `;
  }).catch(() => {});
}

// ── SVG ICONS ────────────────────────────────────────────────
function iconGrid() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`;
}
function iconUsers() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
}
function iconBook() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
}
function iconRupee() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
}
function iconCheck() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
}
function iconBell() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
}
function iconSettings() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
}
function iconLogout() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
}
