const express = require('express');
const router = express.Router();
const PortfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/securityMiddleware');

// 1. Profile Routing (Admin can upload both a photo and a resume file)
router.get('/profile', PortfolioController.getProfile);
router.put('/profile', authMiddleware, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), PortfolioController.updateProfile);

// Helper macro to define CRUD routes in one line
const defineCrudRoutes = (collectionName, singleUploadField = null) => {
  const listRoute = `/${collectionName}`;
  const detailRoute = `/${collectionName}/:id`;

  // Public reading
  router.get(listRoute, PortfolioController.getCollection(collectionName));
  router.get(detailRoute, PortfolioController.getDocById(collectionName));

  // Admin writing
  const uploadMiddleware = singleUploadField ? upload.single(singleUploadField) : upload.none();
  
  router.post(listRoute, authMiddleware, uploadMiddleware, PortfolioController.createDoc(collectionName));
  router.put(detailRoute, authMiddleware, uploadMiddleware, PortfolioController.updateDoc(collectionName));
  router.delete(detailRoute, authMiddleware, PortfolioController.deleteDoc(collectionName));
};

// Define standard text-only CRUDs
defineCrudRoutes('skills');
defineCrudRoutes('education');
defineCrudRoutes('experience');

// Define text + file upload CRUDs
defineCrudRoutes('projects', 'image');
defineCrudRoutes('achievements', 'image');
defineCrudRoutes('certificates', 'image');
defineCrudRoutes('gallery', 'url');
defineCrudRoutes('blogs', 'image');
defineCrudRoutes('testimonials', 'photo');

// 2. Messaging Routes
router.post('/messages', PortfolioController.submitMessage);
router.get('/messages', authMiddleware, PortfolioController.getCollection('messages'));
router.post('/messages/:id/reply', authMiddleware, PortfolioController.replyToMessage);
router.delete('/messages/:id', authMiddleware, PortfolioController.deleteDoc('messages'));
router.get('/messages/export/csv', authMiddleware, PortfolioController.exportMessagesCSV);

// 3. Newsletter Routes
router.post('/newsletter', PortfolioController.submitNewsletter);
router.get('/newsletter', authMiddleware, PortfolioController.getCollection('newsletter'));
router.delete('/newsletter/:id', authMiddleware, PortfolioController.deleteDoc('newsletter'));
router.get('/newsletter/export/csv', authMiddleware, PortfolioController.exportNewsletterCSV);

// 4. Analytics Routes
router.get('/analytics', authMiddleware, PortfolioController.getAnalytics);
router.post('/analytics/visit', PortfolioController.trackVisit);
router.post('/analytics/download', PortfolioController.trackDownload);

module.exports = router;
