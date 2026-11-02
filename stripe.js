const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

async function createCheckoutSession(ticketCode, eventName, buyerEmail, token, amount, currency, paymentMethod) {
  
  const session = await stripe.checkout.sessions.create({
    customer_email: buyerEmail,
    client_reference_id: token, 
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(), 
          product_data: {
            name: eventName,
            description: `Ticket Code: ${ticketCode}`, 
          },
          unit_amount: Math.round(parseFloat(amount) * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.BASE_URL}/success`,
    cancel_url: `${process.env.BASE_URL}/cancel`,
  });

  return session;
}

module.exports = { createCheckoutSession };