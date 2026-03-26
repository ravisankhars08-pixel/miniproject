// ── LOAD SAVED DATA ──
const savedLocation  = localStorage.getItem('selectedLocation')  || 'Kerala';
const savedDate      = localStorage.getItem('selectedDate')      || 'Today';
const savedTurf      = localStorage.getItem('selectedTurf')      || 'Turf';
const savedSport     = localStorage.getItem('selectedSport')     || 'Sport';
const savedCourtType = localStorage.getItem('selectedCourtType') || 'Full Court';

// fill info bar
document.getElementById('locationLabel').textContent  = savedLocation;
document.getElementById('dateLabel').textContent      = savedDate;
document.getElementById('turfLabel').textContent      = savedTurf;
document.getElementById('turfInfo').textContent       = savedTurf;
document.getElementById('sportInfo').textContent      = savedSport;
document.getElementById('courtTypeInfo').textContent  = savedCourtType;

// ── PRICES ──
const prices = { Football: 600, Basketball: 500, Cricket: 750 };
const basePrice = prices[savedSport] || 600;

// ── DURATION ──
let selectedDuration = 1;
let selectedSlot     = null;

function setDuration(hrs) {
  selectedDuration = hrs;

  document.getElementById('dur1').classList.toggle('active', hrs === 1);
  document.getElementById('dur2').classList.toggle('active', hrs === 2);

  // reset selected slot when duration changes
  selectedSlot = null;
  document.getElementById('proceedWrap').style.display = 'none';

  buildSlots();
}

// ── ALL SLOTS 6am to 10pm ──
const allSlots = [
  { start: 6,  label: '6:00 AM',  period: 'morning'   },
  { start: 7,  label: '7:00 AM',  period: 'morning'   },
  { start: 8,  label: '8:00 AM',  period: 'morning'   },
  { start: 9,  label: '9:00 AM',  period: 'morning'   },
  { start: 10, label: '10:00 AM', period: 'morning'   },
  { start: 11, label: '11:00 AM', period: 'morning'   },
  { start: 12, label: '12:00 PM', period: 'afternoon' },
  { start: 13, label: '1:00 PM',  period: 'afternoon' },
  { start: 14, label: '2:00 PM',  period: 'afternoon' },
  { start: 15, label: '3:00 PM',  period: 'afternoon' },
  { start: 16, label: '4:00 PM',  period: 'afternoon' },
  { start: 17, label: '5:00 PM',  period: 'evening'   },
  { start: 18, label: '6:00 PM',  period: 'evening'   },
  { start: 19, label: '7:00 PM',  period: 'evening'   },
  { start: 20, label: '8:00 PM',  period: 'night'     },
  { start: 21, label: '9:00 PM',  period: 'night'     },
];

// randomly pre-book some slots to simulate real availability
const bookedSlots = [7, 12, 15, 19];

// ── BUILD SLOTS ──
function buildSlots() {
  const containers = {
    morning:   document.getElementById('morningSlots'),
    afternoon: document.getElementById('afternoonSlots'),
    evening:   document.getElementById('eveningSlots'),
    night:     document.getElementById('nightSlots'),
  };

  // clear all
  Object.values(containers).forEach(c => c.innerHTML = '');

  allSlots.forEach(slot => {
    // for 2hr sessions, skip last slot (9pm) since it would go past 10pm
    if (selectedDuration === 2 && slot.start >= 21) return;

    const endHour = slot.start + selectedDuration;

    // format end time
    const endLabel = endHour === 12 ? '12:00 PM'
      : endHour < 12  ? `${endHour}:00 AM`
      : endHour === 24 ? '12:00 AM'
      : `${endHour - 12}:00 PM`;

    const isBooked = bookedSlots.includes(slot.start);
    const price    = basePrice * selectedDuration;

    const btn = document.createElement('div');
    btn.classList.add('slot-btn');
    if (isBooked) btn.classList.add('booked');

    btn.innerHTML = `
      <div class="slot-time">${slot.label}<br>— ${endLabel}</div>
      <div class="slot-duration">${selectedDuration} hr session</div>
      <div class="slot-price">₹${price}</div>
      ${isBooked ? '<div class="booked-label">Booked</div>' : ''}
    `;

    if (!isBooked) {
      btn.addEventListener('click', () => selectSlot(btn, slot, endLabel, price));
    }

    containers[slot.period].appendChild(btn);
  });
}

// ── SELECT SLOT ──
function selectSlot(btn, slot, endLabel, price) {
  // deselect all
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  selectedSlot = {
    start:    slot.label,
    end:      endLabel,
    duration: selectedDuration,
    price:    price,
  };

  localStorage.setItem('selectedSlot',  `${slot.label} — ${endLabel}`);
  localStorage.setItem('sessionHours',  selectedDuration);
  localStorage.setItem('slotPrice',     price);

  updateSummary();
  document.getElementById('proceedWrap').style.display = 'flex';
  document.getElementById('proceedWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── UPDATE SUMMARY ──
function updateSummary() {
  if (!selectedSlot) return;
  const el = document.getElementById('slotSummary');
  el.innerHTML = `
    📍 <strong>${savedLocation}</strong> &nbsp;|&nbsp;
    📅 <strong>${savedDate}</strong> &nbsp;|&nbsp;
    🏟️ <strong>${savedTurf}</strong> &nbsp;|&nbsp;
    ⏱️ <strong>${selectedSlot.start} — ${selectedSlot.end}</strong> &nbsp;|&nbsp;
    💰 <span class="acid">₹${selectedSlot.price}</span>
  `;
}

// ── PROCEED TO PAYMENT ──
function proceedToPayment() {
  if (!selectedSlot) {
    alert('Please select a time slot!');
    return;
  }
  window.location.href = 'payment.html';
}

// ── MOBILE NAV ──
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
}

// ── INIT ──
buildSlots();