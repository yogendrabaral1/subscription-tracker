import * as SQLite from 'expo-sqlite';
import { Subscription, User } from '../types';

const db = SQLite.openDatabaseSync('subscriptions.db');

export const initDatabase = () => {
  return new Promise<void>((resolve, reject) => {
    try {
      // Create subscriptions table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          billingCycle TEXT NOT NULL,
          nextBillingDate TEXT,
          expiryDate TEXT,
          isAutoPayEnabled INTEGER NOT NULL DEFAULT 0,
          isActive INTEGER NOT NULL DEFAULT 1,
          reminderTime INTEGER NOT NULL DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          description TEXT,
          provider TEXT
        );
      `);

      // Create users table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          defaultReminderTime INTEGER NOT NULL DEFAULT 1,
          theme TEXT NOT NULL DEFAULT 'light',
          currency TEXT NOT NULL DEFAULT 'INR'
        );
      `);
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const addSubscription = (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
  return new Promise<string>((resolve, reject) => {
    try {
      const id = Date.now().toString();
      const now = new Date().toISOString();
      
      db.runSync(
        `INSERT INTO subscriptions (id, name, category, amount, currency, billingCycle, nextBillingDate, expiryDate, isAutoPayEnabled, isActive, reminderTime, createdAt, updatedAt, description, provider)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          subscription.name, 
          subscription.category, 
          subscription.amount, 
          subscription.currency,
          subscription.billingCycle,
          subscription.nextBillingDate,
          subscription.expiryDate,
          subscription.isAutoPayEnabled ? 1 : 0,
          subscription.isActive ? 1 : 0,
          subscription.reminderTime,
          now,
          now,
          subscription.description || null,
          subscription.provider || null
        ]
      );
      
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
};

export const getAllSubscriptions = (): Promise<Subscription[]> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync('SELECT * FROM subscriptions ORDER BY nextBillingDate ASC, expiryDate ASC');
      const subscriptions = result.map((row: any) => ({
        ...row,
        isAutoPayEnabled: Boolean(row.isAutoPayEnabled),
        isActive: Boolean(row.isActive)
      }));
      resolve(subscriptions);
    } catch (error) {
      reject(error);
    }
  });
};

export const updateSubscription = (id: string, updates: Partial<Subscription>) => {
  return new Promise<void>((resolve, reject) => {
    try {
      const now = new Date().toISOString();
      const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt');
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => {
        const value = updates[field as keyof Subscription];
        if (field === 'isAutoPayEnabled' || field === 'isActive') {
          return value ? 1 : 0;
        }
        return value;
      });
      
      if (fields.length === 0) {
        resolve();
        return;
      }

      // Filter out undefined values and ensure proper types
      const validValues = values.filter(v => v !== undefined);
      const validFields = fields.filter((_, index) => values[index] !== undefined);
      const validSetClause = validFields.map(field => `${field} = ?`).join(', ');

      db.runSync(
        `UPDATE subscriptions SET ${validSetClause}, updatedAt = ? WHERE id = ?`,
        [...validValues, now, id]
      );
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const deleteSubscription = (id: string) => {
  return new Promise<void>((resolve, reject) => {
    try {
      db.runSync('DELETE FROM subscriptions WHERE id = ?', [id]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const getUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync('SELECT * FROM users LIMIT 1');
      if (result.length > 0) {
        resolve(result[0] as User);
      } else {
        resolve(null);
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const saveUser = (user: User) => {
  return new Promise<void>((resolve, reject) => {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO users (id, name, email, defaultReminderTime, theme, currency)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, user.name, user.email, user.defaultReminderTime, user.theme, user.currency]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const clearAllData = () => {
  return new Promise<void>((resolve, reject) => {
    try {
      // Clear all subscriptions
      db.runSync('DELETE FROM subscriptions');
      
      // Clear all users
      db.runSync('DELETE FROM users');
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
