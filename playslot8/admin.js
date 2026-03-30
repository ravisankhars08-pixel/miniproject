const API_URL = 'http://localhost:5000/api';

let adminLocations = [];
let adminTurfs = [];
let adminBookings = [];
let currentBookingFilter = 'all';

// Get Token
function getToken() {
  const session = JSON.parse(localStorage.getItem('ps_session'));
  return session ? session.token : null;
}

// Check auth
window.addEventListener('DOMContentLoaded', async () => {
  const session = JSON.parse(localStorage.getItem('ps_session'));
  if (!session || !session.token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'x-auth-token': session.token }
    });
    if (!res.ok) {
      localStorage.removeItem('ps_session');
      window.location.href = 'login.html';
      return;
    }
    const user = await res.json();
    if (user.role !== 'admin') {
      localStorage.removeItem('ps_session');
      window.location.href = 'login.html';
      return;
    }
    fetchData();
  } catch (err) {
    console.error('Auth check failed:', err);
    window.location.href = 'login.html';
  }
});

// ── FETCH DATA FROM BACKEND ──
async function fetchData() {
  try {
    const token = getToken();
    const headers = { 'x-auth-token': token };

    // Fetch locations (public route, no auth needed but here we use it anyway or admin route)
    let res = await fetch(`${API_URL}/locations`, { headers });
    adminLocations = await res.json();

    // Fetch turfs
    res = await fetch(`${API_URL}/turfs`, { headers });
    adminTurfs = await res.json();

    // Fetch bookings (admin route)
    res = await fetch(`${API_URL}/admin/bookings`, { headers });
    adminBookings = await res.json();
    
    // Fetch dashboard stats
    res = await fetch(`${API_URL}/admin/stats`, { headers });
    const stats = await res.json();

    document.getElementById('statLocations').textContent = stats.locCount || adminLocations.length;
    document.getElementById('statTurfs').textContent     = stats.turfCount || adminTurfs.length;
    document.getElementById('statBookings').textContent  = stats.bookingCount || adminBookings.length;
    document.getElementById('statRevenue').textContent   = `₹${(stats.revenue || 0).toLocaleString()}`;

    // Re-render open tabs
    renderLocations();
    renderTurfs();
    renderBookings();

  } catch(err) {
    console.error("Error fetching data:", err);
    alert('Failed to connect to backend.');
  }
}

// ── TAB SWITCHING ──
function switchTab(tabId, el) {
  document.querySelectorAll('.admin-sidebar li').forEach(li => li.classList.remove('active'));
  el.classList.add('active');

  document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active-tab'));
  document.getElementById(tabId).classList.add('active-tab');

  if (tabId === 'locationsTab') renderLocations();
  if (tabId === 'turfsTab')     renderTurfs();
  if (tabId === 'bookingsTab')  renderBookings();
  if (tabId === 'reviewsTab')   fetchReviews();
  if (tabId === 'dashboardTab') fetchData(); // Refresh stats
}

// ── RENDER TABLES ──

// LOCATIONS
function renderLocations() {
  const tbody = document.getElementById('locationsTableBody');
  tbody.innerHTML = '';
  
  if (!Array.isArray(adminLocations)) return;
  adminLocations.forEach(loc => {
    tbody.innerHTML += `
      <tr>
        <td style="font-size: 1.5rem;">${loc.icon}</td>
        <td><strong>${loc.name}</strong></td>
        <td>${loc.turfsCount || 0} Turfs</td>
        <td>
          <button class="action-btn btn-delete" onclick="deleteLocation('${loc._id}')">🗑️ Delete</button>
        </td>
      </tr>
    `;
  });
}

// TURFS
function renderTurfs() {
  const tbody = document.getElementById('turfsTableBody');
  tbody.innerHTML = '';
  
  if (!Array.isArray(adminTurfs)) return;
  adminTurfs.forEach(turf => {
    // Ensure sports is a string before splitting
    const sportsStr = typeof turf.sports === 'string' ? turf.sports : (Array.isArray(turf.sports) ? turf.sports.join(', ') : 'Football');
    const locName = turf.location ? turf.location.name : 'Unknown';
    tbody.innerHTML += `
      <tr>
        <td><strong>${turf.name}</strong></td>
        <td>📍 ${locName}</td>
        <td>${sportsStr}</td>
        <td>₹${turf.pricePerHour}/hr</td>
        <td>
          <button class="action-btn btn-delete" onclick="deleteTurf('${turf._id}')">🗑️ Delete</button>
        </td>
      </tr>
    `;
  });
}

// BOOKINGS
function renderBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  tbody.innerHTML = '';
  
  if (!Array.isArray(adminBookings) || adminBookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No bookings found.</td></tr>`;
    return;
  }

  let filtered = [...adminBookings].reverse();
  if (currentBookingFilter !== 'all') {
    filtered = filtered.filter(b => b.status === currentBookingFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No ${currentBookingFilter} bookings found.</td></tr>`;
    return;
  }

  filtered.forEach((b) => {
    const userName = b.user ? b.user.name : 'Unknown User';
    const turfName = b.turf ? b.turf.name : 'Unknown Turf';
    
    tbody.innerHTML += `
      <tr>
        <td><strong><small>${b._id}</small></strong></td>
        <td><small>${b.date}</small><br/>${b.slot}</td>
        <td>${turfName}</td>
        <td><strong>${userName}</strong><br/><small style="color:var(--acid); text-transform:uppercase;">${b.status}</small></td>
        <td><strong>₹${b.totalPrice}</strong></td>
        <td>
          <button class="action-btn btn-delete" onclick="deleteBooking('${b._id}')">🚫 Cancel</button>
        </td>
      </tr>
    `;
  });
}

