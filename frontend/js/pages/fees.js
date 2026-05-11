/* ============================================================
   KRAMANIK — Fees Page Logic
   ============================================================ */

let feeStudents = [];
let feeBatches  = [];

function initFees() {
  requireAuth();

  document.getElementById('layout').innerHTML = `
    ${renderSidebar('fees')}
    <main class="main">
      <div class="page-header">
        <div>
          <div class="page-title">Fee Management</div>
          <div class="page-subtitle">Track dues, payments and outstanding amounts</div>
        </div>
        <button class="btn btn-primary" onclick="openFeeModal()">+ Create Fee Record</button>
      </div>
      <div class="content-area page-enter">
        <div class="stats-grid-3">
          <div class="stat-card">
            <div class="stat-label">This Month Collected</div>
            <div class="stat-value" id="fee-collected">—</div>
            <div class="stat-icon" style="background:rgba(62,207,142,0.1);color:var(--green)">✅</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Outstanding</div>
            <div class="stat-value" id="fee-outstanding">—</div>
            <div class="stat-icon" style="background:rgba(242,92,92,0.1);color:var(--red)">🔴</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending Records</div>
            <div class="stat-value" id="fee-pending-count">—</div>
            <div class="stat-icon" style="background:rgba(245,166,35,0.1);color:var(--accent)">⏳</div>
          </div>
        </div>
        <div class="table-card">
          <div class="table-header"><div class="table-title">Pending &amp; Overdue</div></div>
          <table>
            <thead>
              <tr>
                <th>Student</th><th>Month</th><th>Amount Due</th>
                <th>Paid</th><th>Balance</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody id="fees-table">${loadingRow(7)}</tbody>
          </table>
        </div>
      </div>
    </main>
  `;

  initUserInfo();
  initModalClose();
  loadFees();
}

async function loadFees() {
  const [fees, summary, students, batches] = await Promise.all([
    API.getPendingFees(),
    API.getFeeSummary(),
    API.getStudents(),
    API.getBatches()
  ]);
  feeStudents = students || [];
  feeBatches  = batches  || [];

  if (summary) {
    document.getElementById('fee-collected').textContent   = '₹' + fmt(summary.collected);
    document.getElementById('fee-outstanding').textContent = '₹' + fmt(summary.outstanding);
  }
  if (fees) {
    document.getElementById('fee-pending-count').textContent = fees.length;
    renderFeesTable(fees);
  }
}

function renderFeesTable(fees) {
  const tbody = document.getElementById('fees-table');
  if (!fees.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--green)">✓ All fees are cleared!</td></tr>`;
    return;
  }
  tbody.innerHTML = fees.map(f => {
    const balance = (f.amountDue - f.amountPaid).toFixed(2);
    const pct     = Math.min(100, Math.round((f.amountPaid / f.amountDue) * 100));
    const barColor = pct === 100 ? 'var(--green)' : 'var(--accent)';
    return `
      <tr>
        <td><strong>${f.student?.name || '—'}</strong></td>
        <td>${f.month}</td>
        <td>₹${fmt(f.amountDue)}</td>
        <td>
          ₹${fmt(f.amountPaid)}
          <div class="fee-bar">
            <div class="fee-bar-fill" style="width:${pct}%;background:${barColor}"></div>
          </div>
        </td>
        <td style="color:var(--red)"><strong>₹${balance}</strong></td>
        <td>${statusBadge(f.status)}</td>
        <td>
          <button class="btn btn-success btn-sm"
            onclick="openPayModal(${f.id},'${f.student?.name}',${f.amountDue},${f.amountPaid})">
            Pay
          </button>
        </td>
      </tr>`;
  }).join('');
}

function openFeeModal() {
  const ss = document.getElementById('f-student');
  const bb = document.getElementById('f-batch');
  ss.innerHTML = '<option value="">Select student...</option>' +
    feeStudents.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  bb.innerHTML = '<option value="">Select batch...</option>' +
    feeBatches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  document.getElementById('f-month').value  = currentMonth();
  document.getElementById('f-due').value    = `${currentMonth()}-10`;
  document.getElementById('f-amount').value = '';
  openModal('fee-modal');
}

async function saveFee() {
  const studentId = document.getElementById('f-student').value;
  const batchId   = document.getElementById('f-batch').value;
  const month     = document.getElementById('f-month').value;
  const amountDue = document.getElementById('f-amount').value;
  const dueDate   = document.getElementById('f-due').value;
  if (!studentId || !batchId || !month || !amountDue || !dueDate) {
    showToast('All fields are required', 'error'); return;
  }
  try {
    await API.createFee({ studentId, batchId, month, amountDue, dueDate });
    showToast('Fee record created');
    closeModal('fee-modal');
    loadFees();
  } catch (e) { showToast('Failed to create fee record', 'error'); }
}

function openPayModal(feeId, studentName, amountDue, amountPaid) {
  document.getElementById('pay-fee-id').value = feeId;
  const balance = (amountDue - amountPaid).toFixed(2);
  document.getElementById('pay-info').innerHTML = `
    <div class="kv-list">
      <div class="kv-row">
        <span class="kv-key">Student</span>
        <span class="kv-val">${studentName}</span>
      </div>
      <div class="kv-row">
        <span class="kv-key">Amount Due</span>
        <span class="kv-val">₹${fmt(amountDue)}</span>
      </div>
      <div class="kv-row">
        <span class="kv-key">Already Paid</span>
        <span class="kv-val" style="color:var(--green)">₹${fmt(amountPaid)}</span>
      </div>
      <div class="kv-row">
        <span class="kv-key">Balance</span>
        <span class="kv-val" style="color:var(--red)">₹${balance}</span>
      </div>
    </div>`;
  document.getElementById('pay-amount').value = balance;
  openModal('pay-modal');
}

async function submitPayment() {
  const id     = document.getElementById('pay-fee-id').value;
  const amount = document.getElementById('pay-amount').value;
  const mode   = document.getElementById('pay-mode').value;
  if (!amount || parseFloat(amount) <= 0) {
    showToast('Enter a valid amount', 'error'); return;
  }
  try {
    await API.recordPayment(id, { amount: parseFloat(amount), paymentMode: mode });
    showToast('Payment recorded successfully ✓');
    closeModal('pay-modal');
    loadFees();
  } catch (e) { showToast('Failed to record payment', 'error'); }
}
