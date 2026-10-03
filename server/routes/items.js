const router = require('express').Router();
const QRCode = require('qrcode');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Report = require('../models/Report');
const User = require('../models/User');
const Match = require('../models/Match');
const { auth, optionalAuth } = require('../middleware/auth');
const { upload, saveImage } = require('../utils/upload');
const wrap = require('../utils/wrap');
const notify = require('../utils/notify');
const markRecovered = require('../utils/recover');
const { findMatches } = require('../utils/match');
const { CATEGORIES, LOCATIONS } = require('../constants');

const rx = (s) => new RegExp(String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
const isAdmin = (u) => u && u.role === 'admin';

router.get('/meta', (req, res) => res.json({ categories: CATEGORIES, locations: LOCATIONS, reportReasons: require('../constants').REPORT_REASONS }));

router.get('/stats', wrap(async (req, res) => {
  const [lost, found, recovered] = await Promise.all([
    Item.countDocuments({ type: 'lost', status: 'active' }),
    Item.countDocuments({ type: 'found', status: 'active' }),
    Item.countDocuments({ status: 'recovered' }),
  ]);
  res.json({ total: lost + found + recovered, lost, found, recovered });
}));

// Public list: active items only, reporter is never exposed
router.get('/', wrap(async (req, res) => {
  const { q, category, type, location, color, brand, date } = req.query;
  const f = { status: 'active' };
  if (type) f.type = type;
  if (category) f.category = category;
  if (location) f.location = location;
  if (color) f.color = rx(color);
  if (brand) f.brand = rx(brand);
  if (q) f.$or = [{ name: rx(q) }, { description: rx(q) }, { additional: rx(q) }];
  if (date) {
    const d = new Date(date);
    if (!isNaN(d)) { const n = new Date(d); n.setDate(n.getDate() + 1); f.date = { $gte: d, $lt: n }; }
  }
  const items = await Item.find(f).select('-reporter').sort('-createdAt').limit(100);
  res.json({ items });
}));

router.get('/mine', auth, wrap(async (req, res) => {
  res.json({ items: await Item.find({ reporter: req.user._id }).sort('-createdAt') });
}));

router.get('/matches/mine', auth, wrap(async (req, res) => {
  const mine = await Item.find({ reporter: req.user._id, status: 'active' }).select('_id');
  const ids = new Set(mine.map((i) => String(i._id)));
  const matches = await Match.find({ $or: [{ lost: { $in: [...ids] } }, { found: { $in: [...ids] } }] })
    .sort('-score').populate({ path: 'lost', select: '-reporter' }).populate({ path: 'found', select: '-reporter' });
  const out = matches
    .filter((m) => m.lost && m.found && m.lost.status === 'active' && m.found.status === 'active')
    .map((m) => ({ _id: m._id, score: m.score, lost: m.lost, found: m.found, mine: ids.has(String(m.lost._id)) ? 'lost' : 'found' }));
  res.json({ matches: out });
}));

router.post('/', auth, upload.single('image'), wrap(async (req, res) => {
  const b = req.body;
  for (const k of ['type', 'name', 'category', 'location', 'date']) {
    if (!b[k] || !String(b[k]).trim()) return res.status(400).json({ message: `Please fill in: ${k}` });
  }
  if (!['lost', 'found'].includes(b.type)) return res.status(400).json({ message: 'Invalid item type' });
  if (!CATEGORIES.includes(b.category)) return res.status(400).json({ message: 'Invalid category' });
  if (!LOCATIONS.includes(b.location)) return res.status(400).json({ message: 'Invalid location' });
  const date = new Date(b.date);
  if (isNaN(date)) return res.status(400).json({ message: 'Invalid date' });

  const imageUrl = await saveImage(req.file);
  const item = await Item.create({
    type: b.type, name: b.name.trim(), category: b.category, description: b.description || '',
    color: b.color || '', brand: b.brand || '', date, location: b.location,
    additional: b.additional || '', imageUrl, reporter: req.user._id,
  });
  await findMatches(item).catch((e) => console.error('matching failed:', e.message));
  res.status(201).json({ item });
}));

router.get('/:id/qr', wrap(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item || item.type !== 'found') return res.status(404).json({ message: 'Found item not found' });
  const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/item/${item._id}`;
  const qr = await QRCode.toDataURL(url, { width: 320, margin: 2, color: { dark: '#012F8B', light: '#FFFFFF' } });
  res.json({ qr, url });
}));

// Public details page. Reporter identity is stripped.
router.get('/:id', optionalAuth, wrap(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  const o = item.toObject();
  const isOwner = !!req.user && item.reporter.equals(req.user._id);
  delete o.reporter;
  let myClaim = null;
  if (req.user) myClaim = await Claim.findOne({ item: item._id, claimant: req.user._id }).sort('-createdAt').select('status');
  // Logged-in users get the poster's name and WhatsApp number so they can contact them directly
  let contact = null;
  if (req.user && !isOwner) {
    const r = await User.findById(item.reporter).select('name phone');
    if (r) contact = { name: r.name, phone: r.phone || '' };
  }
  res.json({ item: o, isOwner, myClaim, contact });
}));

// Edit a listing (owner or admin). Image is optional; leaving it out keeps the old photo.
router.put('/:id', auth, upload.single('image'), wrap(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (!isAdmin(req.user) && !item.reporter.equals(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
  const b = req.body;
  if (b.name !== undefined) { if (!String(b.name).trim()) return res.status(400).json({ message: 'Name is required' }); item.name = b.name.trim(); }
  if (b.category !== undefined) { if (!CATEGORIES.includes(b.category)) return res.status(400).json({ message: 'Invalid category' }); item.category = b.category; }
  if (b.location !== undefined) { if (!LOCATIONS.includes(b.location)) return res.status(400).json({ message: 'Invalid location' }); item.location = b.location; }
  if (b.date) { const d = new Date(b.date); if (isNaN(d)) return res.status(400).json({ message: 'Invalid date' }); item.date = d; }
  for (const k of ['description', 'color', 'brand', 'additional']) if (b[k] !== undefined) item[k] = b[k];
  if (req.file) item.imageUrl = await saveImage(req.file);
  await item.save();
  res.json({ item });
}));

router.patch('/:id/recover', auth, wrap(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (!isAdmin(req.user) && !item.reporter.equals(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
  if (item.status !== 'recovered') await markRecovered(item);
  res.json({ item });
}));

router.delete('/:id', auth, wrap(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  const owner = item.reporter.equals(req.user._id);
  if (!isAdmin(req.user) && !owner) return res.status(403).json({ message: 'Not allowed' });
  await Promise.all([
    Claim.deleteMany({ item: item._id }),
    Report.deleteMany({ item: item._id }),
    Match.deleteMany({ $or: [{ lost: item._id }, { found: item._id }] }),
    item.deleteOne(),
  ]);
  if (!owner) await notify(item.reporter, 'removed', `Your listing "${item.name}" was removed by an admin.`);
  res.json({ ok: true });
}));

module.exports = router;
