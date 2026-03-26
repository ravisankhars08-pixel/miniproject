// ── LOAD SAVED DATA ──
const savedLocation  = localStorage.getItem('selectedLocation')  || '—';
const savedTurf      = localStorage.getItem('selectedTurf')      || '—';
const savedSport     = localStorage.getItem('selectedSport')     || '—';
const savedCourt     = localStorage.getItem('selectedCourtType') || '—';
const savedDate      = localStorage.getItem('selectedDate')      || '—';
const savedSlot      = localStorage.getItem('selectedSlot')      || '—';
const savedHours     = parseInt(localStorage.getItem('sessionHours')) || 1;
const savedBasePrice = parseInt(localStorage.getItem('slotPrice'))    || 600;

// ── FILL SUMMARY ──
document.getElementById('sumLocation').textContent = savedLocation;
document.getElementById('sumTurf').textContent     = savedTurf;
document.getElementById('sumSport').textContent    = savedSport;
document.getElementById('sumCourt').textContent    = savedCourt;
document.getElementById('sumDate').textContent     = savedDate;
document.getElementById('sumSlot').textContent     = savedSlot;
document.getElementById('sumDuration').textContent = `${savedHours} Hour${savedHours > 1 ? 's' : ''}`;

// ── PRICING ──
const PLATFORM_FEE  = 20;
const WATER_PER_PLAYER = 20;
const GST_RATE      = 0.18;

let waterEnabled  = false;
let playerCount   = 1;
let selectedMethod = 'upi';

function calcTotal() {
  const waterCost  = waterEnabled ? playerCount * WATER_PER_PLAYER : 0;
  const subtotal   = savedBasePrice + waterCost + PLATFORM_FEE;
  const gst        = Math.round(subtotal * GST_RATE);
  const total      = subtotal + gst;
  return { waterCost, gst, total };
}

function updatePrices() {
  const { waterCost, gst, total } = calcTotal();

  document.getElementById('priceBase').textContent  = `₹${savedBasePrice}`;
  document.getElementById('priceGst').textContent   = `₹${gst}`;
  document.getElementById('priceTotal').textContent = `₹${total}`;

  // water row
  const waterRow = document.getElementById('waterRow');
  if (waterEnabled) {
    waterRow.style.display = 'flex';
    document.getElementById('priceWater').textContent = `₹${waterCost}`;
  } else {
    waterRow.style.display = 'none';
  }
}

// ── WATER TOGGLE ──
function toggleWater() {
  waterEnabled = document.getElementById('waterToggle').checked;
  const wrap   = document.getElementById('playerInputWrap');
  wrap.style.display = waterEnabled ? 'block' : 'none';
  updatePrices();
}

// ── PLAYER COUNTER ──
function changeCount(delta) {
  playerCount = Math.max(1, Math.min(30, playerCount + delta));
  document.getElementById('playerCount').textContent     = playerCount;
  document.getElementById('playerCountNote').textContent = playerCount;
  document.getElementById('waterTotal').textContent      = `₹${playerCount * WATER_PER_PLAYER}`;
  updatePrices();
}

// ── PAYMENT METHOD ──
function selectPayMethod(method, el) {
  selectedMethod = method;

  // highlight selected
  document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('active'));
  el.classList.add('active');

  // show correct input section
  document.getElementById('upiSection').style.display     = 'none';
  document.getElementById('cardSection').style.display    = 'none';
  document.getElementById('netSection').style.display     = 'none';
  document.getElementById('cashSection').style.display    = 'none';

  document.getElementById(`${method}Section`).style.display = 'block';
}

// ── CARD FORMATTER ──
function formatCard() {
  let val = document.getElementById('cardNum').value.replace(/\D/g, '');
  val = val.match(/.{1,4}/g)?.join(' ') || val;
  document.getElementById('cardNum').value = val;
}

function formatExpiry() {
  let val = document.getElementById('expiry').value.replace(/\D/g, '');
  if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2);
  document.getElementById('expiry').value = val;
}

// ── VALIDATE ──
function validate() {
  if (selectedMethod === 'upi') {
    const upi = document.getElementById('upiId').value.trim();
    if (!upi.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. name@upi)');
      return false;
    }
  }
  if (selectedMethod === 'card') {
    const num = document.getElementById('cardNum').value.replace(/\s/g, '');
    const exp = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;
    if (num.length < 16) { alert('Enter a valid 16-digit card number'); return false; }
    if (exp.length < 5)  { alert('Enter a valid expiry date');          return false; }
    if (cvv.length < 3)  { alert('Enter a valid CVV');                  return false; }
  }
  if (selectedMethod === 'netbanking') {
    const bank = document.getElementById('bankSelect').value;
    if (!bank) { alert('Please select your bank'); return false; }
  }
  return true;
}

// ── CONFIRM PAYMENT ──
async function confirmPayment() {
  if (!validate()) return;

  const { total } = calcTotal();

  // Try to get auth token
  const session = JSON.parse(localStorage.getItem('ps_session'));
  if (!session || !session.token) {
    alert("You must be logged in to book!");
    window.location.href = 'login.html';
    return;
  }

  const turfId = localStorage.getItem('selectedTurfId');
  if (!turfId) {
    alert("Turf context lost. Please select a turf again.");
    window.location.href = 'location.html';
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': session.token
      },
      body: JSON.stringify({
        turfId: turfId,
        date: savedDate,
        slot: savedSlot,
        courtType: savedCourt,
        durationHours: savedHours,
        totalPrice: total
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Failed to book');

    // show success screen
    document.getElementById('paymentView').style.display = 'none';
    document.getElementById('successView').style.display = 'flex';
    document.getElementById('bookingIdBox').textContent  = data.booking._id;

    // scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (err) {
    alert("Booking failed: " + err.message);
  }
}

// ── MOBILE NAV ──
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
}

// ── INIT ──
updatePrices();