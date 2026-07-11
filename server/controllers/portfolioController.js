const DBModel = require('../models/db');
const { admin, storage } = require('../config/firebase');
const fs = require('fs');
const path = require('path');

// File Upload Handler Helper
async function uploadFileHelper(file) {
  if (!file) return null;
  
  const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
  
  try {
    // Check if Firebase Storage is fully configured
    if (admin.apps.length > 0 && admin.app().options.storageBucket && !admin.app().options.storageBucket.includes('mock-project-id')) {
      const bucket = storage.bucket();
      const blob = bucket.file(fileName);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype
        },
        resumable: false
      });
      
      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          console.error('Firebase Storage upload error:', err);
          reject(err);
        });
        
        blobStream.on('finish', async () => {
          // Make file public or get signed URL
          try {
            await blob.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(publicUrl);
          } catch (e) {
            // Fallback signed URL
            const [url] = await blob.getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            });
            resolve(url);
          }
        });
        
        blobStream.end(file.buffer);
      });
    } else {
      // Fallback: Write locally to client/uploads
      const clientUploadsDir = path.join(__dirname, '..', '..', 'client', 'uploads');
      if (!fs.existsSync(clientUploadsDir)) {
        fs.mkdirSync(clientUploadsDir, { recursive: true });
      }
      const filePath = path.join(clientUploadsDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      console.log(`Saved file locally: /uploads/${fileName}`);
      return `/uploads/${fileName}`;
    }
  } catch (error) {
    console.error('File upload helper error:', error);
    // Fallback: Write locally
    try {
      const clientUploadsDir = path.join(__dirname, '..', '..', 'client', 'uploads');
      if (!fs.existsSync(clientUploadsDir)) {
        fs.mkdirSync(clientUploadsDir, { recursive: true });
      }
      const filePath = path.join(clientUploadsDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      return `/uploads/${fileName}`;
    } catch (localError) {
      console.error('Local save fallback also failed:', localError);
      throw error;
    }
  }
}

class PortfolioController {
  // Generic CRUD Handlers
  static getCollection(collectionName) {
    return async (req, res) => {
      try {
        const data = await DBModel.getAll(collectionName);
        
        // Sort items by specific properties if relevant
        if (collectionName === 'education' || collectionName === 'experience') {
          data.sort((a, b) => (b.year || b.timeline || '').localeCompare(a.year || a.timeline || ''));
        } else if (collectionName === 'blogs') {
          data.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        } else if (collectionName === 'gallery') {
          data.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        
        return res.status(200).json(data);
      } catch (error) {
        console.error(`Error fetching collection ${collectionName}:`, error);
        return res.status(500).json({ error: 'Server error retrieving data' });
      }
    };
  }

  static getDocById(collectionName) {
    return async (req, res) => {
      try {
        const doc = await DBModel.getById(collectionName, req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        return res.status(200).json(doc);
      } catch (error) {
        console.error(`Error fetching document from ${collectionName}:`, error);
        return res.status(500).json({ error: 'Server error retrieving details' });
      }
    };
  }

  static createDoc(collectionName) {
    return async (req, res) => {
      try {
        let data = { ...req.body };
        
        // If file is uploaded
        if (req.file) {
          const fileUrl = await uploadFileHelper(req.file);
          // Set file property according to collection need
          if (collectionName === 'projects') data.image = fileUrl;
          else if (collectionName === 'blogs') data.image = fileUrl;
          else if (collectionName === 'achievements') data.image = fileUrl;
          else if (collectionName === 'certificates') data.image = fileUrl; // handles image preview
          else if (collectionName === 'gallery') data.url = fileUrl;
          else if (collectionName === 'testimonials') data.photo = fileUrl;
        }

        // Handle blog slugs or other custom structures
        if (collectionName === 'blogs') {
          data.slug = (data.title || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
          data.date = new Date().toISOString();
        }

        const newDoc = await DBModel.create(collectionName, data);
        return res.status(201).json(newDoc);
      } catch (error) {
        console.error(`Error creating document in ${collectionName}:`, error);
        return res.status(500).json({ error: 'Server error saving data' });
      }
    };
  }

  static updateDoc(collectionName) {
    return async (req, res) => {
      try {
        let data = { ...req.body };
        
        if (req.file) {
          const fileUrl = await uploadFileHelper(req.file);
          if (collectionName === 'projects') data.image = fileUrl;
          else if (collectionName === 'blogs') data.image = fileUrl;
          else if (collectionName === 'achievements') data.image = fileUrl;
          else if (collectionName === 'certificates') data.image = fileUrl;
          else if (collectionName === 'gallery') data.url = fileUrl;
          else if (collectionName === 'testimonials') data.photo = fileUrl;
        }

        if (collectionName === 'blogs' && data.title) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        }

        const updatedDoc = await DBModel.update(collectionName, req.params.id, data);
        return res.status(200).json(updatedDoc);
      } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        return res.status(500).json({ error: 'Server error updating data' });
      }
    };
  }

  static deleteDoc(collectionName) {
    return async (req, res) => {
      try {
        await DBModel.delete(collectionName, req.params.id);
        return res.status(200).json({ success: true, message: 'Deleted successfully' });
      } catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        return res.status(500).json({ error: 'Server error removing data' });
      }
    };
  }

