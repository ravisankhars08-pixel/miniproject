// ── LOAD BOOKINGS ──
const API_URL = 'http://localhost:5000/api';
let allBookings = [];
let cancelTargetId = null;

// ── SPORT CONFIG ──
const sportConfig = {
  Football:   { class: 'football',   icon: '⚽' },
  Basketball: { class: 'basketball', icon: '🏀' },
  Cricket:    { class: 'cricket',    icon: '🏏' },
};

// ── FETCH FROM BACKEND ──
async function fetchMyBookings() {
  const session = JSON.parse(localStorage.getItem('ps_session'));
  if (!session || !session.token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/my-bookings`, {
      headers: { 'x-auth-token': session.token }
    });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    allBookings = await res.json();
    renderBookings();
  } catch (err) {
    console.error(err);
    document.getElementById('bookingsList').innerHTML = '<p style="color:red; text-align:center;">Error loading bookings. Please try again.</p>';
  }
}

// ── RENDER ──
function renderBookings() {
  const list  = document.getElementById('bookingsList');
  const empty = document.getElementById('emptyState');
  list.innerHTML = '';

  if (!allBookings || allBookings.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  // newest first (past 3 only)
  [...allBookings].reverse().slice(0, 3).forEach(booking => {
    // Normalize sport - trim and capitalize first letter
    let sport = booking.sport || (booking.turf && (booking.turf.sports || '').split(',')[0].trim()) || 'Football';
    sport = sport.trim().charAt(0).toUpperCase() + sport.trim().slice(1).toLowerCase();
    
    const config = sportConfig[sport] || { class: 'football', icon: '⚽' };
    const isCancelled = booking.status === 'cancelled';

    // barcode bars
    let bars = '';
    [18,28,22,34,18,26,30,20,28,22,34,18,26,22,30,18,28,22].forEach(h => {
      bars += `<span style="height:${h}px"></span>`;
    });

    const ticket = document.createElement('div');
    ticket.classList.add('ticket', isCancelled ? 'cancelled' : config.class);
    ticket.dataset.id = booking._id;

    ticket.innerHTML = `
      <!-- TOP -->
      <div class="ticket-top">
        <div class="ticket-sport-icon">${config.icon}</div>

        <div class="ticket-left">
          <div class="ticket-id">Booking ID: <span>${booking._id}</span></div>
          <div class="ticket-title">${sport.toUpperCase()}</div>
          <div class="ticket-turf">${booking.turf ? booking.turf.name : 'Unknown Turf'}</div>

          <div class="ticket-details">
            <div class="ticket-detail-item">
              <div class="ticket-detail-label">Date</div>
              <div class="ticket-detail-value">${booking.date}</div>
            </div>
            <div class="ticket-detail-item">
              <div class="ticket-detail-label">Time</div>
              <div class="ticket-detail-value">${booking.slot}</div>
            </div>
            <div class="ticket-detail-item">
              <div class="ticket-detail-label">Duration</div>
              <div class="ticket-detail-value">${booking.durationHours} hr</div>
            </div>
            <div class="ticket-detail-item">
              <div class="ticket-detail-label">Court</div>
              <div class="ticket-detail-value">${booking.courtType}</div>
            </div>
            <div class="ticket-detail-item">
              <div class="ticket-detail-label">Sport</div>
              <div class="ticket-detail-value">${sport}</div>
            </div>
            <div class="ticket-detail-item">
              <div class="ticket-detail-label">Status</div>
              <div class="ticket-detail-value" style="color:var(--acid)">${booking.status || 'Confirmed'}</div>
            </div>
          </div>
        </div>

        <div class="ticket-right">
          <div class="ticket-status-badge ${isCancelled ? 'cancelled' : 'confirmed'}">
            ${isCancelled ? 'UNSUCCESSFUL' : 'Confirmed'}
          </div>
          <div class="ticket-price">
            ₹${booking.totalPrice}
            <small>Total Paid</small>
          </div>
        </div>
      </div>

      <!-- TEAR LINE -->
      <div class="ticket-tear">
        <div class="ticket-tear-circle-left"></div>
        <div class="ticket-tear-circle-right"></div>
      </div>

      <!-- BOTTOM -->
      <div class="ticket-bottom">
        <div class="ticket-extras">
          <div class="ticket-extra-item">
            Reference: <strong>ONLINE</strong>
          </div>
          <div class="ticket-extra-item">
            Gate: <strong>MAIN</strong>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:16px;">
          <div class="ticket-barcode">${bars}</div>
          ${isCancelled
            ? `<div class="cancelled-stamp">Booking Unsuccessful</div>`
            : `
              <div style="display:flex; gap:12px;">
                <button class="review-btn" onclick="window.location.href='reviews.html?turfId=${booking.turf._id}&bookingId=${booking._id}'">Review Turf</button>
                <button class="cancel-ticket-btn" onclick="openCancelModal('${booking._id}')">Cancel Booking</button>
              </div>
            `
          }
        </div>
      </div>
    `;

    list.appendChild(ticket);
  });
}

// ── CANCEL MODAL ──
function openCancelModal(id) {
  cancelTargetId = id;
  document.getElementById('cancelBookingId').textContent = id;
  document.getElementById('cancelModal').style.display   = 'flex';
}

function closeModal() {
  document.getElementById('cancelModal').style.display = 'none';
  cancelTargetId = null;
}

async function confirmCancel() {
  if (!cancelTargetId) return;

  const session = JSON.parse(localStorage.getItem('ps_session'));
  if (!session || !session.token) return;

  try {
    const res = await fetch(`${API_URL}/bookings/${cancelTargetId}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': session.token }
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.msg || 'Failed to cancel');
    }

    closeModal();
    fetchMyBookings(); // Refresh list
  } catch (err) {
    alert(err.message);
  }
}

// close modal on overlay click
document.getElementById('cancelModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── MOBILE NAV ──
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
}

// ── INIT ──
fetchMyBookings();