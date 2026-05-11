/* ============================================================
   KRAMANIK — Attendance Page Logic
   ============================================================ */

let attBatches    = [];
let attStudents   = [];
let attendanceMap = {};   // studentId -> 'PRESENT' | 'ABSENT' | 'LATE'

function initAttendance() {
  requireAuth();

  document.getElementById('layout').innerHTML = `
    ${renderSidebar('attendance')}
    <main class="main">
      <div class="page-header">
        <div>
          <div class="page-title">Attendance</div>
          <div class="page-subtitle">Mark and review daily attendance per batch</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-ghost" id="tab-btn-mark"   onclick="showTab('mark')">Mark Today</button>
          <button class="btn btn-ghost" id="tab-btn-report" onclick="showTab('report')">Monthly Report</button>
        </div>
      </div>
      <div class="content-area page-enter">

        <!-- MARK ATTENDANCE TAB -->
        <div id="tab-mark">
          <div class="att-toolbar">
            <div>
              <label>Batch</label><br/>
              <select id="att-batch" onchange="loadMarkingSheet()">
                <option value="">Select batch...</option>
              </select>
            </div>
            <div>
              <label>Date</label><br/>
              <input type="date" id="att-date" onchange="loadMarkingSheet()" />
            </div>
            <div class="att-summary" id="att-summary" style="display:none">
              <div class="att-pill">
                <div class="att-dot" style="background:var(--green)"></div>
                <span id="count-p">0</span> Present
              </div>
              <div class="att-pill">
                <div class="att-dot" style="background:var(--red)"></div>
                <span id="count-a">0</span> Absent
              </div>
              <div class="att-pill">
                <div class="att-dot" style="background:var(--accent)"></div>
                <span id="count-l">0</span> Late
              </div>
            </div>
          </div>

          <div class="table-card" id="mark-card">
            <div class="quick-btns" id="quick-btns"
                 style="display:none;padding:16px 20px 0;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-success btn-sm" onclick="markAll('PRESENT')">✓ Mark All Present</button>
              <button class="btn btn-danger btn-sm"  onclick="markAll('ABSENT')">✕ Mark All Absent</button>
            </div>
            <div id="att-grid-wrap">
              <div style="text-align:center;padding:60px;color:var(--muted)">
                Select a batch and date to begin.
              </div>
            </div>
            <div id="save-bar"
                 style="display:none;padding:16px 20px;border-top:1px solid var(--border);
                        justify-content:flex-end;gap:10px;">
              <button class="btn btn-ghost" onclick="loadMarkingSheet()">Reset</button>
              <button class="btn btn-primary" onclick="saveAttendance()">Save Attendance</button>
            </div>
          </div>
        </div>

        <!-- MONTHLY REPORT TAB -->
        <div id="tab-report" style="display:none">
          <div class="att-toolbar">
            <div>
              <label>Batch</label><br/>
              <select id="rep-batch" onchange="loadReport()">
                <option value="">Select batch...</option>
              </select>
            </div>
            <div>
              <label>Month (YYYY-MM)</label><br/>
              <input type="text" id="rep-month" placeholder="2024-04"
                     style="background:var(--surface);border:1px solid var(--border);
                            border-radius:var(--radius-sm);color:var(--text);
                            font-family:var(--font-body);font-size:14px;
                            padding:8px 12px;outline:none;"
                     onchange="loadReport()" />
            </div>
          </div>
          <div class="table-card">
            <div class="table-header"><div class="table-title">Monthly Attendance Summary</div></div>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Student</th><th>Present</th>
                  <th>Absent</th><th>Late</th><th>Total</th><th>Attendance %</th>
                </tr>
              </thead>
              <tbody id="report-table">${loadingRow(7)}</tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  `;

  initUserInfo();
  setupAttendancePage();
}

async function setupAttendancePage() {
  document.getElementById('att-date').value  = today();
  document.getElementById('rep-month').value = currentMonth();
  attBatches = await API.getBatches() || [];
  populateBatchDropdowns();
  showTab('mark');
}

function populateBatchDropdowns() {
  const opts = '<option value="">Select batch...</option>' +
    attBatches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  document.getElementById('att-batch').innerHTML = opts;
  document.getElementById('rep-batch').innerHTML = opts;
}

function showTab(name) {
  document.getElementById('tab-mark').style.display   = name === 'mark'   ? 'block' : 'none';
  document.getElementById('tab-report').style.display = name === 'report' ? 'block' : 'none';
  document.getElementById('tab-btn-mark').className   = 'btn ' + (name === 'mark'   ? 'btn-primary' : 'btn-ghost');
  document.getElementById('tab-btn-report').className = 'btn ' + (name === 'report' ? 'btn-primary' : 'btn-ghost');
}

