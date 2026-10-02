const router = require('express').Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const wrap = require('../utils/wrap');

router.use(auth);
router.get('/', wrap(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(100);
  res.json({ notifications, unread: notifications.filter((n) => !n.read).length });
}));
router.get('/unread-count', wrap(async (req, res) => {
  res.json({ count: await Notification.countDocuments({ user: req.user._id, read: false }) });
}));
router.post('/read-all', wrap(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
}));
router.patch('/:id/read', wrap(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ ok: true });
}));
module.exports = router;
