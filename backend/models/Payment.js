const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  method: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['successful', 'failed', 'pending'], default: 'successful' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);
