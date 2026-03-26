const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String, default: '📍' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Location', LocationSchema);
