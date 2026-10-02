const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const wrap = require('../utils/wrap');

const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post('/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'This email is already registered' });
  const role = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), role });
  res.status(201).json({ token: sign(user), user: pub(user) });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: sign(user), user: pub(user) });
}));

router.get('/me', auth, (req, res) => res.json({ user: pub(req.user) }));
module.exports = router;
