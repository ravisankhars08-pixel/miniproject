const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
  sport: { type: String, required: true },
  date: { type: String, required: true },
  slot: { type: String, required: true },
  courtType: { type: String, required: true },
  durationHours: { type: Number, default: 1 },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
  bookedAt: { type: Date, default: Date.now },
});

// Normalize sport name before saving
BookingSchema.pre('save', function(next) {
  if (this.sport) {
    this.sport = this.sport.trim().charAt(0).toUpperCase() + this.sport.trim().slice(1).toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
