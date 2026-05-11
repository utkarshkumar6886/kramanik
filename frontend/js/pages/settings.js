/* ============================================================
   KRAMANIK — Settings Page Logic (Sprint 7: Razorpay)
   ============================================================ */

const PLAN_PRICES = {
  FREE:  { label: 'Free',  price: '₹0',   color: 'var(--muted)',  desc: 'Get started — no credit card needed' },
  BASIC: { label: 'Basic', price: '₹499', color: 'var(--blue)',   desc: 'Growing institutes up to 100 students' },
  PRO:   { label: 'Pro',   price: '₹999', color: 'var(--accent)', desc: 'Unlimited everything + WhatsApp + Reports' },
};

const PLAN_FEATURES = {
  FREE:  { students: '30',  batches: '2',  whatsapp: false, reports: false },
  BASIC: { students: '100', batches: '10', whatsapp: true,  reports: false },
  PRO:   { students: '∞',  batches: '∞',  whatsapp: true,  reports: true  },
};

let profileData = null;

function initSettings() {
  requireAuth();

  document.getElementById('layout').innerHTML = `
    ${renderSidebar('settings')}
    <main class="main">
      <div class="page-header">
        <div>
          <div class="page-title">Settings</div>
          <div class="page-subtitle">Manage your institute profile and subscription plan</div>
        </div>
      </div>
      <div class="content-area page-enter">
        <div class="settings-section">
          <div class="settings-title">Institute Profile</div>
          <div class="settings-card" id="profile-card">
            <div style="text-align:center;padding:40px"><span class="spinner"></span></div>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-title">Current Plan</div>
          <div class="settings-card" id="plan-card">
            <div style="text-align:center;padding:40px"><span class="spinner"></span></div>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-title">Available Plans</div>
          <div class="plan-grid" id="plan-grid"></div>
        </div>
        <div class="settings-section">
          <div class="settings-title">Billing History</div>
          <div class="table-card">
            <table>
              <thead>
                <tr><th>Plan</th><th>Started</th><th>Expires</th><th>Amount</th><th>Reference</th><th>Status</th></tr>
              </thead>
              <tbody id="billing-table">${loadingRow(6)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  `;

  initUserInfo();
  loadSettings();
}

async function loadSettings() {
  const [profile, history] = await Promise.all([
    API.getInstituteProfile(),
    API.getSubscriptionHistory()
  ]);
  profileData = profile;
  if (profile) { renderProfile(profile); renderCurrentPlan(profile); renderPlanGrid(profile.plan); }
  if (history)   renderBillingHistory(history);
}

