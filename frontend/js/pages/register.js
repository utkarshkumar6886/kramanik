/* ============================================================
   KRAMANIK — Register Page Logic
   ============================================================ */

if (localStorage.getItem('kramanik_token')) {
  window.location.href = 'dashboard.html';
}

async function doRegister() {
  const name      = document.getElementById('r-institute').value.trim();
  const email     = document.getElementById('r-email').value.trim();
  const phone     = document.getElementById('r-phone').value.trim();
  const address   = document.getElementById('r-address').value.trim();
  const adminName = document.getElementById('r-admin').value.trim();
  const password  = document.getElementById('r-password').value;
  const confirm   = document.getElementById('r-confirm').value;
  const errEl     = document.getElementById('reg-error');
  const succEl    = document.getElementById('reg-success');

  errEl.style.display  = 'none';
  succEl.style.display = 'none';

  if (!name || !email || !phone || !adminName || !password) {
    showError('Please fill all required fields.'); return;
  }
  if (password.length < 6) {
    showError('Password must be at least 6 characters.'); return;
  }
  if (password !== confirm) {
    showError('Passwords do not match.'); return;
  }

  const btn = document.getElementById('reg-btn');
  btn.disabled     = true;
  btn.textContent  = 'Creating account...';

  try {
    await API.register({ instituteName: name, email, phone, address, adminName, password });
    succEl.textContent  = '✓ Account created! Redirecting to login...';
    succEl.style.display = 'block';
    setTimeout(() => window.location.href = 'index.html', 2000);
  } catch (e) {
    const msg = e.message || 'Registration failed. Please try again.';
    showError(msg);
    btn.disabled    = false;
    btn.textContent = 'Create Account →';
  }
}

function showError(msg) {
  const errEl = document.getElementById('reg-error');
  errEl.textContent   = msg;
  errEl.style.display = 'block';
}
