const mongoose = require('mongoose');
const s = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  note: { type: String, default: '' },
  status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
}, { timestamps: true });
s.index({ item: 1, reporter: 1 }, { unique: true });
module.exports = mongoose.model('Report', s);
