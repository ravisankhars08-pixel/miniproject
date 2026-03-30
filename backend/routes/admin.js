const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const Turf = require('../models/Turf');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { adminAuth } = require('../middleware/authMiddleware');

// --- LOCATIONS ---
router.post('/locations', adminAuth, async (req, res) => {
  try {
    const { name, icon } = req.body;
    const location = new Location({ name, icon });
    await location.save();
    res.json(location);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ msg: 'Location exists' });
    res.status(500).send('Server error');
  }
});

router.delete('/locations/:id', adminAuth, async (req, res) => {
  try {
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ msg: 'Location not found' });
    // Maybe we should delete related turfs too, but for now just delete the location
    await Location.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Location removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// --- TURFS ---
router.post('/turfs', adminAuth, async (req, res) => {
  try {
    const { name, locationName, sports, pricePerHour } = req.body;
    
    // Find location by name
    const loc = await Location.findOne({ name: locationName });
    if (!loc) return res.status(400).json({ msg: 'Location not found' });

    const turf = new Turf({
      name,
      location: loc._id,
      sports,
      pricePerHour
    });
    await turf.save();
    res.json(turf);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.delete('/turfs/:id', adminAuth, async (req, res) => {
  try {
    await Turf.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Turf removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// --- BOOKINGS ---
// Admin can view all bookings
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    // Populate turf and user references
    const bookings = await Booking.find().populate('turf').populate('user', '-password');
    res.json(bookings);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Admin can cancel booking
router.delete('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ msg: 'Booking cancelled' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Admin stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const turfCount = await Turf.countDocuments();
    const locCount = await Location.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const bookings = await Booking.find({}, 'totalPrice');
    const revenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    res.json({ turfCount, locCount, bookingCount, revenue });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// --- REVIEWS MODERATION ---

// Get all reviews (or with filters)
router.get('/reviews', adminAuth, async (req, res) => {
  try {
    const { turfId } = req.query;
    let query = {};
    if (turfId) query.turf = turfId;

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('turf', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete review (Admin)
router.delete('/reviews/:id', adminAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ msg: 'Review not found' });
    
    await Review.findByIdAndDelete(req.params.id);
    
    // Update turf rating
    const reviews = await Review.find({ turf: review.turf });
    const turf = await Turf.findById(review.turf);
    if(turf) {
      turf.rating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
      await turf.save();
    }
    
    res.json({ msg: 'Review deleted by admin' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Toggle Verification (Admin)
router.patch('/reviews/:id/verify', adminAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ msg: 'Review not found' });

    review.isVerified = !review.isVerified;
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
