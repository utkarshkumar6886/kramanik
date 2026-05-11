/* ============================================================
   KRAMANIK — Login Page Logic
   ============================================================ */

// Redirect if already logged in
if (localStorage.getItem('kramanik_token')) {
  window.location.href = 'dashboard.html';
}

async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.style.display = 'none';

  if (!email || !password) {
    errEl.textContent = 'Please enter email and password.';
    errEl.style.display = 'block';
    return;
  }

  try {
    const data = await API.login(email, password);
    localStorage.setItem('kramanik_token', data.token);
    localStorage.setItem('kramanik_email', email);
    window.location.href = 'dashboard.html';
  } catch (e) {
    errEl.textContent    = 'Invalid email or password.';
    errEl.style.display  = 'block';
  }
}
