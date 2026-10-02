const mongoose = require('mongoose');
module.exports = mongoose.model('Claim', new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  answers: {
    whereLost: { type: String, required: true },
    uniqueFeature: { type: String, required: true },
    contents: { type: String, required: true },
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }));
