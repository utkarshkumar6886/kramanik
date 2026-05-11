/* ============================================================
   KRAMANIK — Notifications Page Logic
   ============================================================ */

let notifStudents  = [];
let notifPending   = [];
let selectedType   = 'fee_reminder';
let notifLog       = JSON.parse(localStorage.getItem('kramanik_notif_log') || '[]');

const TEMPLATES = {
  fee_reminder: {
    icon: '💰',
    name: 'Fee Reminder',
    desc: 'Remind parents of pending or overdue fees',
    build: (student, fee) =>
`Dear ${student.parentName || 'Parent'},

This is a gentle reminder that the fees for *${student.name}* for the month of *${fee?.month || 'this month'}* are pending.

📌 Amount Due: ₹${fee ? (fee.amountDue - fee.amountPaid).toFixed(0) : '—'}
📅 Due Date: ${fee?.dueDate || '—'}

Kindly clear the dues at the earliest to avoid any inconvenience.

Thank you,
Kramanik Institute`
  },
  attendance_alert: {
    icon: '📋',
    name: 'Attendance Alert',
    desc: 'Notify parents of low attendance or absences',
    build: (student) =>
`Dear ${student.parentName || 'Parent'},

We noticed that *${student.name}* has been absent recently from their classes.

Regular attendance is crucial for academic progress. Kindly ensure they attend classes regularly.

If there is any issue, please feel free to contact us.

Thank you,
Kramanik Institute`
  },
  announcement: {
    icon: '📢',
    name: 'Announcement',
    desc: 'General announcements to all or selected parents',
    build: (student) =>
`Dear ${student.parentName || 'Parent'},

We have an important announcement regarding *${student.name}*'s upcoming classes.

Please check with the institute for further details.

Thank you,
Kramanik Institute`
  }
};

function initNotifications() {
  requireAuth();

  document.getElementById('layout').innerHTML = `
    ${renderSidebar('notifications')}
    <main class="main">
      <div class="page-header">
        <div>
          <div class="page-title">Notifications</div>
          <div class="page-subtitle">Send WhatsApp reminders and announcements to parents</div>
        </div>
      </div>
      <div class="content-area page-enter">

        <div style="font-family:var(--font-head);font-size:15px;font-weight:600;margin-bottom:14px;">
          1. Choose Message Type
        </div>
        <div class="template-selector" id="template-selector"></div>

        <div class="composer">
          <div class="composer-title">2. Select Recipients</div>
          <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
            <button class="btn btn-ghost btn-sm" onclick="selectAllRecipients(true)">Select All</button>
            <button class="btn btn-ghost btn-sm" onclick="selectAllRecipients(false)">Deselect All</button>
            <span id="selected-count" style="font-size:12px;color:var(--muted);align-self:center;margin-left:4px"></span>
          </div>
          <div class="recipient-grid" id="recipient-grid">
            <div style="color:var(--muted);font-size:13px;padding:8px">Loading students...</div>
          </div>
        </div>

        <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
          <div style="flex:1;min-width:280px;">
            <div class="preview-box">
              <div class="preview-header">
                3. Message Preview
                <span style="font-size:12px;color:var(--muted);font-weight:400">Auto-generated</span>
              </div>
              <div class="preview-body">
                <div class="wa-mock">
                  <div class="wa-bubble" id="msg-preview">Select a recipient to preview.</div>
                  <div class="wa-time" id="wa-time"></div>
                </div>
              </div>
            </div>
          </div>
          <div style="width:240px;flex-shrink:0;">
            <div class="composer" style="margin-bottom:0">
              <div class="composer-title">4. Send</div>
              <p style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:16px;">
                In production this sends via the WhatsApp Business API directly to parents' phones.
                For the MVP, messages are logged in history below.
              </p>
              <button class="btn btn-success btn-block" onclick="sendNotifications()">
                📤 Send to Selected
              </button>
            </div>
          </div>
        </div>

        <div style="margin-top:28px;">
          <div style="font-family:var(--font-head);font-size:15px;font-weight:600;margin-bottom:14px;">
            Notification History
          </div>
          <div class="table-card" id="notif-log-wrap"></div>
        </div>

      </div>
    </main>
  `;

  initUserInfo();
  loadNotificationsPage();
}

