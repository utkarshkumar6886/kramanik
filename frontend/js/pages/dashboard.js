/* ============================================================
   KRAMANIK — Dashboard Page Logic
   ============================================================ */

async function initDashboard() {
  requireAuth();

  document.getElementById('layout').innerHTML = `
    ${renderSidebar('dashboard')}
    <main class="main">
      <div class="page-header">
        <div>
          <div class="page-title">Dashboard</div>
          <div class="page-subtitle" id="dash-date"></div>
        </div>
      </div>
      <div class="content-area page-enter">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Active Students</div>
            <div class="stat-value" id="stat-students">—</div>
            <div class="stat-change neutral">enrolled</div>
            <div class="stat-icon" style="background:rgba(74,158,255,0.1);color:var(--blue)">👨‍🎓</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active Batches</div>
            <div class="stat-value" id="stat-batches">—</div>
            <div class="stat-change neutral">running</div>
            <div class="stat-icon" style="background:rgba(245,166,35,0.1);color:var(--accent)">📚</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">This Month</div>
            <div class="stat-value" id="stat-collected">—</div>
            <div class="stat-change up">collected</div>
            <div class="stat-icon" style="background:rgba(62,207,142,0.1);color:var(--green)">💰</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Outstanding</div>
            <div class="stat-value" id="stat-outstanding">—</div>
            <div class="stat-change down">pending dues</div>
            <div class="stat-icon" style="background:rgba(242,92,92,0.1);color:var(--red)">⚠️</div>
          </div>
        </div>

        <div class="dash-grid">
          <div class="table-card">
            <div class="table-header">
              <div class="table-title">Pending Fees</div>
              <a href="fees.html" class="btn btn-ghost btn-sm">View all →</a>
            </div>
            <table>
              <thead><tr><th>Student</th><th>Month</th><th>Due</th><th>Status</th></tr></thead>
              <tbody id="dash-pending-fees">${loadingRow(4)}</tbody>
            </table>
          </div>
          <div class="table-card">
            <div class="table-header">
              <div class="table-title">Active Batches</div>
              <a href="batches.html" class="btn btn-ghost btn-sm">View all →</a>
            </div>
            <table>
              <thead><tr><th>Batch</th><th>Subject</th><th>Fee/mo</th></tr></thead>
              <tbody id="dash-batches">${loadingRow(3)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  `;

  initUserInfo();
  loadDashboardData();
}

async function loadDashboardData() {
  document.getElementById('dash-date').textContent =
    new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

  const [students, batches, summary, pending] = await Promise.all([
    API.getStudents(),
    API.getBatches(),
    API.getFeeSummary(),
    API.getPendingFees()
  ]);

  if (students) document.getElementById('stat-students').textContent = students.length;
  if (batches)  document.getElementById('stat-batches').textContent  = batches.length;

  if (summary) {
    document.getElementById('stat-collected').textContent   = '₹' + fmt(summary.collected);
    document.getElementById('stat-outstanding').textContent = '₹' + fmt(summary.outstanding);
  }

  if (batches) {
    const tbody = document.getElementById('dash-batches');
    tbody.innerHTML = batches.length
      ? batches.slice(0, 6).map(b => `
          <tr>
            <td>${b.name}</td>
            <td>${b.subject || '—'}</td>
            <td>₹${fmt(b.monthlyFee)}</td>
          </tr>`).join('')
      : emptyRow(3, 'No batches yet');
  }

  if (pending) {
    const tbody = document.getElementById('dash-pending-fees');
    tbody.innerHTML = pending.length
      ? pending.slice(0, 6).map(f => `
          <tr>
            <td>${f.student?.name || '—'}</td>
            <td>${f.month}</td>
            <td>₹${fmt(f.amountDue)}</td>
            <td>${statusBadge(f.status)}</td>
          </tr>`).join('')
      : `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--green)">✓ All fees cleared!</td></tr>`;
  }
}
