const { db } = require('../config/firebase');
const fs = require('fs');
const path = require('path');

const mockDbPath = path.join(__dirname, '..', 'mock_db.json');

// Helper to interact with local JSON file
function readMockDb() {
  if (!fs.existsSync(mockDbPath)) {
    fs.writeFileSync(mockDbPath, JSON.stringify({}));
  }
  try {
    const data = fs.readFileSync(mockDbPath, 'utf8');
    return JSON.parse(data || '{}');
  } catch (e) {
    console.error('Failed to parse mock_db.json, resetting database.', e);
    return {};
  }
}

function writeMockDb(data) {
  try {
    fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write mock_db.json:', e);
  }
}

/**
 * Model helper class mapping MVC actions to Firestore collections.
 * Automatically falls back to local file system database in MOCK/DRY-RUN mode.
 */
class DBModel {
  static async getAll(collectionName) {
    if (global.isFirebaseMock) {
      const dbData = readMockDb();
      return dbData[collectionName] || [];
    }

    try {
      const snapshot = await db.collection(collectionName).get();
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (error) {
      console.error(`DBModel.getAll error for ${collectionName}:`, error);
      return [];
    }
  }

  static async getById(collectionName, id) {
    if (global.isFirebaseMock) {
      const dbData = readMockDb();
      const list = dbData[collectionName] || [];
      const item = list.find(x => x.id === id);
      return item || null;
    }

    try {
      const doc = await db.collection(collectionName).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`DBModel.getById error for ${collectionName}/${id}:`, error);
      return null;
    }
  }

  static async create(collectionName, data) {
    if (global.isFirebaseMock) {
      const dbData = readMockDb();
      if (!dbData[collectionName]) dbData[collectionName] = [];
      
      const newDoc = {
        id: Math.random().toString(36).substring(2, 10),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      dbData[collectionName].push(newDoc);
      writeMockDb(dbData);
      return newDoc;
    }

    try {
      const docRef = await db.collection(collectionName).add({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`DBModel.create error for ${collectionName}:`, error);
      throw error;
    }
  }

  static async set(collectionName, id, data) {
    if (global.isFirebaseMock) {
      const dbData = readMockDb();
      if (!dbData[collectionName]) dbData[collectionName] = [];
      
      const index = dbData[collectionName].findIndex(x => x.id === id);
      const updatedItem = {
        id,
        ...data,
        updatedAt: new Date().toISOString()
      };

      if (index > -1) {
        dbData[collectionName][index] = {
          ...dbData[collectionName][index],
          ...updatedItem
        };
      } else {
        updatedItem.createdAt = new Date().toISOString();
        dbData[collectionName].push(updatedItem);
      }

      writeMockDb(dbData);
      return updatedItem;
    }

    try {
      await db.collection(collectionName).doc(id).set({
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return { id, ...data };
    } catch (error) {
      console.error(`DBModel.set error for ${collectionName}/${id}:`, error);
      throw error;
    }
  }

  static async update(collectionName, id, data) {
    if (global.isFirebaseMock) {
      const dbData = readMockDb();
      const list = dbData[collectionName] || [];
      const index = list.findIndex(x => x.id === id);
      
      if (index === -1) {
        throw new Error('Document not found in local mock database');
      }

      dbData[collectionName][index] = {
        ...dbData[collectionName][index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      writeMockDb(dbData);
      return dbData[collectionName][index];
    }

    try {
      await db.collection(collectionName).doc(id).update({
        ...data,
        updatedAt: new Date().toISOString()
      });
      return { id, ...data };
    } catch (error) {
      console.error(`DBModel.update error for ${collectionName}/${id}:`, error);
      throw error;
    }
  }

  static async delete(collectionName, id) {
    if (global.isFirebaseMock) {
      const dbData = readMockDb();
      const list = dbData[collectionName] || [];
      const filtered = list.filter(x => x.id !== id);
      dbData[collectionName] = filtered;
      writeMockDb(dbData);
      return true;
    }

    try {
      await db.collection(collectionName).doc(id).delete();
      return true;
    } catch (error) {
      console.error(`DBModel.delete error for ${collectionName}/${id}:`, error);
      throw error;
    }
  }

  static async findOne(collectionName, field, value) {
    if (global.isFirebaseMock) {
      const dbData = readMockDb();
      const list = dbData[collectionName] || [];
      const item = list.find(x => x[field] === value);
      return item || null;
    }

    try {
      const snapshot = await db.collection(collectionName).where(field, '==', value).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`DBModel.findOne error for ${collectionName} where ${field}==${value}:`, error);
      return null;
    }
  }

  static async findMany(collectionName, field, operator, value) {
    if (global.isFirebaseMock) {
      const dbData = readMockDb();
      const list = dbData[collectionName] || [];
      
      const filtered = list.filter(item => {
        const itemVal = item[field];
        if (operator === '==') return itemVal === value;
        if (operator === '!=') return itemVal !== value;
        if (operator === '>') return itemVal > value;
        if (operator === '<') return itemVal < value;
        if (operator === '>=') return itemVal >= value;
        if (operator === '<=') return itemVal <= value;
        if (operator === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(value);
        return false;
      });
      
      return filtered;
    }

    try {
      const snapshot = await db.collection(collectionName).where(field, operator, value).get();
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (error) {
      console.error(`DBModel.findMany error for ${collectionName}:`, error);
      return [];
    }
  }
}

module.exports = DBModel;
