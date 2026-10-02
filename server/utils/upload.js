const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    const e = new Error('Only image files are allowed'); e.status = 400; cb(e);
  },
});

const useCloud = () => !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

async function saveImage(file) {
  if (!file) return '';
  if (useCloud()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'mpgi-lost-found' }, (err, r) => (err ? reject(err) : resolve(r.secure_url))).end(file.buffer);
    });
  }
  // Local fallback when Cloudinary isn't configured
  const dir = path.join(__dirname, '..', 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  const name = crypto.randomBytes(8).toString('hex') + path.extname(file.originalname).toLowerCase();
  fs.writeFileSync(path.join(dir, name), file.buffer);
  return `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${name}`;
}
module.exports = { upload, saveImage };
