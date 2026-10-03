// Emails that are always admins (they get admin access automatically when they log in with Google).
// More can be added in Render with ADMIN_EMAIL (comma separated).
const list = ['lakshyaagnihotri966@gmail.com', ...(process.env.ADMIN_EMAIL || '').split(',')]
  .map((s) => s.trim().toLowerCase()).filter(Boolean);
module.exports = { isSuperAdmin: (email) => list.includes(String(email || '').toLowerCase()) };
