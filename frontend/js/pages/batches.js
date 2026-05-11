/* ============================================================
   KRAMANIK — Batches Page Logic
   ============================================================ */

let allBatches = [];

function initBatches() {
  requireAuth();

  document.getElementById('layout').innerHTML = `
    ${renderSidebar('batches')}
    <main class="main">
      <div class="page-header">
        <div>
          <div class="page-title">Batches</div>
          <div class="page-subtitle">Manage class batches and schedules</div>
        </div>
        <button class="btn btn-primary" onclick="openAddBatchModal()">+ Add Batch</button>
      </div>
      <div class="content-area page-enter">
        <div class="table-card">
          <div class="table-header"><div class="table-title">All Batches</div></div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Batch Name</th><th>Subject</th><th>Schedule</th>
                <th>Timings</th><th>Monthly Fee</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="batches-table">${loadingRow(8)}</tbody>
          </table>
        </div>
      </div>
    </main>
  `;

  initUserInfo();
  initModalClose();
  loadBatches();
}

async function loadBatches() {
  allBatches = await API.getBatches() || [];
  renderBatchesTable(allBatches);
}

function renderBatchesTable(batches) {
  const tbody = document.getElementById('batches-table');
  if (!batches.length) {
    tbody.innerHTML = emptyRow(8, 'No batches yet. Create your first batch!');
    return;
  }
  tbody.innerHTML = batches.map((b, i) => `
    <tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td><strong>${b.name}</strong></td>
      <td>${b.subject || '—'}</td>
      <td>${(b.scheduleDays || '').replace(/,/g, ' · ') || '—'}</td>
      <td>${b.startTime
        ? b.startTime.substring(0, 5) + ' – ' + b.endTime.substring(0, 5)
        : '—'}</td>
      <td><strong>₹${fmt(b.monthlyFee)}</strong></td>
      <td>${b.active
        ? '<span class="badge badge-green">Active</span>'
        : '<span class="badge badge-muted">Inactive</span>'}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-ghost btn-sm" onclick="editBatch(${b.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="removeBatch(${b.id})">Remove</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddBatchModal() {
  document.getElementById('batch-modal-title').textContent = 'Add Batch';
  document.getElementById('batch-id').value = '';
  ['b-name','b-subject','b-start','b-end','b-fee'].forEach(id =>
    document.getElementById(id).value = '');
  document.querySelectorAll('#days-picker input').forEach(cb => cb.checked = false);
  openModal('batch-modal');
}

function editBatch(id) {
  const b = allBatches.find(x => x.id === id);
  if (!b) return;
  document.getElementById('batch-modal-title').textContent = 'Edit Batch';
  document.getElementById('batch-id').value  = b.id;
  document.getElementById('b-name').value    = b.name;
  document.getElementById('b-subject').value = b.subject || '';
  document.getElementById('b-start').value   = b.startTime ? b.startTime.substring(0,5) : '';
  document.getElementById('b-end').value     = b.endTime   ? b.endTime.substring(0,5)   : '';
  document.getElementById('b-fee').value     = b.monthlyFee;
  const days = (b.scheduleDays || '').split(',');
  document.querySelectorAll('#days-picker input').forEach(cb => {
    cb.checked = days.includes(cb.value);
  });
  openModal('batch-modal');
}

async function saveBatch() {
  const id   = document.getElementById('batch-id').value;
  const days = [...document.querySelectorAll('#days-picker input:checked')]
    .map(c => c.value).join(',');
  const body = {
    name:         document.getElementById('b-name').value.trim(),
    subject:      document.getElementById('b-subject').value.trim(),
    startTime:    document.getElementById('b-start').value || null,
    endTime:      document.getElementById('b-end').value || null,
    monthlyFee:   parseFloat(document.getElementById('b-fee').value) || 0,
    scheduleDays: days || null,
  };
  if (!body.name) { showToast('Batch name is required', 'error'); return; }
  try {
    if (id) { await API.updateBatch(id, body); showToast('Batch updated'); }
    else    { await API.createBatch(body);      showToast('Batch created'); }
    closeModal('batch-modal');
    loadBatches();
  } catch (e) { showToast('Failed to save batch', 'error'); }
}

async function removeBatch(id) {
  if (!confirm('Remove this batch?')) return;
  try {
    await API.deleteBatch(id);
    showToast('Batch removed');
    loadBatches();
  } catch (e) { showToast('Failed to remove batch', 'error'); }
}
