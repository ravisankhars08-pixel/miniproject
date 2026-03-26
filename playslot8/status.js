// ── LOAD BOOKINGS ──
let allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
let cancelTargetId = null;

// ── SPORT CONFIG ──
const sportConfig = {
  Football:   { class: 'football',   icon: '⚽' },
  Basketball: { class: 'basketball', icon: '🏀' },
  Cricket:    { class: 'cricket',    icon: '🏏' },
};

// ── RENDER ──
function renderBookings() {
  const list  = document.getElementById('bookingsList');
  const empty = document.getElementById('emptyState');
  list.innerHTML = '';

  if (allBookings.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  // newest first
  [...allBookings].reverse().forEach(booking => {
    const config      = sportConfig[booking.sport] || { class: 'football', icon: '⚽' };
    const isCancelled = booking.status === 'cancelled';

    // barcode bars
    let bars = '';
    [18,28,22,34,18,26,30,20,28,22,34,18,26,22,30,18,28,22].forEach(h => {
      bars += `<span style="height:${h}px"></span>`;
    });

    const ticket = document.createElement('div');
    ticket.classList.add('ticket', isCancelled ? 'cancelled' : config.class);
    ticket.dataset.id = booking.id;

    ticket.innerHTML = `
      <!-- TOP -->
      <div class="ticket-top">
        <div class="ticket-sport-icon">${config.icon}</div>

        <div class="ticket-left">
          <div class="ticket-id">Booking ID: <span>${booking.id}</span></div>
          <div class="ticket-title">${booking.sport.toUpperCase()}</div>
          <div class="ticket-turf">${booking.turf} &nbsp;·&nbsp; ${booking.location}</div>

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
              <div class="ticket-detail-value">${booking.duration}</div>
            </div>
            <div class="ticket-detail-item">
              <div class="ticket-detail-label">Court</div>
              <div class="ticket-detail-value">${booking.courtType}</div>
            </div>
            <div class="ticket-detail-item">
              <div class="ticket-detail-label">Sport</div>
              <div class="ticket-detail-value">${booking.sport}</div>
            </div>
            <div class="ticket-detail-item">
              <div class="ticket-detail-label">Payment</div>
              <div class="ticket-detail-value">${booking.method}</div>
            </div>
          </div>
        </div>

        <div class="ticket-right">
          <div class="ticket-status-badge ${isCancelled ? 'cancelled' : 'confirmed'}">
            ${isCancelled ? 'Cancelled' : 'Confirmed'}
          </div>
          <div class="ticket-price">
            ₹${booking.total}
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
            Booked: <strong>${booking.bookedAt}</strong>
          </div>
          <div class="ticket-extra-item">
            Water: <strong>${booking.water}</strong>
          </div>
          ${booking.players > 0 ? `
          <div class="ticket-extra-item">
            Players: <strong>${booking.players}</strong>
          </div>` : ''}
        </div>

        <div style="display:flex; align-items:center; gap:16px;">
          <div class="ticket-barcode">${bars}</div>
          ${isCancelled
            ? `<div class="cancelled-stamp">Booking Cancelled</div>`
            : `<button class="cancel-ticket-btn" onclick="openCancelModal('${booking.id}')">Cancel Booking</button>`
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

function confirmCancel() {
  if (!cancelTargetId) return;

  allBookings = allBookings.map(b =>
    b.id === cancelTargetId ? { ...b, status: 'cancelled' } : b
  );

  localStorage.setItem('bookings', JSON.stringify(allBookings));
  closeModal();
  renderBookings();
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
renderBookings();