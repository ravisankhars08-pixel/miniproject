// ── HERO QUOTE ROTATOR ──
const heroQuotes = [
  { text: "You have to fight to reach your dream. You have to sacrifice and work hard for it.", author: "Lionel Messi" },
  { text: "I am not the richest or most talented person, but I succeed because I keep going and going.", author: "Cristiano Ronaldo" },
  { text: "I can accept failure, everyone fails at something. But I can't accept not trying.", author: "Michael Jordan" },
  { text: "Nothing is given. Everything is earned. You work for what you have.", author: "LeBron James" },
  { text: "A missed shot is better than a shot clock violation.", author: "Kobe Bryant" },
];

let quoteIndex = 0;
const hqText   = document.getElementById('hqText');
const hqAuthor = document.getElementById('hqAuthor');

function showQuote(index) {
  if (!hqText || !hqAuthor) return;
  hqText.style.opacity   = '0';
  hqAuthor.style.opacity = '0';
  setTimeout(() => {
    hqText.textContent   = heroQuotes[index].text;
    hqAuthor.textContent = '— ' + heroQuotes[index].author;
    hqText.style.opacity   = '1';
    hqAuthor.style.opacity = '1';
  }, 300);
}

// transitions
if (hqText) {
  hqText.style.transition   = 'opacity 0.3s ease';
  hqAuthor.style.transition = 'opacity 0.3s ease';
  showQuote(0);
  setInterval(() => {
    quoteIndex = (quoteIndex + 1) % heroQuotes.length;
    showQuote(quoteIndex);
  }, 4000);
}

// ── MOBILE NAV TOGGLE ──
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
}

// ── SMOOTH SCROLL for nav links ──
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── NAV ACTIVE STATE on scroll ──
window.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  let current = '';

  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 100) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// ── SPORT CARDS click ──
document.querySelectorAll('.s-card').forEach(card => {
  card.addEventListener('click', () => {
    const sportName = card.querySelector('strong').textContent.trim();
    localStorage.setItem('homeSportFilter', sportName.toLowerCase());
    window.location.href = 'location.html';
  });
});

// ── TURF CARD "Book Now" buttons ──
document.querySelectorAll('.btn-sm').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    window.location.href = 'login.html';
  });
});

// ── SCROLL REVEAL animation ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.step, .turf-card, .feat').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ── QUOTES CAROUSEL ──
const track   = document.getElementById('quotesTrack');
const dotsWrap = document.getElementById('quotesDots');

if (track) {
  const cards = track.querySelectorAll('.quote-card');
  let current  = 0;
  let autoPlay;

  // build dots
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.classList.add('quote-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToQuote(i));
    dotsWrap.appendChild(dot);
  });

  function goToQuote(index) {
    current = (index + cards.length) % cards.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    document.querySelectorAll('.quote-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function changeQuote(dir) {
    goToQuote(current + dir);
    resetAutoPlay();
  }

  function resetAutoPlay() {
    clearInterval(autoPlay);
    autoPlay = setInterval(() => goToQuote(current + 1), 4000);
  }

  // make changeQuote global
  window.changeQuote = changeQuote;

  // start autoplay
  resetAutoPlay();
}

