const express = require('express');
const router = express.Router();
const ThemeController = require('../controllers/themeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', ThemeController.getTheme);
router.put('/', authMiddleware, ThemeController.updateTheme);

module.exports = router;
