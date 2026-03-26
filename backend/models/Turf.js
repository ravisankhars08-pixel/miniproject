const mongoose = require('mongoose');

const TurfSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  sports: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Turf', TurfSchema);
