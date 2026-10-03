const router = require('express').Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Report = require('../models/Report');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const { auth, admin } = require('../middleware/auth');
const wrap = require('../utils/wrap');
const notify = require('../utils/notify');
const { isSuperAdmin } = require('../utils/admins');

router.use(auth, admin);

// Deletes listings together with their claims, reports and matches
async function removeItems(ids, notifyOwners) {
  const items = await Item.find({ _id: { $in: ids } });
  if (notifyOwners) {
    for (const i of items) if (i.status === 'active') await notify(i.reporter, 'removed', `Your listing "${i.name}" was removed by an admin.`);
  }
  const all = items.map((i) => i._id);
  await Promise.all([
    Claim.deleteMany({ item: { $in: all } }),
    Report.deleteMany({ item: { $in: all } }),
    Match.deleteMany({ $or: [{ lost: { $in: all } }, { found: { $in: all } }] }),
    Item.deleteMany({ _id: { $in: all } }),
  ]);
  return all.length;
}

router.get('/users', wrap(async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt').lean();
  const counts = await Item.aggregate([{ $group: { _id: '$reporter', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json({ users: users.map((u) => ({ ...u, itemCount: map[String(u._id)] || 0, isSuper: isSuperAdmin(u.email) })) });
}));

// Make someone an admin by email (works even if they have not logged in yet)
router.post('/users/add-admin', wrap(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email' });
  let u = await User.findOne({ email });
  if (u) { u.role = 'admin'; await u.save(); }
  else u = await User.create({ name: email.split('@')[0], email, role: 'admin' });
  await notify(u._id, 'role', 'You are now an admin of MPGI Lost & Found.', '/admin');
  res.json({ ok: true });
}));

router.patch('/users/:id/role', wrap(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  if (u._id.equals(req.user._id)) return res.status(400).json({ message: 'You cannot change your own role' });
  if (isSuperAdmin(u.email)) return res.status(400).json({ message: 'This is a permanent admin' });
  u.role = role; await u.save();
  await notify(u._id, 'role', role === 'admin' ? 'You are now an admin of MPGI Lost & Found.' : 'Your admin access was removed.', '/dashboard');
  res.json({ ok: true });
}));

router.delete('/users/:id', wrap(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  if (u._id.equals(req.user._id)) return res.status(400).json({ message: 'You cannot delete yourself' });
  if (isSuperAdmin(u.email)) return res.status(400).json({ message: 'This is a permanent admin' });
  const mine = await Item.find({ reporter: u._id }).select('_id');
  await removeItems(mine.map((i) => i._id), false);
  await Promise.all([
    Claim.deleteMany({ claimant: u._id }), Report.deleteMany({ reporter: u._id }),
    Notification.deleteMany({ user: u._id }), u.deleteOne(),
  ]);
  res.json({ ok: true });
}));

router.get('/items', wrap(async (req, res) => {
  const f = {};
  if (req.query.type) f.type = req.query.type;
  const items = await Item.find(f).sort('-createdAt').limit(500).populate({ path: 'reporter', select: 'name email phone' });
  res.json({ items });
}));

router.post('/items/bulk-delete', wrap(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.slice(0, 500) : [];
  if (!ids.length) return res.status(400).json({ message: 'Select at least one listing' });
  const deleted = await removeItems(ids, true);
  res.json({ ok: true, deleted });
}));

router.get('/claims', wrap(async (req, res) => {
  const claims = await Claim.find().sort('-createdAt').limit(300)
    .populate({ path: 'item', select: 'name status imageUrl' }).populate({ path: 'claimant', select: 'name email' });
  res.json({ claims: claims.filter((c) => c.item) });
}));

router.get('/stats', wrap(async (req, res) => {
  const items = await Item.find().select('type category location status recoveredAt').lean();
  const tally = (key) => Object.entries(items.reduce((a, i) => ((a[i[key]] = (a[i[key]] || 0) + 1), a), {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }), value: 0 });
  }
  items.filter((i) => i.status === 'recovered' && i.recoveredAt).forEach((i) => {
    const d = new Date(i.recoveredAt);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.value++;
  });

  res.json({
    totals: {
      users: await User.countDocuments(),
      items: items.length,
      pendingClaims: await Claim.countDocuments({ status: 'pending' }),
      recovered: items.filter((i) => i.status === 'recovered').length,
      openReports: await Report.countDocuments({ status: 'open' }),
    },
    lostVsFound: [
      { label: 'Lost', value: items.filter((i) => i.type === 'lost').length },
      { label: 'Found', value: items.filter((i) => i.type === 'found').length },
    ],
    byCategory: tally('category'),
    byLocation: tally('location'),
    recoveredByMonth: months.map(({ label, value }) => ({ label, value })),
  });
}));
module.exports = router;
