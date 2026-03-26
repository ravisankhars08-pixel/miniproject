const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/authMiddleware');
const Location = require('../models/Location');
const Turf = require('../models/Turf');
const Booking = require('../models/Booking');

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
    await Booking.findByIdAndDelete(req.params.id);
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

module.exports = router;
