// ── LOAD LOCATION FROM STORAGE ──
const savedLocation = localStorage.getItem('selectedLocation') || 'Kerala';
document.getElementById('locationName').textContent = savedLocation;

const API_URL = 'http://localhost:5000/api';
let turfs = [];

// ── GET TURFS ──
async function fetchTurfs() {
  try {
    const res = await fetch(`${API_URL}/turfs?location=${encodeURIComponent(savedLocation)}`);
    turfs = await res.json();
    renderTurfs();
  } catch (err) {
    document.getElementById('turfGrid').innerHTML = '<p style="color:red;">Error loading turfs.</p>';
  }
}

function renderTurfs() {
  const grid = document.getElementById('turfGrid');
  grid.innerHTML = '';
  
  if (turfs.length === 0) {
    grid.innerHTML = `<p style="text-align:center; width:100%; grid-column:1/-1;">No turfs found in ${savedLocation}.</p>`;
    return;
  }
  
  turfs.forEach(t => {
    // Determine icon based on sport
    let icon = '🏟️';
    let sportClass = 'football-thumb';
    const mainSport = t.sports.split(',')[0].trim().toLowerCase();
    if (mainSport.includes('basket')) { icon = '🏀'; sportClass = 'basketball-thumb'; }
    else if (mainSport.includes('cricket')) { icon = '🏏'; sportClass = 'cricket-thumb'; }
    else if (mainSport.includes('foot')) { icon = '⚽'; sportClass = 'football-thumb'; }
    
    // Pass the actual turf ID and main sport
    grid.innerHTML += `
      <div class="turf-book-card" id="turf-${t._id}" onclick="selectTurf('${t.name}', '${t.sports}', '${t._id}', '${t.pricePerHour}')">
        <div class="turf-book-thumb ${sportClass}">
          <div class="turf-thumb-icon">${icon}</div>
          <div class="turf-book-badge">${t.sports}</div>
        </div>
        <div class="turf-book-info">
          <h4>${t.name}</h4>
          <small>📍 <span>${savedLocation}</span> &nbsp;|&nbsp; ⭐ ${t.rating || 4.5} &nbsp;|&nbsp; ₹${t.pricePerHour}/hr</small>
        </div>
      </div>
    `;
  });
}

// ── BUILD CALENDAR STRIP ──
const strip = document.getElementById('calendarStrip');
const today = new Date();
let selectedDate = null;

for (let i = 0; i < 30; i++) {
  const date = new Date();
  date.setDate(today.getDate() + i);

  const dayNames  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const dayEl = document.createElement('div');
  dayEl.classList.add('cal-day');
  if (i === 0) dayEl.classList.add('today', 'active');

  dayEl.innerHTML = `
    <div class="cal-month">${monthNames[date.getMonth()]}</div>
    <div class="cal-day-name">${dayNames[date.getDay()]}</div>
    <div class="cal-day-num">${date.getDate()}</div>
  `;

  dayEl.addEventListener('click', () => {
    document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('active'));
    dayEl.classList.add('active');
    selectedDate = `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
    localStorage.setItem('selectedDate', selectedDate);
    updateSummary();
  });

  // set default selected date to today
  if (i === 0) {
    selectedDate = `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
    localStorage.setItem('selectedDate', selectedDate);
  }

  strip.appendChild(dayEl);
}

// Fetch on load
window.addEventListener('DOMContentLoaded', fetchTurfs);

// ── TURF SELECTION ──
let selectedTurf  = null;
let selectedSport = null;

