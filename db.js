const Database = require('better-sqlite3');
const db = new Database('tickets.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_code TEXT UNIQUE,
    event_name TEXT,
    ticket_type TEXT,
    sender_name TEXT,
    buyer_email TEXT,
    amount REAL,
    currency TEXT,
    payment_method TEXT,
    token TEXT UNIQUE,
    status TEXT DEFAULT 'available',
    receipt_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;