// ── DYNAMIC POPULAR TURFS ──
async function fetchPopularTurfs() {
  const grid = document.getElementById('indexTurfGrid');
  if (!grid) return; // Only run on index.html

  try {
    const res = await fetch('http://localhost:5000/api/turfs');
    if (!res.ok) throw new Error('Failed to fetch turfs');
    
    let allTurfs = await res.json();
    
    // Sort by rating (optional) and take top 3
    allTurfs.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const popTurfs = allTurfs.slice(0, 3);
    
    if (popTurfs.length === 0) {
      grid.innerHTML = '<div style="text-align: center; grid-column: 1 / -1; min-height: 200px; display: flex; align-items: center; justify-content: center;"><p>No turfs available yet. Admins, please add some!</p></div>';
      return;
    }
    
    grid.innerHTML = ''; // Clear loading text
    
    popTurfs.forEach(t => {
      // Determine icon and color based on sport
      let icon = '🏟️';
      let sportClass = 'football-thumb';
      const mainSport = (t.sports || '').split(',')[0].trim().toLowerCase();
      
      if (mainSport.includes('basket')) { 
        icon = '🏀'; 
        sportClass = 'basketball-thumb'; 
      } else if (mainSport.includes('cricket')) { 
        icon = '🏏'; 
        sportClass = 'cricket-thumb'; 
      } else if (mainSport.includes('foot')) { 
        icon = '⚽'; 
        sportClass = 'football-thumb'; 
      }

      // Format sports into badge spans
      const sportBadges = (t.sports || '').split(',').map(s => `<span class="turf-sport">${s.trim()}</span>`).join('');
      const locName = t.location ? t.location.name : 'Unknown';

      // Build card HTML
      const cardHtml = `
        <div class="turf-card" data-id="${t._id}">
          <div class="turf-thumb ${sportClass}">
            <div class="turf-thumb-icon">${icon}</div>
            <div class="turf-badge avail">Available</div>
          </div>
          <div class="turf-info">
            <h4>${t.name}</h4>
            <div class="turf-meta">
              <span>📍 <strong>${locName}</strong></span>
              <span>⭐ <strong>${(t.rating || 4.5).toFixed(1)}</strong></span>
            </div>
            <div class="turf-sports">${sportBadges}</div>
            <div class="turf-foot">
              <div class="turf-price">₹${t.pricePerHour} <small>/ hr</small></div>
              <button class="btn-sm">Book Now</button>
            </div>
          </div>
        </div>
      `;
      grid.insertAdjacentHTML('beforeend', cardHtml);
    });

    // Re-apply intersect observer for new cards
    document.querySelectorAll('#indexTurfGrid .turf-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      if (typeof observer !== 'undefined') observer.observe(el);
    });

  // Re-attach listener for dynamically created buttons
    document.querySelectorAll('#indexTurfGrid .btn-sm').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        
        // Check if turf data is available on the button's parent
        const card = btn.closest('.turf-card');
        const turfName = card.querySelector('h4').textContent;
        const locName = card.querySelector('.turf-meta strong').textContent;
        const price = card.querySelector('.turf-price').textContent.replace('₹', '').split(' ')[0];
        
        // Find turf ID from the list if possible, but easier to just check session
        const session = JSON.parse(localStorage.getItem('ps_session'));
        
        if (session && session.token) {
          // Logged in: satisfy book.html requirements and skip login
          localStorage.setItem('selectedTurf', turfName);
          localStorage.setItem('selectedLocation', locName);
          localStorage.setItem('slotPrice', price);
          // We need the ID too. I'll modify the loop above to store ID in dataset.
          const turfId = card.getAttribute('data-id');
          localStorage.setItem('selectedTurfId', turfId);
          
          window.location.href = 'book.html';
        } else {
          window.location.href = 'login.html';
        }
      });
    });

  } catch (err) {
    console.error('Error loading turfs:', err);
    grid.innerHTML = '<div style="text-align: center; grid-column: 1 / -1; min-height: 200px; display: flex; align-items: center; justify-content: center;"><p style="color:red;">Error loading turfs from backend.</p></div>';
  }
}

// ── FETCH HERO STATS ──
async function fetchHeroStats() {
  try {
    const res = await fetch('http://localhost:5000/api/stats');
    if (!res.ok) return;
    const stats = await res.json();
    
    // Update total turfs (48+)
    const turfStat = document.querySelector('.stat strong'); // First stat
    if (turfStat) {
      turfStat.innerHTML = `${stats.turfCount}<span>+</span>`;
    }
    
    // Update total bookings (12k)
    const bookingStat = document.querySelectorAll('.stat strong')[1]; // Second stat
    if (bookingStat) {
      let count = stats.bookingCount;
      let label = '';
      if (count >= 1000) {
        count = (count / 1000).toFixed(1);
        label = 'k';
      }
      bookingStat.innerHTML = `${count}<span>${label}</span>`;
    }
  } catch (err) {
    console.warn('Could not fetch hero stats:', err);
  }
}

// Call on load
document.addEventListener('DOMContentLoaded', () => {
  fetchPopularTurfs();
  fetchHeroStats();
});