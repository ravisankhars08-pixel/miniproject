const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
  date: { type: String, required: true },
  slot: { type: String, required: true },
  courtType: { type: String, required: true },
  durationHours: { type: Number, default: 1 },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
  bookedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', BookingSchema);
