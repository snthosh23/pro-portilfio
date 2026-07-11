const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');

// 1. Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again after an hour' }
});

// 2. Custom XSS Sanitizer
function sanitizeInput(obj, key) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  for (let k in obj) {
    if (typeof obj[k] === 'string') {
      // If it's a blog content field, we want to allow safe rich text tags but strip script elements
      if (k === 'content' || k === 'richText' || key === 'blogs') {
        obj[k] = obj[k].replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
                      .replace(/on\w+="[^"]*"/gi, '')
                      .replace(/javascript:[^\s]*/gi, '');
      } else {
        // Strip all HTML/Script tags for standard text fields
        obj[k] = obj[k].replace(/<[^>]*>/g, '')
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&#x27;')
                      .replace(/\//g, '&#x2F;');
      }
    } else if (typeof obj[k] === 'object') {
      sanitizeInput(obj[k], k);
    }
  }
}

const xssSanitizer = (req, res, next) => {
  if (req.body) sanitizeInput(req.body);
  if (req.query) sanitizeInput(req.query);
  if (req.params) sanitizeInput(req.params);
  next();
};

// 3. Multer Configuration (Secure File Uploads)
// Store files in memory so we can optionally upload them to Firebase Storage inside the controllers, or save locally in a temporary directory inside the workspace
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, SVG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  xssSanitizer,
  upload
};
