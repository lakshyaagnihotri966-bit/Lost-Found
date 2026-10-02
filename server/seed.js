// Creates test accounts and a few sample items (including a lost/found pair that will match).
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Item = require('./models/Item');
const { findMatches } = require('./utils/match');

(async () => {
  await connectDB();
  const mk = async (name, email, password, role) =>
    (await User.findOne({ email })) || User.create({ name, email, password: await bcrypt.hash(password, 10), role });
  const admin = await mk('MPGI Admin', 'admin@mpgi.edu', 'Admin@123', 'admin');
  const rahul = await mk('Rahul Verma', 'rahul@mpgi.edu', 'Student@123', 'user');
  const priya = await mk('Priya Singh', 'priya@mpgi.edu', 'Student@123', 'user');

  if (!(await Item.countDocuments())) {
    const today = new Date(); const ago = (d) => new Date(Date.now() - d * 86400000);
    const lost = await Item.create({ type: 'lost', name: 'Black Dell Laptop Bag', category: 'Bags', description: 'Black backpack with laptop sleeve', color: 'Black', brand: 'Dell', date: ago(2), location: 'Library', reporter: rahul._id });
    const found = await Item.create({ type: 'found', name: 'Dell backpack', category: 'Bags', description: 'Black laptop bag found near reading hall', color: 'Black', brand: 'Dell', date: ago(1), location: 'Library', reporter: priya._id });
    await findMatches(found);
    await Item.create({ type: 'found', name: 'Blue Water Bottle', category: 'Other', description: 'Steel bottle with stickers', color: 'Blue', date: today, location: 'Canteen', reporter: priya._id });
    await Item.create({ type: 'lost', name: 'Hostel Room Keys', category: 'Keys', description: 'Three keys on a red keychain', color: 'Red', date: ago(3), location: 'Hostel', reporter: rahul._id });
  }
  console.log('Seed complete.\n  admin@mpgi.edu / Admin@123\n  rahul@mpgi.edu / Student@123\n  priya@mpgi.edu / Student@123');
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
