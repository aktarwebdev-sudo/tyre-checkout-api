const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      tyreName, 
      price, 
      quantity, 
      customerName, 
      customerEmail, 
      fittingDate, 
      fittingTime 
    } = req.body;

    if (!tyreName || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const unitAmount = Math.round(Number(price) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: tyreName,
              description: `Fitting: ${fittingDate || 'TBC'} at ${fittingTime || ''}`,
            },
            unit_amount: unitAmount,
          },
          quantity: Number(quantity),
        },
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Professional Fitting',
            },
            unit_amount: 0000,
          },
          quantity: 1,
        },
      ],
      metadata: {
        customer_name: customerName || '',
        fitting_date: fittingDate || '',
        fitting_time: fittingTime || '',
        tyre: tyreName,
        quantity: String(quantity),
      },
      success_url: 'https://darkturquoise-badger-builder-8sgp6ab2atwbcgvu.hostingersite.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://darkturquoise-badger-builder-8sgp6ab2atwbcgvu.hostingersite.com/cancel',
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
