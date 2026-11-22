const Database = require('better-sqlite3');
const db = new Database('tickets.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_code TEXT UNIQUE,
    event_name TEXT,
    ticket_type TEXT,
    ticket_quantity INTEGER DEFAULT 1,
    sender_name TEXT,
    buyer_email TEXT,
    amount REAL,
    currency TEXT,
    payment_method TEXT,
    payment_details TEXT,
    token TEXT UNIQUE,
    status TEXT DEFAULT 'pending_accept',
    receipt_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;