const router = require('express').Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const { auth, admin } = require('../middleware/auth');
const wrap = require('../utils/wrap');

router.use(auth, admin);

router.get('/users', wrap(async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt').lean();
  const counts = await Item.aggregate([{ $group: { _id: '$reporter', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json({ users: users.map((u) => ({ ...u, itemCount: map[String(u._id)] || 0 })) });
}));

router.get('/items', wrap(async (req, res) => {
  const f = {};
  if (req.query.type) f.type = req.query.type;
  const items = await Item.find(f).sort('-createdAt').limit(300).populate({ path: 'reporter', select: 'name email' });
  res.json({ items });
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
