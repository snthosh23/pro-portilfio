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

  // 2. Try serviceAccountKey.json in the same directory or project root
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
