const mongoose = require('mongoose');
module.exports = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String }, // only the admin (and old seed users) have a password; everyone else uses Google
  googleId: { type: String, default: '' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' }, // WhatsApp number, digits only with country code
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true }));
