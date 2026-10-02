const router = require('express').Router();
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const { auth } = require('../middleware/auth');
const wrap = require('../utils/wrap');
const notify = require('../utils/notify');
const markRecovered = require('../utils/recover');

// Submit a claim with verification answers
router.post('/item/:itemId', auth, wrap(async (req, res) => {
  const item = await Item.findById(req.params.itemId);
  if (!item || item.type !== 'found') return res.status(404).json({ message: 'Found item not found' });
  if (item.status !== 'active') return res.status(400).json({ message: 'This item has already been recovered' });
  if (item.reporter.equals(req.user._id)) return res.status(400).json({ message: 'You cannot claim your own listing' });
  const { whereLost, uniqueFeature, contents } = req.body;
  if (![whereLost, uniqueFeature, contents].every((x) => x && x.trim())) return res.status(400).json({ message: 'Please answer all verification questions' });
  if (await Claim.findOne({ item: item._id, claimant: req.user._id, status: 'pending' })) return res.status(400).json({ message: 'You already have a pending claim on this item' });
  const claim = await Claim.create({ item: item._id, claimant: req.user._id, answers: { whereLost, uniqueFeature, contents } });
  await notify(item.reporter, 'claim', `${req.user.name} has claimed your found item "${item.name}". Review the answers.`, '/dashboard?tab=claims');
  res.status(201).json({ claim });
}));

router.get('/mine', auth, wrap(async (req, res) => {
  const claims = await Claim.find({ claimant: req.user._id }).sort('-createdAt').populate({ path: 'item', select: 'name imageUrl status type' });
  res.json({ claims });
}));

// Claims on found items that I reported
router.get('/received', auth, wrap(async (req, res) => {
  const mine = await Item.find({ reporter: req.user._id, type: 'found' }).select('_id');
  const claims = await Claim.find({ item: { $in: mine.map((i) => i._id) } }).sort('-createdAt')
    .populate({ path: 'item', select: 'name imageUrl status' }).populate({ path: 'claimant', select: 'name' });
  res.json({ claims });
}));

// Approve / reject: allowed for the finder (item reporter) or an admin
router.patch('/:id', auth, wrap(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const claim = await Claim.findById(req.params.id);
  if (!claim) return res.status(404).json({ message: 'Claim not found' });
  const item = await Item.findById(claim.item);
  if (!item) return res.status(404).json({ message: 'Item no longer exists' });
  if (req.user.role !== 'admin' && !item.reporter.equals(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
  if (claim.status !== 'pending') return res.status(400).json({ message: 'This claim was already reviewed' });

  claim.status = status; claim.reviewedBy = req.user._id; await claim.save();

  if (status === 'rejected') {
    await notify(claim.claimant, 'claim_rejected', `Your claim for "${item.name}" was rejected.`, '/dashboard?tab=claims');
  } else {
    await markRecovered(item);
    await notify(claim.claimant, 'claim_approved', `Your claim for "${item.name}" was approved. Contact the finder or campus office to collect it.`, '/dashboard?tab=claims');
    await notify(claim.claimant, 'recovered', `"${item.name}" is recovered.`, '/dashboard?tab=recovered');
    const others = await Claim.find({ item: item._id, status: 'pending' });
    for (const o of others) {
      o.status = 'rejected'; await o.save();
      await notify(o.claimant, 'claim_rejected', `"${item.name}" was returned to another claimant, so your claim was closed.`, '/dashboard?tab=claims');
    }
  }
  res.json({ claim });
}));

module.exports = router;