// ── MARK ATTENDANCE ───────────────────────────────────────────
async function loadMarkingSheet() {
  const batchId = document.getElementById('att-batch').value;
  const date    = document.getElementById('att-date').value;
  if (!batchId || !date) return;

  document.getElementById('att-grid-wrap').innerHTML =
    `<div style="text-align:center;padding:40px"><span class="spinner"></span></div>`;
  document.getElementById('quick-btns').style.display  = 'none';
  document.getElementById('save-bar').style.display    = 'none';
  document.getElementById('att-summary').style.display = 'none';

  // Load only students enrolled in this batch (Sprint 9 fix)
  const enrolled = await API.getEnrolledStudents(batchId) || [];
  attStudents = enrolled.map(s => ({ id: s.studentId, name: s.studentName, phone: s.phone }));

  let existing = [];
  try { existing = await API.getAttendance(batchId, date) || []; } catch (e) {}

  attendanceMap = {};
  existing.forEach(a => {
    attendanceMap[a.student?.id || a.studentId] = a.status;
  });

  renderAttGrid(attStudents);
  document.getElementById('quick-btns').style.display  = 'flex';
  document.getElementById('save-bar').style.display    = 'flex';
  document.getElementById('att-summary').style.display = 'flex';
  updateSummaryCounts();
}

function renderAttGrid(students) {
  if (!students.length) {
    document.getElementById('att-grid-wrap').innerHTML =
      '<div style="text-align:center;padding:40px;color:var(--muted)">No students found.</div>';
    return;
  }
  const cards = students.map(s => {
    const status = attendanceMap[s.id] || '';
    return `
      <div class="att-card ${status.toLowerCase()}" id="card-${s.id}">
        <div class="att-name">${s.name}</div>
        <div style="font-size:11px;color:var(--muted)">${s.phone || '—'}</div>
        <div class="att-status-btns">
          <button class="att-btn ${status==='PRESENT'?'p-active':''}"
                  onclick="setStatus(${s.id},'PRESENT',this)">P</button>
          <button class="att-btn ${status==='ABSENT' ?'a-active':''}"
                  onclick="setStatus(${s.id},'ABSENT', this)">A</button>
          <button class="att-btn ${status==='LATE'   ?'l-active':''}"
                  onclick="setStatus(${s.id},'LATE',   this)">L</button>
        </div>
      </div>`;
  }).join('');
  document.getElementById('att-grid-wrap').innerHTML =
    `<div class="att-grid">${cards}</div>`;
}

function setStatus(studentId, status) {
  attendanceMap[studentId] = status;
  const card = document.getElementById(`card-${studentId}`);
  card.className = `att-card ${status.toLowerCase()}`;
  const btns = card.querySelectorAll('.att-btn');
  btns[0].className = `att-btn ${status==='PRESENT'?'p-active':''}`;
  btns[1].className = `att-btn ${status==='ABSENT' ?'a-active':''}`;
  btns[2].className = `att-btn ${status==='LATE'   ?'l-active':''}`;
  updateSummaryCounts();
}

function markAll(status) {
  attStudents.forEach(s => setStatus(s.id, status));
}

function updateSummaryCounts() {
  const vals = Object.values(attendanceMap);
  document.getElementById('count-p').textContent = vals.filter(v => v === 'PRESENT').length;
  document.getElementById('count-a').textContent = vals.filter(v => v === 'ABSENT').length;
  document.getElementById('count-l').textContent = vals.filter(v => v === 'LATE').length;
}

async function saveAttendance() {
  const batchId = document.getElementById('att-batch').value;
  const date    = document.getElementById('att-date').value;
  if (!batchId || !date) { showToast('Select batch and date first', 'error'); return; }

  const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
    studentId: parseInt(studentId),
    batchId:   parseInt(batchId),
    date,
    status
  }));
  if (!records.length) { showToast('No attendance marked yet', 'warn'); return; }

  try {
    await API.markAttendance(records);
    showToast(`Attendance saved for ${records.length} students ✓`);
  } catch (e) {
    showToast('Failed to save attendance', 'error');
  }
}

// ── MONTHLY REPORT ────────────────────────────────────────────
async function loadReport() {
  const batchId = document.getElementById('rep-batch').value;
  const month   = document.getElementById('rep-month').value;
  if (!batchId || !month) return;

  document.getElementById('report-table').innerHTML = loadingRow(7);
  try {
    const data = await API.getAttendanceSummary(batchId, month);
    renderReport(data || []);
  } catch (e) {
    document.getElementById('report-table').innerHTML =
      emptyRow(7, 'No attendance data found for this batch/month.');
  }
}

function renderReport(data) {
  const tbody = document.getElementById('report-table');
  if (!data.length) { tbody.innerHTML = emptyRow(7, 'No attendance data found.'); return; }
  tbody.innerHTML = data.map((row, i) => {
    const total = (row.present || 0) + (row.absent || 0) + (row.late || 0);
    const pct   = total > 0
      ? Math.round(((row.present + (row.late || 0) * 0.5) / total) * 100)
      : 0;
    const color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--red)';
    return `
      <tr>
        <td style="color:var(--muted)">${i + 1}</td>
        <td><strong>${row.studentName || '—'}</strong></td>
        <td style="color:var(--green)">${row.present || 0}</td>
        <td style="color:var(--red)">${row.absent || 0}</td>
        <td style="color:var(--accent)">${row.late || 0}</td>
        <td>${total}</td>
        <td>
          <div class="att-pct-bar">
            <div class="bar">
              <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
            </div>
            <span style="font-size:12px;font-weight:600;color:${color};min-width:36px">
              ${pct}%
            </span>
          </div>
        </td>
      </tr>`;
  }).join('');
}
