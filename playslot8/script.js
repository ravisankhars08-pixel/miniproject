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