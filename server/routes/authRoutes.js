const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/securityMiddleware');

router.post('/login', authLimiter, AuthController.login);
router.get('/verify', authMiddleware, AuthController.verifyToken);
router.post('/change-password', authMiddleware, AuthController.changePassword);

module.exports = router;
