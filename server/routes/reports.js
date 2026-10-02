const router = require('express').Router();
const Item = require('../models/Item');
const Report = require('../models/Report');
const { auth, admin } = require('../middleware/auth');
const wrap = require('../utils/wrap');
const notify = require('../utils/notify');
const { REPORT_REASONS } = require('../constants');

router.post('/item/:itemId', auth, wrap(async (req, res) => {
  const { reason, note } = req.body;
  if (!REPORT_REASONS.includes(reason)) return res.status(400).json({ message: 'Choose a reason' });
  const item = await Item.findById(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (item.reporter.equals(req.user._id)) return res.status(400).json({ message: 'You cannot report your own listing' });
  if (await Report.findOne({ item: item._id, reporter: req.user._id })) return res.status(400).json({ message: 'You already reported this listing' });
  await Report.create({ item: item._id, reporter: req.user._id, reason, note: note || '' });
  res.status(201).json({ ok: true });
}));

router.get('/', auth, admin, wrap(async (req, res) => {
  const reports = await Report.find().sort('-createdAt')
    .populate({ path: 'item', select: 'name type imageUrl status' }).populate({ path: 'reporter', select: 'name' });
  res.json({ reports: reports.filter((r) => r.item) });
}));

router.patch('/:id', auth, admin, wrap(async (req, res) => {
  const { status } = req.body;
  if (!['resolved', 'dismissed'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate({ path: 'item', select: 'name' });
  if (!report) return res.status(404).json({ message: 'Report not found' });
  const name = report.item ? report.item.name : 'a listing';
  await notify(report.reporter, 'report_reviewed',
    status === 'resolved'
      ? `Thanks! Your report on "${name}" was reviewed and action was taken.`
      : `Your report on "${name}" was reviewed and no action was needed.`);
  res.json({ ok: true });
}));
module.exports = router;
