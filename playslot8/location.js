const API_URL = 'http://localhost:5000/api';
let locations = [];

// ── GET LOCATIONS ──
async function fetchLocations() {
  try {
    const res = await fetch(`${API_URL}/locations`);
    locations = await res.json();
    renderLocations();
  } catch (err) {
    console.error("Failed to load locations", err);
    document.getElementById('locationGrid').innerHTML = '<p style="color:red; text-align:center; padding: 2rem;">Error loading locations from server. Is backend running?</p>';
  }
}

function renderLocations(filterText = '') {
  const grid = document.getElementById('locationGrid');
  grid.innerHTML = '';
  
  let count = 0;
  
  locations.forEach(loc => {
    if (loc.name.toLowerCase().includes(filterText.toLowerCase())) {
      grid.innerHTML += `
        <div class="loc-card" onclick="selectLocation('${loc.name}')">
          <div class="loc-card-icon">${loc.icon || '📍'}</div>
          <div class="loc-card-info">
            <h4>${loc.name}</h4>
            <span>${loc.turfsCount || 0} Turfs Available</span>
          </div>
          <div class="loc-arrow">→</div>
        </div>
      `;
      count++;
    }
  });
  
  const noResults = document.getElementById('noResults');
  noResults.style.display = count === 0 ? 'block' : 'none';
  grid.style.display = count === 0 ? 'none' : 'grid';
  
  // Highlight selected initially
  highlightSelected();
}

// ── SELECT LOCATION ──
function selectLocation(name) {
  localStorage.setItem('selectedLocation', name);
  window.location.href = 'book.html';
}

// ── FILTER LOCATIONS ──
function filterLocations() {
  const query = document.getElementById('locationSearch').value.toLowerCase().trim();
  const clearBtn = document.getElementById('clearBtn');
  const sectionLabel = document.getElementById('sectionLabel');

  clearBtn.style.display = query.length > 0 ? 'block' : 'none';
  sectionLabel.textContent = query.length > 0 ? `Results for "${query}"` : 'Popular Locations';

  renderLocations(query);
}

// ── CLEAR SEARCH ──
function clearSearch() {
  document.getElementById('locationSearch').value = '';
  filterLocations();
  document.getElementById('locationSearch').focus();
}

// ── MOBILE NAV ──
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
}

// ── HIGHLIGHT SELECTED on back navigation ──
function highlightSelected() {
  const saved = localStorage.getItem('selectedLocation');
  if (saved) {
    document.querySelectorAll('.loc-card h4').forEach(h4 => {
      if (h4.textContent === saved) {
        h4.closest('.loc-card').style.borderColor = 'var(--acid)';
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', fetchLocations);