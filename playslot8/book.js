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
  
  const sportFilter = localStorage.getItem('homeSportFilter');
  let filteredTurfs = [...turfs];
  
  if (sportFilter) {
    filteredTurfs = turfs.filter(t => t.sports.toLowerCase().includes(sportFilter));
  }
  
  if (filteredTurfs.length === 0) {
    const msg = sportFilter 
      ? `No turfs found in ${savedLocation} that support ${sportFilter}.` 
      : `No turfs found in ${savedLocation}.`;
    grid.innerHTML = `<p style="text-align:center; width:100%; grid-column:1/-1;">${msg}</p>`;
    return;
  }
  
  filteredTurfs.forEach(t => {
    const sportsArr = (t.sports || '').split(',').map(s => s.trim());
    
    const segmentsHtml = sportsArr.map(sp => {
      let spIcon = '🏟️';
      let spClass = 'football-thumb';
      let lc = sp.toLowerCase();
      if(lc.includes('basket')) { spIcon = '🏀'; spClass = 'basketball-thumb'; }
      else if(lc.includes('cricket')) { spIcon = '🏏'; spClass = 'cricket-thumb'; }
      else if(lc.includes('foot')) { spIcon = '⚽'; spClass = 'football-thumb'; }
      
      return `<div class="${spClass}" style="flex:1; display:flex; align-items:center; justify-content:center; min-height:100%;">
                <div class="turf-thumb-icon">${spIcon}</div>
              </div>`;
    }).join('');
    
    const thumbHtml = `
      <div class="turf-book-thumb" style="display:flex; padding:0; overflow:hidden;">
        ${segmentsHtml}
        <div class="turf-book-badge" style="z-index:2;">${t.sports}</div>
      </div>
    `;
    
    // Pass the actual turf ID and full sports string
    grid.innerHTML += `
      <div class="turf-book-card" id="turf-${t._id}" onclick="selectTurf(this, '${t.name}', '${t.sports}', '${t._id}', '${t.pricePerHour}')">
        ${thumbHtml}
        <div class="turf-book-info">
          <h4>${t.name}</h4>
          <small>📍 <span>${savedLocation}</span> &nbsp;|&nbsp; ⭐ ${t.rating > 0 ? t.rating.toFixed(1) : 'New'} &nbsp;|&nbsp; ₹${t.pricePerHour}/hr</small>
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

function selectTurf(cardEl, turfName, sportStr, id, price, explicitSport = null) {
  const sportsArr = (sportStr || '').split(',').map(s => s.trim());
  const targetCard = cardEl || document.getElementById(`turf-${id}`);

  // highlight selected card
  document.querySelectorAll('.turf-book-card').forEach(c => c.classList.remove('selected'));
  if (targetCard) targetCard.classList.add('selected');
  
  const section = document.getElementById('sportOptionsSection');
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (!explicitSport && sportsArr.length > 1) {
    // Show sport selection
    let html = `<p class="option-hint">This turf has multiple sports. Please select one:</p>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">`;
    sportsArr.forEach(sp => {
       html += `<button class="btn-primary" style="padding:10px 20px;" onclick="selectTurf(document.getElementById('turf-${id}'), '${turfName}', '${sportStr}', '${id}', '${price}', '${sp}')">${sp}</button>`;
    });
    html += `</div>`;
    
    document.getElementById('sportOptionsTitle').innerHTML = 'Select <span>Sport</span>';
    // Hide standard options initially until sport is chosen
    document.getElementById('footballOptions').style.display = 'none';
    document.getElementById('basketballOptions').style.display = 'none';
    document.getElementById('cricketOptions').style.display = 'none';
    
    // Inject sport selector temporarily and remove it when calling selectTurf again
    let sportPicker = document.getElementById('tempSportPicker');
    if (!sportPicker) {
      sportPicker = document.createElement('div');
      sportPicker.id = 'tempSportPicker';
      sportPicker.style.marginBottom = '2rem';
      section.insertBefore(sportPicker, document.getElementById('footballOptions'));
    }
    sportPicker.innerHTML = html;
    sportPicker.style.display = 'block';

    document.getElementById('proceedWrap').style.display = 'none';
    return;
  }
  
  // Clean up explicit sport picker if it was shown
  const tempPicker = document.getElementById('tempSportPicker');
  if (tempPicker) tempPicker.style.display = 'none';

  const chosenSport = explicitSport || sportsArr[0];

  selectedTurf  = turfName;
  selectedSport = chosenSport;

  localStorage.setItem('selectedTurf',  turfName);
  localStorage.setItem('selectedSport', chosenSport);
  localStorage.setItem('selectedTurfId', id);
  localStorage.setItem('slotPrice', price);

  document.getElementById('footballOptions').style.display   = 'none';
  document.getElementById('basketballOptions').style.display = 'none';
  document.getElementById('cricketOptions').style.display    = 'none';

  const mainSport = chosenSport.toLowerCase();

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