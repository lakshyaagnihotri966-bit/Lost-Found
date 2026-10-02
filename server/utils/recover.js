const notify = require('./notify');
module.exports = async function markRecovered(item) {
  item.status = 'recovered';
  item.recoveredAt = new Date();
  await item.save();
  await notify(item.reporter, 'recovered', `"${item.name}" is now marked as recovered.`, `/item/${item._id}`);
};
