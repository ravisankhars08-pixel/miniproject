// ══════════════════════════════════════════════
//  PlaySlot — login.js
// ══════════════════════════════════════════════

// ── MOBILE NAV TOGGLE ──
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
}

// ── TAB SWITCHING (Login ↔ Sign Up) ──
function switchTab(tab) {
  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabLogin   = document.getElementById('tabLogin');
  const tabSignup  = document.getElementById('tabSignup');

  if (tab === 'login') {
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    clearMessage('loginMsg');
  } else {
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    clearMessage('signupMsg');
  }
}

// ── PASSWORD VISIBILITY TOGGLE ──
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'HIDE';
  } else {
    input.type = 'password';
    btn.textContent = 'SHOW';
  }
}

// ── MESSAGE HELPERS ──
function showMessage(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'form-message ' + type;   // 'error' or 'success'
}

function clearMessage(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.className = 'form-message';
}

// ── USER STORAGE HELPERS ──
const API_URL = 'http://localhost:5000/api';

function saveSession(user, token) {
  const session = { name: user.name, role: user.role, token: token };
  localStorage.setItem('ps_session', JSON.stringify(session));
}

function getSession() {
  return JSON.parse(localStorage.getItem('ps_session') || 'null');
}

// ── INPUT VALIDATION ──
function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── LOGIN ──
async function loginUser() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe').checked;

  clearMessage('loginMsg');

  if (!email || !password) {
    showMessage('loginMsg', 'Please enter your email and password.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      showMessage('loginMsg', data.msg || 'Login failed', 'error');
      return;
    }

    saveSession(data.user, data.token);

    if (remember) {
      localStorage.setItem('ps_remember', email);
    } else {
      localStorage.removeItem('ps_remember');
    }

    showMessage('loginMsg', `Welcome back, ${data.user.name}! Redirecting…`, 'success');

    setTimeout(() => {
      if (data.user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        const returnTo = sessionStorage.getItem('ps_return') || 'index.html';
        sessionStorage.removeItem('ps_return');
        window.location.href = returnTo;
      }
    }, 900);
  } catch (err) {
    showMessage('loginMsg', 'Network error. Make sure backend is running.', 'error');
  }
}

// ── SIGN UP ──
async function signupUser() {
  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const phone    = document.getElementById('signupPhone').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm  = document.getElementById('signupConfirm').value;

  clearMessage('signupMsg');

  if (!name || !email || !phone || !password || !confirm) {
    showMessage('signupMsg', 'All fields are required.', 'error');
    return;
  }

  if (name.length < 2) {
    showMessage('signupMsg', 'Please enter your full name.', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showMessage('signupMsg', 'Please enter a valid email address.', 'error');
    return;
  }

  if (!isValidPhone(phone)) {
    showMessage('signupMsg', 'Enter a valid 10-digit Indian mobile number.', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('signupMsg', 'Password must be at least 6 characters.', 'error');
    return;
  }

  if (password !== confirm) {
    showMessage('signupMsg', 'Passwords do not match.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      showMessage('signupMsg', data.msg || 'Registration failed', 'error');
      return;
    }

    saveSession(data.user, data.token);

    showMessage('signupMsg', `Account created! Welcome, ${name}! Redirecting…`, 'success');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 900);
  } catch(err) {
    showMessage('signupMsg', 'Network error. Make sure backend is running.', 'error');
  }
}

// ── ENTER KEY SUPPORT ──
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter') return;
  const loginActive = document.getElementById('loginForm').classList.contains('active');
  if (loginActive) {
    loginUser();
  } else {
    signupUser();
  }
});

// ── RESTORE REMEMBERED EMAIL ──
window.addEventListener('DOMContentLoaded', async function () {
  const remembered = localStorage.getItem('ps_remember');
  if (remembered) {
    const emailInput = document.getElementById('loginEmail');
    const rememberBox   = document.getElementById('rememberMe');
    if (emailInput) emailInput.value = remembered;
    if (rememberBox)   rememberBox.checked = true;
  }

  // If already logged in, verify with backend before skipping login page
  const session = getSession();
  if (session && session.token) {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'x-auth-token': session.token }
      });
      if (res.ok) {
        const user = await res.json();
        if (user.role === 'admin') window.location.href = 'admin.html';
        else window.location.href = 'index.html';
      } else {
        localStorage.removeItem('ps_session');
      }
    } catch (err) {
      console.error('Auth verification failed', err);
    }
  }
});