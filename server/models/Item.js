const mongoose = require('mongoose');
module.exports = mongoose.model('Item', new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, default: '', trim: true },
  brand: { type: String, default: '', trim: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  additional: { type: String, default: '' },
  status: { type: String, enum: ['active', 'recovered'], default: 'active', index: true },
  recoveredAt: Date,
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true }));
