const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendTransferEmail(to, eventName, acceptLink, senderName, ticketType, amount, currency) {
  await transporter.sendMail({
    from: `"Tickets" <${process.env.EMAIL_USER}>`,
    to,
    subject: `You have a ticket transfer to accept: ${eventName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>You've been sent a ticket!</h2>
        <p><b>${senderName}</b> has sent you a ticket for <b>${eventName}</b>.</p>
        <p><b>Ticket Type:</b> ${ticketType}</p>
        <p><b>Amount to Pay:</b> ${currency} ${amount}</p>
        <br>
        <p>Click below to accept the transfer. After accepting, you will be prompted to pay to unlock your ticket.</p>
        <a href="${acceptLink}" style="padding:12px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;display:inline-block;">Accept Transfer</a>
        <br><br>
        <p style="font-size: 12px; color: #777;">If the button doesn't work, copy this link: ${acceptLink}</p>
      </div>
    `
  });
}

async function sendTicketEmail(to, eventName, ticketCode, qrDataUrl) {
  await transporter.sendMail({
    from: `"Tickets" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your ticket for ${eventName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Payment confirmed ✅</h2>
        <p>Your ticket for <b>${eventName}</b> is ready.</p>
        <p>Ticket code: <b>${ticketCode}</b></p>
        <p>Show this QR code at the entrance:</p>
        <img src="${qrDataUrl}" alt="Ticket QR" style="border: 1px solid #ccc; padding: 10px; border-radius: 10px;" />
      </div>
    `
  });
}

module.exports = { sendTransferEmail, sendTicketEmail };