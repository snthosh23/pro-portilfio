require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const { apiLimiter, xssSanitizer } = require('./middlewares/securityMiddleware');
const AuthController = require('./controllers/authController');

const authRoutes = require('./routes/authRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const themeRoutes = require('./routes/themeRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
// Disable contentSecurityPolicy in helmet for testing if loading third-party scripts like GSAP and FontAwesome
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Middleware
app.use(cors({
  origin: '*', // Allows requests from any origin (including Netlify and local file://)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitizer for XSS
app.use(xssSanitizer);

// Apply API general rate limit
app.use('/api', apiLimiter);

// Serve uploads directory
const uploadsDir = path.join(__dirname, '..', 'client', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve client folder statically (allows single-port local deployment)
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/ai', aiRoutes);

// Catch-all route to serve index.html for SPA-style routing if needed, or fallback
app.get('*', (req, res, next) => {
  // If requesting api routes that don't exist, return 404
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(clientDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Portfolio backend is online.');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'An unexpected error occurred on the server',
    message: err.message
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`=================================================`);
  console.log(`🚀 Portfolio Server running on port ${PORT}`);
  console.log(`📂 Client directory served from: ${clientDir}`);
  console.log(`📁 Uploads directory served from: ${uploadsDir}`);
  console.log(`=================================================`);
  
  // Seed default credentials on startup
  await AuthController.seedAdminIfNeeded();

  // Seed starter content to Firestore if collections are empty
  const { seedDatabaseIfNeeded } = require('./config/seeder');
  await seedDatabaseIfNeeded();
});