function filterBookings(status) {
  currentBookingFilter = status;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`.filter-tab[data-filter="${status}"]`);
  if (activeTab) activeTab.classList.add('active');
  renderBookings();
}

// REVIEWS
async function fetchReviews() {
  const turfId = document.getElementById('reviewTurfFilter').value;
  const token = getToken();
  try {
    const res = await fetch(`${API_URL}/admin/reviews?turfId=${turfId}`, {
      headers: { 'x-auth-token': token }
    });
    const reviews = await res.json();
    renderReviews(reviews);
    
    // Fill the turf filter dropdown if it's currently showing "All"
    const filter = document.getElementById('reviewTurfFilter');
    if (filter.options.length <= 1) {
      adminTurfs.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t._id;
        opt.textContent = t.name;
        filter.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error fetching reviews:', err);
  }
}

function renderReviews(reviews) {
  const tbody = document.getElementById('reviewsTableBody');
  tbody.innerHTML = '';
  
  if (reviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No reviews found.</td></tr>';
    return;
  }

  reviews.forEach(r => {
    const userDisplay = r.user ? `${r.user.name}<br/><small>${r.user.email}</small>` : 'Unknown';
    const turfName = r.turf ? r.turf.name : 'Unknown';
    const stars = '★'.repeat(r.rating);
    const verifyIcon = r.isVerified ? '✅ VERIFIED' : '❓ UNVERIFIED';

    tbody.innerHTML += `
      <tr>
        <td><strong>${userDisplay}</strong></td>
        <td>${turfName}</td>
        <td><span style="color:var(--acid);">${stars}</span></td>
        <td style="max-width:300px; font-size:0.9rem;">${r.comment}</td>
        <td>
           <div style="display:flex; flex-direction:column; gap:5px;">
             <button class="action-btn" onclick="verifyReview('${r._id}')">${verifyIcon}</button>
             <button class="action-btn btn-delete" onclick="deleteReview('${r._id}')">🗑️ Delete</button>
           </div>
        </td>
      </tr>
    `;
  });
}

async function verifyReview(id) {
  try {
    const res = await fetch(`${API_URL}/admin/reviews/${id}/verify`, {
      method: 'PATCH',
      headers: { 'x-auth-token': getToken() }
    });
    if (res.ok) fetchReviews();
  } catch (err) {
    console.error('Error verifying review:', err);
  }
}

async function deleteReview(id) {
  if (!confirm('Permanently delete this review?')) return;
  try {
    const res = await fetch(`${API_URL}/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': getToken() }
    });
    if (res.ok) fetchReviews();
  } catch (err) {
    console.error('Error deleting review:', err);
  }
}

// ── ACTIONS ──

// Location Actions
async function addLocation() {
  const name = document.getElementById('locName').value.trim();
  const icon = document.getElementById('locIcon').value.trim() || '📍';
  if (!name) return alert('Name is required!');
  
  try {
    const res = await fetch(`${API_URL}/admin/locations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': getToken()
      },
      body: JSON.stringify({ name, icon })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Failed to add location');
    
    closeModal('locationModal');
    document.getElementById('locName').value = ''; 
    document.getElementById('locIcon').value = '';
    fetchData();
  } catch(err) {
    alert(err.message);
  }
}

async function deleteLocation(id) {
  if (!confirm('Are you sure you want to delete this location?')) return;
  try {
    await fetch(`${API_URL}/admin/locations/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': getToken() }
    });
    fetchData();
  } catch(err) {
    alert('Failed to delete location');
  }
}

// Turf Actions
async function addTurf() {
  const nameInput  = document.getElementById('turfName');
  const locDrop    = document.getElementById('turfLocation');
  const sportsIn   = document.getElementById('turfSports');
  const priceIn    = document.getElementById('turfPrice');
  
  const name   = nameInput.value.trim();
  const locationName = locDrop.value;
  const sports = sportsIn.value.trim() || 'Football';
  const pricePerHour = parseInt(priceIn.value) || 600;

  if (!name) return alert('Turf Name is required!');
  
  try {
    const res = await fetch(`${API_URL}/admin/turfs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': getToken()
      },
      body: JSON.stringify({ name, locationName, sports, pricePerHour })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Failed to add turf');

    closeModal('turfModal');
    nameInput.value = ''; sportsIn.value = ''; priceIn.value = '';
    fetchData();
  } catch(err) {
    alert(err.message);
  }
}

async function deleteTurf(id) {
  if (!confirm('Are you sure you want to delete this turf?')) return;
  try {
    await fetch(`${API_URL}/admin/turfs/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': getToken() }
    });
    fetchData();
  } catch(err) {
    alert('Failed to delete turf');
  }
}

async function deleteBooking(id) {
  if (!confirm('Cancel this booking permanently?')) return;
  try {
    await fetch(`${API_URL}/admin/bookings/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': getToken() }
    });
    fetchData();
  } catch(err) {
    alert('Failed to delete booking');
  }
}

// ── MODALS ──
function openModal(id) {
  if (id === 'turfModal') {
    const drop = document.getElementById('turfLocation');
    drop.innerHTML = adminLocations.map(L => `<option value="${L.name}">${L.name}</option>`).join('');
    if (adminLocations.length === 0) {
      alert("Please add a location first!");
      return;
    }
  }
  const modal = document.getElementById(id);
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
}

function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('show');
  setTimeout(() => modal.style.display = 'none', 300);
}
