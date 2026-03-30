const API_URL = 'http://localhost:5000/api';

// ── GET URL PARAMS ──
const urlParams = new URLSearchParams(window.location.search);
const turfId  = urlParams.get('turfId');
const bookingId = urlParams.get('bookingId'); // Optional, only if coming from "Write Review"

// ── ELEMENTS ──
const turfNameDisplay = document.getElementById('turfNameDisplay');
const reviewsFeed    = document.getElementById('reviewsFeed');
const submissionSec  = document.getElementById('submissionSec');
const avgRating      = document.getElementById('avgRating');
const avgStars       = document.getElementById('avgStars');
const totalRevCount  = document.getElementById('totalReviewsCount');
const ratingBars     = document.getElementById('ratingBars');

let selectedRating = 0;

// ── AUTH CHECK FOR SUBMISSION ──
function getSession() {
    return JSON.parse(localStorage.getItem('ps_session') || 'null');
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    if (!turfId) {
        alert('No turf selected!');
        window.location.href = 'index.html';
        return;
    }

    fetchTurfName();
    fetchReviews();

    // Show submission section if they have a bookingId and are logged in
    const session = getSession();
    if (session && session.token && bookingId) {
        submissionSec.style.display = 'block';
        setupStarInput();
    }
});

// ── STAR INPUT LOGIC ──
function setupStarInput() {
    const stars = document.querySelectorAll('#starInput span');
    stars.forEach(s => {
        s.addEventListener('click', () => {
            selectedRating = parseInt(s.getAttribute('data-val'));
            stars.forEach((star, index) => {
                star.classList.toggle('active', index < selectedRating);
            });
        });
    });

    document.getElementById('btnSubmitRev').addEventListener('click', submitReview);
}

// ── FETCH DATA ──
async function fetchTurfName() {
    try {
        const res = await fetch(`${API_URL}/turfs`);
        const turfs = await res.json();
        const turf = turfs.find(t => t._id === turfId);
        if (turf) {
            turfNameDisplay.innerHTML = `${turf.name} <span>Feedback</span>`;
        }
    } catch (err) {
        console.error('Error fetching turf name:', err);
    }
}

async function fetchReviews() {
    try {
        const res = await fetch(`${API_URL}/reviews/turf/${turfId}`);
        const reviews = await res.json();
        renderReviews(reviews);
        renderSummary(reviews);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        reviewsFeed.innerHTML = '<p>Error loading reviews.</p>';
    }
}

// ── RENDER ──
function renderReviews(reviews) {
    const session = getSession();
    if (reviews.length === 0) {
        reviewsFeed.innerHTML = '<div style="text-align:center; padding: 3rem; color:var(--muted);">No reviews yet. Be the first to share!</div>';
        return;
    }

    reviewsFeed.innerHTML = reviews.map(r => {
        const isOwner = session && r.user && r.user._id === session.userId;
        const name = r.isAnonymous ? 'Anonymous' : (r.user ? r.user.name : 'Unknown User');
        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        const verifiedTag = r.isVerified ? '<small style="color:var(--acid); margin-left:10px;">[Verified Booking]</small>' : '';
        
        return `
            <div class="rev-card">
                <div class="rev-meta">
                    <div>
                        <div class="rev-user">${name} ${verifiedTag}</div>
                        <div class="rev-stars">${stars}</div>
                    </div>
                    ${isOwner ? `<button class="action-btn btn-delete" onclick="deleteMyReview('${r._id}')">Delete</button>` : ''}
                </div>
                <div class="rev-comment">${r.comment}</div>
            </div>
        `;
    }).join('');
}

async function deleteMyReview(id) {
    if (!confirm('Delete your review?')) return;
    const session = getSession();
    try {
        const res = await fetch(`${API_URL}/reviews/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': session.token }
        });
        if (res.ok) fetchReviews();
    } catch (err) {
        console.error('Error deleting review:', err);
    }
}

function renderSummary(reviews) {
    if (reviews.length === 0) {
        avgRating.textContent = '0';
        avgStars.textContent  = '☆☆☆☆☆';
        totalRevCount.textContent = '0 Reviews';
        return;
    }

    // Average
    const sum = reviews.reduce((a, b) => a + b.rating, 0);
    const avg = (sum / reviews.length).toFixed(1);
    avgRating.textContent = avg;
    avgStars.textContent  = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
    totalRevCount.textContent = `${reviews.length} Reviews`;

    // Bars
    const counts = [0, 0, 0, 0, 0, 0]; // index matches rating
    reviews.forEach(r => counts[r.rating]++);

    ratingBars.innerHTML = '';
    for (let i = 5; i >= 1; i--) {
        const perc = (counts[i] / reviews.length) * 100;
        ratingBars.innerHTML += `
            <div class="r-bar-item">
                <div style="width: 50px;">${i} Stars</div>
                <div class="r-bar-track"><div class="r-bar-fill" style="width: ${perc}%"></div></div>
                <div style="width: 30px; text-align: right;">${counts[i]}</div>
            </div>
        `;
    }
}

// ── SUBMIT ──
async function submitReview() {
    const comment = document.getElementById('revComment').value.trim();
    const isAnon  = document.getElementById('revAnon').checked;
    const msgBox  = document.getElementById('revStatusMsg');

    if (selectedRating === 0) {
        msgBox.innerHTML = '<span style="color:red;">Please select a star rating.</span>';
        return;
    }

    if (comment.length < 5) {
        msgBox.innerHTML = '<span style="color:red;">Please write a slightly longer comment.</span>';
        return;
    }

    const session = getSession();
    try {
        const res = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': session.token
            },
            body: JSON.stringify({
                turfId,
                bookingId,
                rating: selectedRating,
                comment,
                isAnonymous: isAnon
            })
        });

        const data = await res.json();
        if (res.ok) {
            msgBox.innerHTML = '<span style="color:var(--acid);">Review submitted successfully! Refreshing...</span>';
            setTimeout(() => {
                window.location.href = `reviews.html?turfId=${turfId}`;
            }, 1500);
        } else {
            msgBox.innerHTML = `<span style="color:red;">${data.msg || 'Submission failed'}</span>`;
        }
    } catch (err) {
        msgBox.innerHTML = '<span style="color:red;">Server error. Please try again later.</span>';
    }
}
