const Item = require('../models/Item');
const Match = require('../models/Match');
const notify = require('./notify');

const MIN_SCORE = 50;
const STOP = new Set(['the', 'and', 'with', 'for', 'was', 'has', 'have', 'from', 'this', 'that', 'lost', 'found', 'near', 'had']);
const tokens = (s) => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const inter = (a, b) => [...a].filter((x) => b.has(x)).length;
const jaccard = (a, b) => (a.size + b.size === 0 ? 0 : inter(a, b) / (a.size + b.size - inter(a, b)));
const overlap = (a, b) => (!a.size || !b.size ? 0 : inter(a, b) / Math.min(a.size, b.size));
const same = (a, b) => { a = a.toLowerCase().trim(); b = b.toLowerCase().trim(); return a === b || a.includes(b) || b.includes(a); };

// Returns 0-100. Fields left blank on either side are skipped instead of counted as a mismatch.
function score(a, b) {
  let earned = 0, possible = 0;
  const add = (w, r) => { possible += w; earned += w * r; };

  const nameRatio = Math.max(
    jaccard(tokens(a.name), tokens(b.name)),
    0.7 * overlap(tokens(`${a.name} ${a.description}`), tokens(`${b.name} ${b.description}`))
  );
  add(35, nameRatio);
  add(20, a.category === b.category ? 1 : 0);
  if (a.color && b.color) add(15, same(a.color, b.color) ? 1 : 0);
  if (a.brand && b.brand) add(10, same(a.brand, b.brand) ? 1 : 0);
  add(10, a.location === b.location ? 1 : (a.location === 'Other' || b.location === 'Other') ? 0.3 : 0);
  const days = Math.abs(new Date(a.date) - new Date(b.date)) / 86400000;
  add(10, days <= 1 ? 1 : days <= 3 ? 0.8 : days <= 7 ? 0.5 : days <= 14 ? 0.2 : 0);

  return Math.round((earned / possible) * 100);
}

// Compare a new item against active items of the opposite type and notify both owners.
async function findMatches(item) {
  const opposite = item.type === 'lost' ? 'found' : 'lost';
  const candidates = await Item.find({ type: opposite, status: 'active', reporter: { $ne: item.reporter } });
  for (const c of candidates) {
    const lost = item.type === 'lost' ? item : c;
    const found = item.type === 'found' ? item : c;
    const s = score(lost, found);
    if (s < MIN_SCORE) continue;
    if (await Match.findOne({ lost: lost._id, found: found._id })) continue;
    await Match.create({ lost: lost._id, found: found._id, score: s });
    await notify(lost.reporter, 'match', `Possible match — ${s}%: found item "${found.name}" looks like your lost "${lost.name}".`, `/item/${found._id}`);
    await notify(found.reporter, 'match', `Possible match — ${s}%: your found "${found.name}" may belong to someone who lost "${lost.name}".`, '/dashboard?tab=matches');
  }
}
module.exports = { score, findMatches };