async function loadNotificationsPage() {
  document.getElementById('wa-time').textContent =
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' ✓✓';

  renderTemplates();

  const [students, fees] = await Promise.all([API.getStudents(), API.getPendingFees()]);
  notifStudents = students || [];
  notifPending  = fees     || [];

  renderRecipients();
  renderNotifLog();
}

// ── TEMPLATES ────────────────────────────────────────────────
function renderTemplates() {
  document.getElementById('template-selector').innerHTML =
    Object.entries(TEMPLATES).map(([key, t]) => `
      <div class="template-card ${key === selectedType ? 'selected' : ''}"
           onclick="selectTemplate('${key}')">
        <div class="template-icon">${t.icon}</div>
        <div class="template-name">${t.name}</div>
        <div class="template-desc">${t.desc}</div>
      </div>
    `).join('');
}

function selectTemplate(key) {
  selectedType = key;
  renderTemplates();
  updatePreview();
}

// ── RECIPIENTS ────────────────────────────────────────────────
function renderRecipients() {
  const grid = document.getElementById('recipient-grid');
  if (!notifStudents.length) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px">No students found.</div>';
    return;
  }
  grid.innerHTML = notifStudents.map(s => `
    <label class="recipient-item">
      <input type="checkbox" class="rec-cb" value="${s.id}"
             onchange="updatePreview();updateSelectedCount()" />
      <span>${s.name}</span>
    </label>
  `).join('');
  updateSelectedCount();
}

function selectAllRecipients(val) {
  document.querySelectorAll('.rec-cb').forEach(cb => cb.checked = val);
  updateSelectedCount();
  updatePreview();
}

function updateSelectedCount() {
  const count = document.querySelectorAll('.rec-cb:checked').length;
  document.getElementById('selected-count').textContent =
    count ? `${count} recipient${count > 1 ? 's' : ''} selected` : '';
}

function updatePreview() {
  const checked = document.querySelector('.rec-cb:checked');
  if (!checked) {
    document.getElementById('msg-preview').textContent = 'Select a recipient to preview.';
    return;
  }
  const student = notifStudents.find(s => s.id === parseInt(checked.value));
  if (!student) return;
  const fee = notifPending.find(f => f.student?.id === student.id);
  document.getElementById('msg-preview').textContent =
    TEMPLATES[selectedType].build(student, fee);
}

// ── SEND ─────────────────────────────────────────────────────
async function sendNotifications() {
  const checked = [...document.querySelectorAll('.rec-cb:checked')]
    .map(cb => parseInt(cb.value));
  if (!checked.length) { showToast('Select at least one recipient', 'warn'); return; }

  const entries = checked.map((sid, i) => {
    const student = notifStudents.find(s => s.id === sid);
    const fee     = notifPending.find(f => f.student?.id === sid);
    return {
      id:          Date.now() + i,
      type:        selectedType,
      studentName: student?.name || '—',
      phone:       student?.parentWhatsapp || student?.parentPhone || '—',
      preview:     TEMPLATES[selectedType].build(student, fee).substring(0, 80) + '...',
      status:      'SENT',
      sentAt:      new Date().toLocaleString('en-IN')
    };
  });

  notifLog = [...entries, ...notifLog].slice(0, 50);
  localStorage.setItem('kramanik_notif_log', JSON.stringify(notifLog));

  showToast(`✓ ${checked.length} notification${checked.length > 1 ? 's' : ''} queued`);
  selectAllRecipients(false);
  renderNotifLog();
}

// ── LOG ───────────────────────────────────────────────────────
function renderNotifLog() {
  const wrap = document.getElementById('notif-log-wrap');
  if (!notifLog.length) {
    wrap.innerHTML =
      '<div style="text-align:center;padding:40px;color:var(--muted)">No notifications sent yet.</div>';
    return;
  }
  const iconMap = { fee_reminder: '💰', attendance_alert: '📋', announcement: '📢' };
  wrap.innerHTML = notifLog.map(n => `
    <div class="log-item">
      <div class="log-icon">${iconMap[n.type] || '📨'}</div>
      <div class="log-body">
        <div class="log-title">${TEMPLATES[n.type]?.name || n.type} → ${n.studentName}</div>
        <div class="log-meta">📱 ${n.phone} &nbsp;·&nbsp; ${n.sentAt}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px;font-style:italic">
          "${n.preview}"
        </div>
      </div>
      <div class="log-status">
        <span class="badge ${n.status === 'SENT' ? 'badge-green' : 'badge-red'}">${n.status}</span>
      </div>
    </div>
  `).join('');
}
