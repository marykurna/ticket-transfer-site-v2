require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const multer = require('multer');
const db = require('./db');
const { sendTransferEmail, sendTicketEmail } = require('./mailer');
const fs = require('fs');

const app = express();

// --- SETUP IMAGE UPLOADS ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'public/receipts/'); },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

if (!fs.existsSync('public/receipts')){ fs.mkdirSync('public/receipts', { recursive: true }); }

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- ROUTES ---
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <!-- Meta Pixel Code -->
      <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '3191889931006050');
      fbq('track', 'PageView');
      </script>
      <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=3191889931006050&ev=PageView&noscript=1"
      /></noscript>
      <!-- End Meta Pixel Code -->

      <title>Admin Panel - Send Ticket</title>
      <style>
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #f9f9f9; }
        .card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        input, select, button { width: 100%; padding: 12px; margin: 8px 0 20px 0; box-sizing: border-box; border-radius: 5px; border: 1px solid #ccc; font-size: 14px; }
        button { background-color: #007bff; color: white; border: none; cursor: pointer; font-size: 16px; font-weight: bold; }
        button:hover { background-color: #0056b3; }
        label { font-weight: bold; font-size: 14px; color: #333; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>🎟️ Send a Ticket Transfer</h2>
        <form id="ticketForm">
          <label>Sender Name:</label>
          <input type="text" id="sender_name" required placeholder="e.g. John Doe">

          <label>Event Name:</label>
          <input type="text" id="event_name" required placeholder="e.g. VIP Concert">

          <label>Ticket Type:</label>
          <input type="text" id="ticket_type" required placeholder="e.g. VIP, Standard">

          <label>Amount to Pay:</label>
          <input type="number" id="amount" required placeholder="e.g. 50.00" step="0.01">

          <label>Currency:</label>
          <select id="currency">
            <option value="ZAR">ZAR (R)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>

          <label>Buyer's Email (Receiver):</label>
          <input type="email" id="buyer_email" required placeholder="client@example.com">

          <button type="submit">Send Transfer Email</button>
        </form>
        <p id="message" style="font-weight: bold; text-align: center;"></p>
      </div>

      <script>
        document.getElementById('ticketForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const data = {
            sender_name: document.getElementById('sender_name').value,
            event_name: document.getElementById('event_name').value,
            ticket_type: document.getElementById('ticket_type').value,
            amount: document.getElementById('amount').value,
            currency: document.getElementById('currency').value,
            payment_method: 'manual',
            buyer_email: document.getElementById('buyer_email').value
          };

          const msg = document.getElementById('message');
          msg.style.color = "blue";
          msg.innerText = "Sending email...";

          const res = await fetch('/api/admin/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          const result = await res.json();
          if (result.ok) {
            msg.style.color = "green";
            msg.innerText = "✅ Email sent successfully to " + data.buyer_email;
            document.getElementById('ticketForm').reset();
          } else {
            msg.style.color = "red";
            msg.innerText = "❌ Error: " + result.error;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// DASHBOARD
app.get('/', (req, res) => { sendDashboard(res); });
app.get('/panel', (req, res) => { sendDashboard(res); });

function sendDashboard(res) {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <!-- Meta Pixel Code -->
      <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '3191889931006050');
      fbq('track', 'PageView');
      </script>
      <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=3191889931006050&ev=PageView&noscript=1"
      /></noscript>
      <!-- End Meta Pixel Code -->
      
      <title>Admin Dashboard</title>
      <style>
        body { font-family: sans-serif; max-width: 1000px; margin: 40px auto; padding: 20px; background: #f9f9f9; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn { padding: 10px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; border: none; cursor: pointer;}
        .btn:hover { background: #0056b3; }
        table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #007bff; color: white; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: capitalize; }
        .status.pending_accept { background: #fff3cd; color: #856404; }
        .status.pending_verification { background: #ffe5d0; color: #c82333; }
        .status.sold { background: #d4edda; color: #155724; }
        .approve-btn { background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>🎟️ Ticket Dashboard</h2>
        <a href="/admin" class="btn">+ Send New Ticket</a>
      </div>
      <table>
        <thead>
          <tr>
            <th>Ticket Code</th>
            <th>Event</th>
            <th>Buyer Email</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="ticketTable">
          <tr><td colspan="6">Loading...</td></tr>
        </tbody>
      </table>
      <script>
        async function loadTickets() {
          const res = await fetch('/api/admin/tickets');
          const data = await res.json();
          const tbody = document.getElementById('ticketTable');
          if (!data.ok || data.tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No tickets found.</td></tr>';
            return;
          }
          
          tbody.innerHTML = data.tickets.map(function(t) {
            var actionHtml = '';
            if (t.status === 'pending_verification') {
              actionHtml = '<a href="' + t.receipt_url + '" target="_blank" style="color:blue; margin-right:10px;">View Receipt</a>' +
                           '<button class="approve-btn" onclick="approveTicket(\'' + t.token + '\')">Approve</button>';
            } else if (t.status === 'sold') {
              actionHtml = '<span style="color:green; font-weight:bold;">✅ Sent</span>';
            }

            return '<tr>' +
              '<td><b>' + t.ticket_code + '</b></td>' +
              '<td>' + t.event_name + '</td>' +
              '<td>' + t.buyer_email + '</td>' +
              '<td>' + t.currency + ' ' + t.amount + '</td>' +
              '<td><span class="status ' + t.status + '">' + t.status.replace('_', ' ') + '</span></td>' +
              '<td>' + actionHtml + '</td>' +
            '</tr>';
          }).join('');
        }

        async function approveTicket(token) {
          if(!confirm("Are you sure you received the money and want to send the ticket?")) return;
          const res = await fetch('/api/admin/approve/' + token, { method: 'POST' });
          if(res.ok) { alert("Ticket sent to buyer!"); loadTickets(); }
          else { alert("Error approving ticket."); }
        }

        loadTickets();
      </script>
    </body>
    </html>
  `);
}

// API: GET ALL TICKETS
app.get('/api/admin/tickets', (req, res) => {
  try {
    const tickets = db.prepare(`SELECT * FROM tickets ORDER BY created_at DESC`).all();
    res.json({ ok: true, tickets });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// API: ADMIN CREATES TICKET
app.post('/api/admin/send', async (req, res) => {
  try {
    const { event_name, ticket_type, sender_name, buyer_email, amount, currency, payment_method } = req.body;
    const token = uuidv4();
    const ticketCode = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

    db.prepare(
      `INSERT INTO tickets (ticket_code, event_name, ticket_type, sender_name, buyer_email, amount, currency, payment_method, token, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_accept')`
    ).run(ticketCode, event_name, ticket_type, sender_name, buyer_email, amount, currency, payment_method, token);

    const acceptLink = `${process.env.BASE_URL}/accept/${token}`;
    await sendTransferEmail(buyer_email, event_name, acceptLink, sender_name, ticket_type, amount, currency);
    res.json({ ok: true, message: 'Email sent', token });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PAGE: BUYER ACCEPTS TRANSFER
app.get('/accept/:token', (req, res) => {
  const t = db.prepare(`SELECT * FROM tickets WHERE token = ?`).get(req.params.token);
  if (!t) return res.status(404).send('Invalid link.');
  
  res.send(`
    <html>
    <head>
      <!-- Meta Pixel Code -->
      <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '3191889931006050');
      fbq('track', 'PageView');
      </script>
      <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=3191889931006050&ev=PageView&noscript=1"
      /></noscript>
      <!-- End Meta Pixel Code -->
    </head>
    <body style="font-family:sans-serif;text-align:center;margin-top:50px;">
      <h2>Ticket Transfer</h2>
      <p><b>${t.sender_name}</b> sent you a ticket for ${t.event_name}</p>
      <p>Amount Due: ${t.currency} ${t.amount}</p>
      <form method="POST" action="/accept/${t.token}">
        <button style="padding:10px 20px;font-size:16px;">Accept & Pay</button>
      </form>
    </body></html>
  `);
});

// PAGE: PAYMENT INSTRUCTIONS AND UPLOAD
app.post('/accept/:token', (req, res) => {
  const t = db.prepare(`SELECT * FROM tickets WHERE token = ?`).get(req.params.token);
  
  res.send(`
    <html><body style="font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px;text-align:center;">
      <h2>Complete Your Payment</h2>
      <p>Please pay <b>${t.currency} ${t.amount}</b> using one of the methods below.</p>
      
      <div style="background:#f1f1f1; padding:15px; border-radius:8px; text-align:left; margin-bottom:20px;">
        <h3>Cash Send Details:</h3>
        <p><b>Bank:</b> FNB<br><b>Account Name:</b> Your Business Name<br><b>Account Number:</b> 1234567890<br><b>Reference:</b> ${t.ticket_code}</p>
        <h3>1Voucher:</h3>
        <p>Buy a 1Voucher for ${t.amount} and send us the voucher PIN.</p>
      </div>

      <p>After paying, please upload a screenshot of your receipt below:</p>
      <form method="POST" action="/upload-receipt/${t.token}" enctype="multipart/form-data">
        <input type="file" name="receipt" required style="margin-bottom:10px;">
        <button type="submit" style="padding:10px 20px;font-size:16px;background:#28a745;color:white;border:none;border-radius:5px;">Upload Receipt</button>
      </form>
    </body></html>
  `);
});

// API: UPLOAD RECEIPT
app.post('/upload-receipt/:token', upload.single('receipt'), async (req, res) => {
  try {
    const t = db.prepare(`SELECT * FROM tickets WHERE token = ?`).get(req.params.token);
    const receiptUrl = '/receipts/' + req.file.filename;
    
    db.prepare(`UPDATE tickets SET status = 'pending_verification', receipt_url = ? WHERE token = ?`).run(receiptUrl, t.token);

    res.send(`
      <html>
      <head>
        <!-- Meta Pixel Code -->
        <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '3191889931006050');
        fbq('track', 'PageView');
        </script>
        <noscript><img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=3191889931006050&ev=PageView&noscript=1"
        /></noscript>
        <!-- End Meta Pixel Code -->
      </head>
      <body style="font-family:sans-serif;text-align:center;margin-top:50px;">
        <h2>Receipt Uploaded Successfully! ✅</h2>
        <p>We will verify your payment shortly. Once confirmed, your ticket will be emailed to <b>${t.buyer_email}</b>.</p>
        <script>
          fbq('track', 'Purchase', {value: ${t.amount}, currency: '${t.currency}'});
        </script>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('Upload failed: ' + err.message);
  }
});

// API: ADMIN APPROVES RECEIPT
app.post('/api/admin/approve/:token', async (req, res) => {
  try {
    const t = db.prepare(`SELECT * FROM tickets WHERE token = ?`).get(req.params.token);
    if (t && t.status !== 'sold') {
      db.prepare(`UPDATE tickets SET status = 'sold' WHERE id = ?`).run(t.id);
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ code: t.ticket_code, event: t.event_name }));
      await sendTicketEmail(t.buyer_email, t.event_name, t.ticket_code, qrDataUrl);
      res.json({ ok: true });
    } else {
      res.status(400).json({ ok: false, error: 'Ticket already sold or invalid.' });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});