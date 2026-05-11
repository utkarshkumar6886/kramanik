/* ============================================================
   KRAMANIK — API Helper
   ============================================================ */

// API_BASE is defined in js/config.js (loaded before this file)

function getToken() {
  return localStorage.getItem('kramanik_token') || '';
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

async function apiCall(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 401) {
    localStorage.removeItem('kramanik_token');
    window.location.href = 'index.html';
    return null;
  }
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      errMsg = errBody.error || errBody.message || errMsg;
      if (res.status === 402 && typeof showUpgradeBanner === 'function') {
        showUpgradeBanner(errMsg);
      }
    } catch (e) {
      errMsg = await res.text().catch(() => errMsg);
    }
    throw new Error(errMsg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Convenience methods ──────────────────────────────────────
const API = {
  // Auth
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.ok ? r.json() : Promise.reject(r)),

  // Students
  getStudents:   ()       => apiCall('/students'),
  getStudent:    (id)     => apiCall(`/students/${id}`),
  createStudent: (data)   => apiCall('/students', 'POST', data),
  updateStudent: (id, d)  => apiCall(`/students/${id}`, 'PUT', d),
  deleteStudent: (id)     => apiCall(`/students/${id}`, 'DELETE'),

  // Batches
  getBatches:   ()       => apiCall('/batches'),
  getBatch:     (id)     => apiCall(`/batches/${id}`),
  createBatch:  (data)   => apiCall('/batches', 'POST', data),
  updateBatch:  (id, d)  => apiCall(`/batches/${id}`, 'PUT', d),
  deleteBatch:  (id)     => apiCall(`/batches/${id}`, 'DELETE'),

  // Fees
  getPendingFees:  ()     => apiCall('/fees/pending'),
  getFeeSummary:   (m)    => apiCall(`/fees/summary${m ? '?month=' + m : ''}`),
  getStudentFees:  (sid)  => apiCall(`/fees/student/${sid}`),
  createFee:       (data) => apiCall('/fees', 'POST', data),
  recordPayment:   (id, d)=> apiCall(`/fees/${id}/pay`, 'POST', d),

  // Attendance
  markAttendance:  (data) => apiCall('/attendance', 'POST', data),
  getAttendance:   (batchId, date) =>
    apiCall(`/attendance?batchId=${batchId}&date=${date}`),
  getStudentAttendance: (studentId, batchId) =>
    apiCall(`/attendance/student/${studentId}?batchId=${batchId}`),
  getAttendanceSummary: (batchId, month) =>
    apiCall(`/attendance/summary?batchId=${batchId}&month=${month}`),

  // Notifications (WhatsApp reminders - logged only in MVP)
  sendFeeReminders: (data) => apiCall('/notifications/fee-reminder', 'POST', data),
  getNotifications: () => apiCall('/notifications'),
};

  // Institute & Plans (Sprint 5)
  register:               (data)        => fetch(`${API_BASE}/public/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(async r => {
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Registration failed'); }
    return r.json();
  }),
  getInstituteProfile:    ()            => apiCall('/institute/me'),
  upgradePlan:            (plan, ref)   => apiCall('/institute/upgrade', 'PUT', { plan, paymentReference: ref }),
  getSubscriptionHistory: ()            => apiCall('/institute/subscriptions'),

  // Payments / Razorpay (Sprint 7)
  createPaymentOrder: (plan)   => apiCall('/payments/create-order', 'POST', { plan }),
  verifyPayment:      (data)   => apiCall('/payments/verify', 'POST', data),

  // Enrollments (Sprint 9)
  getEnrollmentsByBatch:   (batchId)   => apiCall(`/enrollments/batch/${batchId}`),
  getEnrollmentsByStudent: (studentId) => apiCall(`/enrollments/student/${studentId}`),
  enroll:                  (studentId, batchId) => apiCall('/enrollments', 'POST', { studentId, batchId }),
  unenroll:                (studentId, batchId) => apiCall('/enrollments', 'DELETE', { studentId, batchId }),
  getEnrolledStudents:     (batchId)   => apiCall(`/attendance/enrolled?batchId=${batchId}`),