  // Profile-specific Controllers
  static async getProfile(req, res) {
    try {
      // Profile usually has a single document named 'main'
      let profile = await DBModel.getById('profile', 'main');
      if (!profile) {
        // Fallback default profile if not exists
        profile = {
          id: 'main',
          name: 'Santhosh Kumar',
          title: 'Senior UI/UX Designer & Full Stack Developer',
          bio: 'Crafting premium, high-performance web applications with modern architectures.',
          introduction: 'Welcome to my digital space. I build premium, secure web applications.',
          email: 'santhosh@example.com',
          phone: '+1 234 567 8900',
          address: 'Silicon Valley, CA',
          whatsapp: 'https://wa.me/1234567890',
          socials: {
            github: 'https://github.com',
            linkedin: 'https://linkedin.com',
            twitter: 'https://twitter.com'
          },
          resumeUrl: ''
        };
        await DBModel.set('profile', 'main', profile);
      }
      return res.status(200).json(profile);
    } catch (error) {
      console.error('Error in getProfile:', error);
      return res.status(500).json({ error: 'Server error retrieving profile' });
    }
  }

  static async updateProfile(req, res) {
    try {
      let data = { ...req.body };
      
      // Parse social links if passed as string
      if (typeof data.socials === 'string') {
        try {
          data.socials = JSON.parse(data.socials);
        } catch (e) {
          // ignore
        }
      }

      // Check files
      if (req.files) {
        if (req.files.photo && req.files.photo[0]) {
          data.photoUrl = await uploadFileHelper(req.files.photo[0]);
        }
        if (req.files.resume && req.files.resume[0]) {
          data.resumeUrl = await uploadFileHelper(req.files.resume[0]);
        }
      }

      const updated = await DBModel.set('profile', 'main', data);
      return res.status(200).json(updated);
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return res.status(500).json({ error: 'Server error updating profile' });
    }
  }

  // Messaging Controllers
  static async submitMessage(req, res) {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    try {
      const msg = await DBModel.create('messages', {
        name,
        email,
        subject: subject || 'No Subject',
        message,
        replied: false,
        replies: []
      });
      // Increment messages analytic
      await PortfolioController.incrementAnalytic('messages');
      return res.status(201).json({ success: true, message: 'Message sent successfully!', msg });
    } catch (error) {
      console.error('Error submitting message:', error);
      return res.status(500).json({ error: 'Server error saving your message' });
    }
  }

  static async replyToMessage(req, res) {
    const { replyText } = req.body;
    const { id } = req.params;
    if (!replyText) {
      return res.status(400).json({ error: 'Reply text is required' });
    }
    try {
      const msg = await DBModel.getById('messages', id);
      if (!msg) return res.status(404).json({ error: 'Message not found' });
      
      const replies = msg.replies || [];
      replies.push({
        text: replyText,
        date: new Date().toISOString(),
        sender: req.user.email
      });

      await DBModel.update('messages', id, {
        replied: true,
        replies: replies
      });

      return res.status(200).json({ success: true, message: 'Reply sent successfully!' });
    } catch (error) {
      console.error('Error replying to message:', error);
      return res.status(500).json({ error: 'Server error sending reply' });
    }
  }

