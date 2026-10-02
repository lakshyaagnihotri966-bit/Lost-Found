const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const User = require('../models/User');

let transporter;
function mailer() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
  }
  return transporter;
}

// Creates an in-app notification and (if Gmail is configured) emails the user too.
module.exports = async function notify(userId, type, message, link = '/dashboard') {
  try {
    await Notification.create({ user: userId, type, message, link });
    const m = mailer();
    if (!m) return;
    const u = await User.findById(userId).select('email');
    if (!u) return;
    m.sendMail({
      from: `MPGI Lost & Found <${process.env.GMAIL_USER}>`,
      to: u.email,
      subject: `MPGI Lost & Found: ${message.slice(0, 70)}`,
      text: `${message}\n\nOpen: ${(process.env.CLIENT_URL || '')}${link}`,
    }).catch((e) => console.error('Email failed:', e.message));
  } catch (e) { console.error('notify failed:', e.message); }
};
