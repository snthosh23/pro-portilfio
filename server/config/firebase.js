const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let db;
let auth;
let storage;

try {
  let serviceAccount = null;

  // 1. Try environment variable JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env variable', e);
    }
  }

  // 2. Try Base64 encoded JSON (ideal for Render/Vercel/Heroku env vars)
  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
      console.log('Firebase credentials loaded successfully from Base64 env variable.');
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64 env variable', e);
    }
  }

  // 3. Try individual env variables (Render/production friendly fallback)
  if (!serviceAccount && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        token_uri: "https://oauth2.googleapis.com/token"
      };
      console.log('Firebase credentials loaded from individual environment variables.');
    } catch (e) {
      console.error('Failed to parse individual Firebase environment variables', e);
    }
  }

  // 4. Try serviceAccountKey.json in the same directory or project root
  if (!serviceAccount) {
    const keyPath = path.join(__dirname, 'serviceAccountKey.json');
    const rootKeyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    
    if (fs.existsSync(keyPath)) {
      serviceAccount = require(keyPath);
    } else if (fs.existsSync(rootKeyPath)) {
      serviceAccount = require(rootKeyPath);
    }
  }

  if (serviceAccount) {
    const bucketName = `${serviceAccount.project_id}.firebasestorage.app`;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName
    });
    console.log(`Firebase Admin SDK initialized successfully with bucket: ${bucketName}`);
    global.isFirebaseMock = false;
  } else {
    // 3. Fallback/Mock mode for local execution when credentials aren't ready
    console.warn('WARNING: Firebase credentials not found. Running in MOCK/DRY-RUN mode.');
    // Initialize mock db, auth, storage structures so server doesn't crash on import
    admin.initializeApp({
      projectId: 'mock-project-id'
    });
    global.isFirebaseMock = true;
  }

  db = admin.firestore();
  auth = admin.auth();
  storage = admin.storage();

} catch (error) {
  console.error('Firebase Admin SDK initialization failed:', error);
}

module.exports = {
  admin,
  db,
  auth,
  storage
};