function selectTurf(turfName, sport, id, price) {
  selectedTurf  = turfName;
  selectedSport = sport;

  localStorage.setItem('selectedTurf',  turfName);
  localStorage.setItem('selectedSport', sport);
  localStorage.setItem('selectedTurfId', id);
  localStorage.setItem('slotPrice', price);

  // highlight selected card
  document.querySelectorAll('.turf-book-card').forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

  // show sport specific options
  const section = document.getElementById('sportOptionsSection');
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('footballOptions').style.display   = 'none';
  document.getElementById('basketballOptions').style.display = 'none';
  document.getElementById('cricketOptions').style.display    = 'none';

  const mainSport = sport.toLowerCase();

  if (mainSport.includes('foot')) {
    document.getElementById('sportOptionsTitle').innerHTML  = 'Choose Court <span>Type</span>';
    document.getElementById('footballOptions').style.display = 'block';
  } else if (mainSport.includes('basket')) {
    document.getElementById('sportOptionsTitle').innerHTML     = 'Indoor or <span>Outdoor?</span>';
    document.getElementById('basketballOptions').style.display = 'block';
  } else if (mainSport.includes('cricket')) {
    document.getElementById('sportOptionsTitle').innerHTML  = 'Indoor or <span>Outdoor?</span>';
    document.getElementById('cricketOptions').style.display = 'block';
  }

  // reset previous selections
  document.getElementById('halfSelectedTag').style.display = 'none';
  document.querySelectorAll('.io-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.half-overlay').forEach(h => h.classList.remove('selected-half'));
  document.querySelector('.full-court-btn').classList.remove('selected');

  document.getElementById('proceedWrap').style.display = 'none';
  updateSummary();
}

// ── FOOTBALL HALF SELECTOR ──
let selectedHalf = null;

function selectHalf(half) {
  selectedHalf = half;
  localStorage.setItem('selectedCourtType', half);

  // reset overlays
  document.querySelectorAll('.half-overlay').forEach(h => h.classList.remove('selected-half'));
  document.querySelector('.full-court-btn').classList.remove('selected');

  if (half === 'Left Half') {
    document.getElementById('leftHalf').classList.add('selected-half');
  } else if (half === 'Right Half') {
    document.getElementById('rightHalf').classList.add('selected-half');
  } else if (half === 'Full Court') {
    document.getElementById('leftHalf').classList.add('selected-half');
    document.getElementById('rightHalf').classList.add('selected-half');
    document.querySelector('.full-court-btn').classList.add('selected');
  }

  // show selected tag
  const tag = document.getElementById('halfSelectedTag');
  tag.style.display = 'block';
  document.getElementById('halfSelectedLabel').textContent = half;

  showProceed();
  updateSummary();
}

// ── INDOOR / OUTDOOR SELECTOR ──
let selectedCourtType = null;

function selectCourtType(type, el) {
  selectedCourtType = type;
  localStorage.setItem('selectedCourtType', type);

  document.querySelectorAll('.io-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  showProceed();
  updateSummary();
}

// ── SHOW PROCEED BUTTON ──
function showProceed() {
  document.getElementById('proceedWrap').style.display = 'flex';
}

// ── UPDATE MINI SUMMARY ──
function updateSummary() {
  const el = document.getElementById('bookingSummaryMini');
  const courtType = localStorage.getItem('selectedCourtType') || '—';

  el.innerHTML = `
    📍 <strong>${savedLocation}</strong> &nbsp;|&nbsp;
    📅 <strong>${selectedDate || '—'}</strong> &nbsp;|&nbsp;
    🏟️ <strong>${selectedTurf || '—'}</strong> &nbsp;|&nbsp;
    ⚽ <strong>${selectedSport || '—'}</strong> &nbsp;|&nbsp;
    🎯 <span class="acid">${courtType}</span>
  `;
}

// ── PROCEED TO SLOTS ──
function proceedToSlots() {
  if (!selectedDate) {
    alert('Please select a date!'); return;
  }
  if (!selectedTurf) {
    alert('Please select a turf!'); return;
  }
  const courtType = localStorage.getItem('selectedCourtType');
  if (!courtType) {
    alert('Please choose a court type!'); return;
  }
  window.location.href = 'slots.html';
}

// ── MOBILE NAV ──
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
}