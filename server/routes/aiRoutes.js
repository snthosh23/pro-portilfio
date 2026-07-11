const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/chat', authMiddleware, AIController.chat);

module.exports = router;
