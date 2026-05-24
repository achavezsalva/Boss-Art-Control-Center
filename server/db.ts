import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new sqlite3.Database(dbPath);

export const initDb = () => {
  console.log("Initializing Database...");
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      console.log("Creating/Verifying tables...");
      
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'Viewer'
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          status TEXT DEFAULT 'stopped',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS backups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message TEXT NOT NULL,
          level TEXT DEFAULT 'info',
          source TEXT DEFAULT 'system',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create default admin if not exists
      db.get('SELECT * FROM users WHERE email = ?', ['admin@artchie.local'], (err, row) => {
        if (err) {
          console.error("Error checking for admin user:", err);
          return;
        }
        if (!row) {
          bcrypt.hash('admin123', 10, (hashErr, hashedPassword) => {
            if (hashErr) {
              console.error("Error hashing admin password:", hashErr);
              return;
            }
            db.run(
              'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
              ['Admin', 'admin@artchie.local', hashedPassword, 'Admin'],
              (insertErr) => {
                if (insertErr) console.error("Error inserting admin user:", insertErr);
                else console.log("Default admin user created.");
              }
            );
          });
        }
      });

      // Use a final run to signal completion
      db.run("SELECT 1", [], (err) => {
        if (err) reject(err);
        else {
          console.log("Database schema ready.");
          resolve();
        }
      });
    });
  });
};

export default db;
export const query = (sql: string, params: any[] = []) => {
  return new Promise<any[]>((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const get = (sql: string, params: any[] = []) => {
  return new Promise<any>((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const run = (sql: string, params: any[] = []) => {
  return new Promise<void>((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};
