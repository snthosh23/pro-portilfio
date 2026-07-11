const DBModel = require('../models/db');

const THEME_DOC_ID = 'theme';
const SETTINGS_COLLECTION = 'settings';

class ThemeController {
  static async getTheme(req, res) {
    try {
      let theme = await DBModel.getById(SETTINGS_COLLECTION, THEME_DOC_ID);
      
      if (!theme) {
        // Bootstrap premium, elegant default theme settings (dark mode, purple/indigo accents, glassmorphism)
        theme = {
          id: THEME_DOC_ID,
          primaryColor: '#6366f1',      // Indigo
          secondaryColor: '#a855f7',    // Purple
          accentColor: '#f43f5e',       // Rose
          backgroundColor: '#090d16',   // Rich dark deep blue/black
          textColor: '#f8fafc',         // Off-white
          buttonColor: '#6366f1',
          cardColor: '#111827',         // Cool dark grey
          navbarColor: '#090d16e0',     // Frosted transparency
          footerColor: '#030712',
          borderRadius: '16px',
          fontFamily: "'Outfit', 'Inter', sans-serif",
          themeMode: 'dark',
          glassmorphism: true,
          animationSpeed: 1.0 // 1.0 = normal, 0.5 = fast, 1.5 = slow
        };
        await DBModel.set(SETTINGS_COLLECTION, THEME_DOC_ID, theme);
      }
      
      return res.status(200).json(theme);
    } catch (error) {
      console.error('Error fetching theme:', error);
      return res.status(500).json({ error: 'Server error loading theme settings' });
    }
  }

  static async updateTheme(req, res) {
    try {
      const data = { ...req.body };
      
      // Ensure data validation
      const updated = await DBModel.set(SETTINGS_COLLECTION, THEME_DOC_ID, data);
      return res.status(200).json({ success: true, theme: updated });
    } catch (error) {
      console.error('Error updating theme:', error);
      return res.status(500).json({ error: 'Server error updating theme settings' });
    }
  }
}

module.exports = ThemeController;
