const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const Turf = require('../models/Turf');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/authMiddleware');

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
    const { turfId, date, slot, courtType, durationHours, totalPrice } = req.body;
    
    const booking = new Booking({
      user: req.user.id,
      turf: turfId,
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

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Booking cancelled' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