  // Newsletter Controllers
  static async submitNewsletter(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    try {
      const existing = await DBModel.findOne('newsletter', 'email', email);
      if (existing) {
        return res.status(200).json({ success: true, message: 'Already subscribed!' });
      }
      await DBModel.create('newsletter', { email });
      await PortfolioController.incrementAnalytic('subscribers');
      return res.status(201).json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      return res.status(500).json({ error: 'Server error subscribing' });
    }
  }

  // Analytics Helpers
  static async getAnalytics(req, res) {
    try {
      let analytics = await DBModel.getById('analytics', 'dashboard');
      if (!analytics) {
        analytics = {
          id: 'dashboard',
          visitors: 120,
          downloads: 45,
          messages: 0,
          subscribers: 0,
          visitorHistory: [10, 15, 20, 25, 18, 30, 22], // Last 7 days mock default
          downloadHistory: [2, 5, 8, 4, 3, 10, 13]
        };
        await DBModel.set('analytics', 'dashboard', analytics);
      }
      return res.status(200).json(analytics);
    } catch (error) {
      console.error('Error retrieving analytics:', error);
      return res.status(500).json({ error: 'Server error fetching analytics data' });
    }
  }

  static async trackVisit(req, res) {
    try {
      await PortfolioController.incrementAnalytic('visitors');
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  static async trackDownload(req, res) {
    try {
      await PortfolioController.incrementAnalytic('downloads');
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  static async incrementAnalytic(field) {
    try {
      let analytics = await DBModel.getById('analytics', 'dashboard');
      if (!analytics) {
        analytics = {
          id: 'dashboard',
          visitors: 0,
          downloads: 0,
          messages: 0,
          subscribers: 0,
          visitorHistory: [0, 0, 0, 0, 0, 0, 0],
          downloadHistory: [0, 0, 0, 0, 0, 0, 0]
        };
      }
      
      analytics[field] = (analytics[field] || 0) + 1;
      
      // Update history arrays
      if (field === 'visitors') {
        const history = analytics.visitorHistory || [0, 0, 0, 0, 0, 0, 0];
        history[history.length - 1] += 1;
        analytics.visitorHistory = history;
      } else if (field === 'downloads') {
        const history = analytics.downloadHistory || [0, 0, 0, 0, 0, 0, 0];
        history[history.length - 1] += 1;
        analytics.downloadHistory = history;
      }
      
      await DBModel.set('analytics', 'dashboard', analytics);
    } catch (e) {
      console.error('Failed to increment analytic:', e);
    }
  }

  // CSV Export Handlers
  static async exportMessagesCSV(req, res) {
    try {
      const messages = await DBModel.getAll('messages');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=messages.csv');
      
      let csvContent = 'Name,Email,Subject,Message,Replied,Date\n';
      messages.forEach(msg => {
        const row = [
          `"${(msg.name || '').replace(/"/g, '""')}"`,
          `"${(msg.email || '').replace(/"/g, '""')}"`,
          `"${(msg.subject || '').replace(/"/g, '""')}"`,
          `"${(msg.message || '').replace(/"/g, '""')}"`,
          msg.replied ? 'Yes' : 'No',
          `"${msg.createdAt || ''}"`
        ].join(',');
        csvContent += row + '\n';
      });
      
      return res.status(200).send(csvContent);
    } catch (error) {
      console.error('CSV Export messages failed:', error);
      return res.status(500).json({ error: 'CSV Export failed' });
    }
  }

  static async exportNewsletterCSV(req, res) {
    try {
      const subscribers = await DBModel.getAll('newsletter');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=newsletter.csv');
      
      let csvContent = 'Email,Subscribed Date\n';
      subscribers.forEach(sub => {
        csvContent += `"${sub.email}", "${sub.createdAt || ''}"\n`;
      });
      
      return res.status(200).send(csvContent);
    } catch (error) {
      console.error('CSV Export newsletter failed:', error);
      return res.status(500).json({ error: 'CSV Export failed' });
    }
  }
}

module.exports = PortfolioController;
