// ── AUTH & NAV UPDATE (GLOBAL) ──
async function verifyAndUpdateNav() {
  const session = JSON.parse(localStorage.getItem('ps_session'));
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  if (session && session.token) {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'x-auth-token': session.token }
      });
      if (res.ok) {
        const user = await res.json();
        
        // Update "Login" -> "Logout"
        const loginLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase() === 'login');
        if (loginLink) {
          loginLink.textContent = 'Logout';
          loginLink.href = '#';
          loginLink.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('ps_session');
            window.location.reload();
          };
        }

        // Treat Admin differently: Update "Book Now" -> "Admin Dashboard"
        const ctaLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.classList.contains('cta'));
        if (user.role === 'admin') {
          if (ctaLink) {
            ctaLink.textContent = 'Admin Dashboard ⚙️';
            ctaLink.href = 'admin.html';
          }
        } else if (user.role === 'user') {
          // It's a regular user -> Add My Bookings link next to Login (Logout)
          if (!Array.from(navLinks.querySelectorAll('a')).find(a => a.textContent.trim() === 'My Bookings')) {
            const bookingsLink = document.createElement('a');
            bookingsLink.href = 'status.html';
            bookingsLink.textContent = 'My Bookings';
            if (loginLink && loginLink.parentNode) {
              loginLink.parentNode.insertBefore(bookingsLink, loginLink);
            } else {
              navLinks.appendChild(bookingsLink);
            }
          }
        }
      } else {
        localStorage.removeItem('ps_session');
      }
    } catch (err) {
      console.error('Failed to verify session:', err);
    }
  }
}

document.addEventListener('DOMContentLoaded', verifyAndUpdateNav);