function renderProfile(p) {
  document.getElementById('profile-card').innerHTML = `
    <div class="grid-2" style="gap:20px;">
      <div class="kv-list">
        <div class="kv-row"><span class="kv-key">Institute Name</span><span class="kv-val">${p.name}</span></div>
        <div class="kv-row"><span class="kv-key">Email</span><span class="kv-val">${p.email}</span></div>
        <div class="kv-row"><span class="kv-key">Phone</span><span class="kv-val">${p.phone}</span></div>
        <div class="kv-row"><span class="kv-key">Address</span><span class="kv-val">${p.address || '—'}</span></div>
      </div>
      <div>
        <div style="margin-bottom:16px;">
          <div class="stat-label" style="margin-bottom:8px">Students Used</div>
          <div style="font-size:24px;font-weight:700;font-family:var(--font-head)">
            ${p.studentCount}<span style="font-size:14px;color:var(--muted);font-weight:400"> / ${p.maxStudents === -1 ? '∞' : p.maxStudents}</span>
          </div>
          <div class="fee-bar" style="margin-top:8px">
            <div class="fee-bar-fill" style="width:${p.maxStudents===-1?10:Math.min(100,(p.studentCount/p.maxStudents)*100)}%;background:var(--blue)"></div>
          </div>
        </div>
        <div>
          <div class="stat-label" style="margin-bottom:8px">Batches Used</div>
          <div style="font-size:24px;font-weight:700;font-family:var(--font-head)">
            ${p.batchCount}<span style="font-size:14px;color:var(--muted);font-weight:400"> / ${p.maxBatches === -1 ? '∞' : p.maxBatches}</span>
          </div>
          <div class="fee-bar" style="margin-top:8px">
            <div class="fee-bar-fill" style="width:${p.maxBatches===-1?10:Math.min(100,(p.batchCount/p.maxBatches)*100)}%;background:var(--accent)"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function renderCurrentPlan(p) {
  const plan = PLAN_PRICES[p.plan];
  const feat = PLAN_FEATURES[p.plan];
  document.getElementById('plan-card').innerHTML = `
    <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
      <div>
        <div style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px">Active Plan</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="plan-badge plan-badge-${p.plan.toLowerCase()}">${plan.label}</span>
          <span style="font-family:var(--font-head);font-size:28px;font-weight:700">${plan.price}<span style="font-size:14px;font-weight:400;color:var(--muted)">/mo</span></span>
        </div>
        <div style="font-size:13px;color:var(--muted);margin-top:4px">${plan.desc}</div>
      </div>
      <div style="flex:1;min-width:200px;">
        <div class="features-list">
          <div class="feature-row"><span class="feature-icon">👥</span> Up to ${feat.students} students</div>
          <div class="feature-row"><span class="feature-icon">📚</span> Up to ${feat.batches} batches</div>
          <div class="feature-row ${feat.whatsapp?'':'feature-locked'}">
            <span class="feature-icon">${feat.whatsapp?'✅':'🔒'}</span>
            WhatsApp notifications ${feat.whatsapp?'':'<span class="upgrade-hint">— Upgrade to Basic</span>'}
          </div>
          <div class="feature-row ${feat.reports?'':'feature-locked'}">
            <span class="feature-icon">${feat.reports?'✅':'🔒'}</span>
            Monthly reports ${feat.reports?'':'<span class="upgrade-hint">— Upgrade to Pro</span>'}
          </div>
        </div>
      </div>
    </div>`;
}

function renderPlanGrid(currentPlan) {
  const order = ['FREE','BASIC','PRO'];
  document.getElementById('plan-grid').innerHTML = order.map(key => {
    const p        = PLAN_PRICES[key];
    const feat     = PLAN_FEATURES[key];
    const isCurrent = key === currentPlan;
    const isLower   = order.indexOf(key) < order.indexOf(currentPlan);
    return `
      <div class="plan-card ${isCurrent?'plan-current':''} ${key==='PRO'?'plan-featured':''}">
        ${key==='PRO'?'<div class="plan-popular">Most Popular</div>':''}
        <div class="plan-name">${p.label}</div>
        <div class="plan-price">${p.price}<span class="plan-period">/month</span></div>
        <div class="plan-desc">${p.desc}</div>
        <ul class="plan-features">
          <li>👥 ${feat.students} students</li>
          <li>📚 ${feat.batches} batches</li>
          <li>${feat.whatsapp?'✅':'❌'} WhatsApp reminders</li>
          <li>${feat.reports ?'✅':'❌'} Monthly reports</li>
        </ul>
        ${isCurrent
          ? '<button class="btn btn-ghost btn-block" disabled>✓ Current Plan</button>'
          : isLower
          ? '<button class="btn btn-ghost btn-block" disabled>Downgrade not available</button>'
          : `<button class="btn btn-primary btn-block" onclick="startRazorpayCheckout('${key}')">Upgrade to ${p.label} →</button>`
        }
      </div>`;
  }).join('');
}

function renderBillingHistory(history) {
  const tbody = document.getElementById('billing-table');
  if (!history.length) { tbody.innerHTML = emptyRow(6, 'No billing history yet.'); return; }
  tbody.innerHTML = history.map(h => `
    <tr>
      <td><span class="plan-badge plan-badge-${h.plan.toLowerCase()}">${h.plan}</span></td>
      <td>${fmtDate(h.startedOn)}</td>
      <td>${h.expiresOn ? fmtDate(h.expiresOn) : '—'}</td>
      <td>${h.amountPaid ? '₹' + fmt(h.amountPaid) : 'Free'}</td>
      <td><code style="font-size:11px;color:var(--muted)">${h.paymentReference || '—'}</code></td>
      <td><span class="badge ${h.status==='ACTIVE'?'badge-green':h.status==='EXPIRED'?'badge-muted':'badge-red'}">${h.status}</span></td>
    </tr>`).join('');
}

// ── RAZORPAY CHECKOUT ─────────────────────────────────────────
async function startRazorpayCheckout(plan) {
  try {
    const order = await API.createPaymentOrder(plan);

    const options = {
      key:          order.keyId,
      amount:       order.amount,
      currency:     order.currency,
      name:         'Kramanik',
      description:  `Upgrade to ${plan} Plan`,
      order_id:     order.orderId,
      prefill: {
        name:  profileData?.name  || '',
        email: profileData?.email || '',
        contact: profileData?.phone || ''
      },
      theme: { color: '#f5a623' },
      handler: async (response) => {
        // Payment succeeded — verify on server
        await verifyAndActivate(plan, response);
      },
      modal: {
        ondismiss: () => showToast('Payment cancelled', 'warn')
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (e) {
    showToast(e.message || 'Could not initiate payment', 'error');
  }
}

async function verifyAndActivate(plan, rzpResponse) {
  try {
    const result = await API.verifyPayment({
      orderId:   rzpResponse.razorpay_order_id,
      paymentId: rzpResponse.razorpay_payment_id,
      signature: rzpResponse.razorpay_signature,
      plan
    });
    showToast(`✓ ${result.message}`);
    loadSettings();
  } catch (e) {
    showToast('Payment verification failed. Contact support.', 'error');
  }
}
