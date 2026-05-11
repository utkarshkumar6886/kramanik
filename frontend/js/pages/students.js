/* ============================================================
   KRAMANIK — Students Page Logic
   ============================================================ */

let allStudents = [];

function initStudents() {
  requireAuth();

  document.getElementById('layout').innerHTML = `
    ${renderSidebar('students')}
    <main class="main">
      <div class="page-header">
        <div>
          <div class="page-title">Students</div>
          <div class="page-subtitle">Manage all enrolled students</div>
        </div>
        <button class="btn btn-primary" onclick="openAddStudentModal()">+ Add Student</button>
      </div>
      <div class="content-area page-enter">
        <div class="table-card">
          <div class="table-header">
            <div class="table-title">All Students</div>
            <div class="table-actions">
              <input class="search-input" placeholder="Search by name, phone..."
                     oninput="filterStudents(this.value)" />
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Phone</th><th>Parent</th>
                <th>Parent Phone</th><th>Joined</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="students-table">${loadingRow(8)}</tbody>
          </table>
        </div>
      </div>
    </main>
  `;

  initUserInfo();
  initModalClose();
  loadStudents();
}

async function loadStudents() {
  allStudents = await API.getStudents() || [];
  renderStudentsTable(allStudents);
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('students-table');
  if (!students.length) {
    tbody.innerHTML = emptyRow(8, 'No students yet. Add your first student!');
    return;
  }
  tbody.innerHTML = students.map((s, i) => `
    <tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td><strong>${s.name}</strong></td>
      <td>${s.phone || '—'}</td>
      <td>${s.parentName || '—'}</td>
      <td>${s.parentPhone || '—'}</td>
      <td>${fmtDate(s.joinDate)}</td>
      <td>${s.active
        ? '<span class="badge badge-green">Active</span>'
        : '<span class="badge badge-muted">Inactive</span>'}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-ghost btn-sm" onclick="editStudent(${s.id})">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="openEnrollModal(${s.id},'${s.name}')">Batches</button>
              <button class="btn btn-danger btn-sm" onclick="removeStudent(${s.id})">Remove</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterStudents(q) {
  const lq = q.toLowerCase();
  renderStudentsTable(allStudents.filter(s =>
    s.name.toLowerCase().includes(lq) ||
    (s.phone || '').includes(q) ||
    (s.parentName || '').toLowerCase().includes(lq)
  ));
}

function openAddStudentModal() {
  document.getElementById('student-modal-title').textContent = 'Add Student';
  document.getElementById('student-id').value = '';
  ['s-name','s-phone','s-parent-name','s-parent-phone',
   's-whatsapp','s-email','s-dob','s-address'].forEach(id =>
    document.getElementById(id).value = '');
  document.getElementById('s-join').value = today();
  openModal('student-modal');
}

function editStudent(id) {
  const s = allStudents.find(x => x.id === id);
  if (!s) return;
  document.getElementById('student-modal-title').textContent = 'Edit Student';
  document.getElementById('student-id').value       = s.id;
  document.getElementById('s-name').value           = s.name;
  document.getElementById('s-phone').value          = s.phone || '';
  document.getElementById('s-parent-name').value    = s.parentName || '';
  document.getElementById('s-parent-phone').value   = s.parentPhone || '';
  document.getElementById('s-whatsapp').value       = s.parentWhatsapp || '';
  document.getElementById('s-email').value          = s.email || '';
  document.getElementById('s-dob').value            = s.dateOfBirth || '';
  document.getElementById('s-join').value           = s.joinDate || '';
  document.getElementById('s-address').value        = s.address || '';
  openModal('student-modal');
}

async function saveStudent() {
  const id   = document.getElementById('student-id').value;
  const body = {
    name:           document.getElementById('s-name').value.trim(),
    phone:          document.getElementById('s-phone').value.trim(),
    parentName:     document.getElementById('s-parent-name').value.trim(),
    parentPhone:    document.getElementById('s-parent-phone').value.trim(),
    parentWhatsapp: document.getElementById('s-whatsapp').value.trim(),
    email:          document.getElementById('s-email').value.trim(),
    dateOfBirth:    document.getElementById('s-dob').value || null,
    joinDate:       document.getElementById('s-join').value || today(),
    address:        document.getElementById('s-address').value.trim(),
  };
  if (!body.name) { showToast('Name is required', 'error'); return; }
  try {
    if (id) {
      await API.updateStudent(id, body);
      showToast('Student updated successfully');
    } else {
      await API.createStudent(body);
      showToast('Student added successfully');
    }
    closeModal('student-modal');
    loadStudents();
  } catch (e) { showToast('Failed to save student', 'error'); }
}

async function removeStudent(id) {
  if (!confirm('Remove this student? This action cannot be undone.')) return;
  try {
    await API.deleteStudent(id);
    showToast('Student removed');
    loadStudents();
  } catch (e) { showToast('Failed to remove student', 'error'); }
}

// ── ENROLLMENT ────────────────────────────────────────────────
let enrollBatches   = [];
let enrollStudentId = null;

async function openEnrollModal(studentId, studentName) {
  enrollStudentId = studentId;
  document.getElementById('enroll-student-name').textContent = studentName;

  // Load all batches + current enrollments in parallel
  const [batches, enrollments] = await Promise.all([
    API.getBatches(),
    API.getEnrollmentsByStudent(studentId)
  ]);
  enrollBatches = batches || [];
  const enrolledIds = new Set((enrollments || []).map(e => e.batch?.id));

  const list = document.getElementById('enroll-batch-list');
  if (!enrollBatches.length) {
    list.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px">No batches found. Create a batch first.</div>';
  } else {
    list.innerHTML = enrollBatches.map(b => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
        <div>
          <div style="font-size:13px;font-weight:500">${b.name}</div>
          <div style="font-size:11px;color:var(--muted)">${b.subject || ''} · ₹${fmt(b.monthlyFee)}/mo</div>
        </div>
        ${enrolledIds.has(b.id)
          ? `<button class="btn btn-danger btn-sm" onclick="doUnenroll(${b.id},'${b.name}')">Remove</button>`
          : `<button class="btn btn-success btn-sm" onclick="doEnroll(${b.id},'${b.name}')">Enroll</button>`
        }
      </div>`).join('');
  }
  openModal('enroll-modal');
}

async function doEnroll(batchId, batchName) {
  try {
    await API.enroll(enrollStudentId, batchId);
    showToast(`Enrolled in ${batchName}`);
    openEnrollModal(enrollStudentId, document.getElementById('enroll-student-name').textContent);
  } catch (e) { showToast(e.message || 'Enrollment failed', 'error'); }
}

async function doUnenroll(batchId, batchName) {
  if (!confirm(`Remove from ${batchName}?`)) return;
  try {
    await API.unenroll(enrollStudentId, batchId);
    showToast(`Removed from ${batchName}`);
    openEnrollModal(enrollStudentId, document.getElementById('enroll-student-name').textContent);
  } catch (e) { showToast(e.message || 'Failed to remove', 'error'); }
}
