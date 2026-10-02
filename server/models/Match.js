const mongoose = require('mongoose');
const s = new mongoose.Schema({
  lost: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  found: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  score: { type: Number, required: true },
}, { timestamps: true });
s.index({ lost: 1, found: 1 }, { unique: true });
module.exports = mongoose.model('Match', s);
