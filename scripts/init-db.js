const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'purchases.db');
const db = new Database(dbPath);

console.log('Initializing database at:', dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT NOT NULL,
    storage TEXT NOT NULL,
    condition TEXT NOT NULL,
    price REAL NOT NULL,
    is_diff_taxed INTEGER DEFAULT 1,
    receipt_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('Database initialized successfully.');
