const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function load(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(id).select('-password');
  } catch { return null; }
}
exports.auth = async (req, res, next) => {
  const u = await load(req);
  if (!u) return res.status(401).json({ message: 'Please log in to continue' });
  req.user = u; next();
};
exports.optionalAuth = async (req, res, next) => { req.user = await load(req); next(); };
exports.admin = (req, res, next) =>
  req.user && req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });
