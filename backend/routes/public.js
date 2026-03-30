const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const Turf = require('../models/Turf');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { auth } = require('../middleware/authMiddleware');

// Get global stats (Public)
router.get('/stats', async (req, res) => {
  try {
    const turfCount = await Turf.countDocuments();
    const bookingCount = await Booking.countDocuments({ status: 'confirmed' });
    const locationCount = await Location.countDocuments();
    res.json({ turfCount, bookingCount, locationCount });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get all locations
router.get('/locations', async (req, res) => {
  try {
    const locations = await Location.find();
    
    // We also need the turf count per location for the frontend
    const turfs = await Turf.find();
    
    // Attach turf count
    const result = locations.map(loc => {
       const count = turfs.filter(t => String(t.location) === String(loc._id)).length;
       return { ...loc.toObject(), turfsCount: count };
    });

    res.json(result);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Check availability for a turf/date/sport
router.get('/bookings/check-availability', async (req, res) => {
  try {
    const { turfId, date, sport } = req.query;
    if (!turfId || !date) return res.status(400).json({ msg: 'turfId and date are required' });

    let query = { 
      turf: turfId, 
      date: date, 
      status: 'confirmed' 
    };

    // If sport is provided, filter by it (assuming separate courts for different sports)
    if (sport) {
      const normalizedSport = sport.trim().charAt(0).toUpperCase() + sport.trim().slice(1).toLowerCase();
      query.sport = normalizedSport;
    }

    const bookings = await Booking.find(query, 'slot');

    const takenSlots = bookings.map(b => b.slot);
    res.json(takenSlots);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get popular turfs (Recently Booked)
router.get('/turfs/popular', async (req, res) => {
  try {
    // Get unique turf IDs from the most recent 10-20 confirmed bookings
    const recentBookings = await Booking.find({ status: 'confirmed' })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('turf');
    
    // Extract unique turf IDs while maintaining order
    const uniqueTurfIds = [...new Set(recentBookings.map(b => b.turf.toString()))].slice(0, 3);
    
    // Fetch turf details for these IDs
    let popTurfs = await Turf.find({ _id: { $in: uniqueTurfIds } }).populate('location');
    
    // Sort them in the order they appeared in recentBookings
    popTurfs.sort((a, b) => uniqueTurfIds.indexOf(a._id.toString()) - uniqueTurfIds.indexOf(b._id.toString()));

    // Fallback: If no bookings yet, just return top rated turfs
    if (popTurfs.length < 3) {
      const additional = await Turf.find({ _id: { $nin: uniqueTurfIds } })
        .sort({ rating: -1 })
        .limit(3 - popTurfs.length)
        .populate('location');
      popTurfs = [...popTurfs, ...additional];
    }

    res.json(popTurfs);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get all turfs (or by location name via query ?location=X)
router.get('/turfs', async (req, res) => {
  try {
    const locName = req.query.location;
    let query = {};
    if (locName) {
       const loc = await Location.findOne({ name: locName });
       if (loc) query.location = loc._id;
       else return res.json([]); // location not found
    }
    const turfs = await Turf.find(query).populate('location');
    res.json(turfs);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create a booking (requires user login)
router.post('/bookings', auth, async (req, res) => {
  try {
    const { turfId, sport, date, slot, courtType, durationHours, totalPrice } = req.body;
    
    // Normalize sport name
    const normalizedSport = sport.trim().charAt(0).toUpperCase() + sport.trim().slice(1).toLowerCase();

    const booking = new Booking({
      user: req.user.id,
      turf: turfId,
      sport: normalizedSport,
      date,
      slot,
      courtType,
      durationHours,
      totalPrice
    });

    await booking.save();
    res.json({ msg: 'Booking successful', booking });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get user's own bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('turf');
    res.json(bookings);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Cancel a booking (User's own)
router.delete('/bookings/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    // Check ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Instead of deleting, we update status to cancelled
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ msg: 'Booking cancelled' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- REVIEWS ---

// Get reviews for a turf
router.get('/reviews/turf/:turfId', async (req, res) => {
  try {
    const reviews = await Review.find({ turf: req.params.turfId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Post a review (Auth required)
router.post('/reviews', auth, async (req, res) => {
  try {
    const { turfId, bookingId, rating, comment, isAnonymous } = req.body;

    // 1. Verify booking ownership and status
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Unauthorized' });

    // 2. Check if a review already exists for this booking
    const existing = await Review.findOne({ booking: bookingId });
    if (existing) return res.status(400).json({ msg: 'Review already exists for this booking' });

    const review = new Review({
      user: req.user.id,
      turf: turfId,
      booking: bookingId,
      rating,
      comment,
      isAnonymous
    });

    await review.save();
    
    // Update turf rating
    const reviews = await Review.find({ turf: turfId });
    const turf = await Turf.findById(turfId);
    if(turf) {
      turf.rating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await turf.save();
    }

    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Delete own review
router.delete('/reviews/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ msg: 'Review not found' });
    if (review.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Unauthorized' });

    await Review.findByIdAndDelete(req.params.id);
    
    // Update turf rating
    const reviews = await Review.find({ turf: review.turf });
    const turf = await Turf.findById(review.turf);
    if(turf) {
      turf.rating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
      await turf.save();
    }

    res.json({ msg: 'Review deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
