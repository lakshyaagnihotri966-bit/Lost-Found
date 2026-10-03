const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const wrap = require('../utils/wrap');
const { isSuperAdmin } = require('../utils/admins');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '57285893340-mol4ke4n4eri603382tqtmvbk8n4vpen.apps.googleusercontent.com';
const gClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone || '', avatar: u.avatar || '' });

// Returns digits with country code (10-digit Indian numbers get 91), or null if invalid.
function normPhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = '91' + d;
  return d.length >= 11 && d.length <= 15 ? d : null;
}

// Sign-up is only through Google now.
router.post('/register', (req, res) => res.status(403).json({ message: 'Please sign up with your Google account' }));

// Password login is kept for the admin account only (and old seed users).
router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (user && !user.password) return res.status(400).json({ message: 'This account uses Google login' });
  if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: sign(user), user: pub(user) });
}));

router.post('/google', wrap(async (req, res) => {
  let p;
  try {
    const ticket = await gClient.verifyIdToken({ idToken: req.body.credential, audience: GOOGLE_CLIENT_ID });
    p = ticket.getPayload();
  } catch (e) { return res.status(401).json({ message: 'Google login failed. Please try again.' }); }
  if (!p || !p.email || !p.email_verified) return res.status(400).json({ message: 'Your Google email is not verified' });

  const email = p.email.toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: p.name || email.split('@')[0], email, googleId: p.sub, avatar: p.picture || '',
      role: isSuperAdmin(email) ? 'admin' : 'user',
    });
  } else {
    if (!user.googleId) user.googleId = p.sub;
    if (!user.avatar && p.picture) user.avatar = p.picture;
    if (isSuperAdmin(email) && user.role !== 'admin') user.role = 'admin';
    await user.save();
  }
  res.json({ token: sign(user), user: pub(user) });
}));

router.get('/me', auth, (req, res) => res.json({ user: pub(req.user) }));

router.put('/me', auth, wrap(async (req, res) => {
  const phone = normPhone(req.body.phone);
  if (!phone) return res.status(400).json({ message: 'Enter a valid WhatsApp number (10 digits, or with country code)' });
  req.user.phone = phone;
  await req.user.save();
  res.json({ user: pub(req.user) });
}));
module.exports = router;
