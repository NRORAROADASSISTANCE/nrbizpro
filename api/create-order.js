import crypto from 'node:crypto';

function send(res, code, body) {
  res.setHeader('Content-Type', 'application/json');
  res.status(code).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return send(res, 500, { error: 'Razorpay keys are not configured on the server.' });

  try {
    const { plan, businessName, email, mobile } = req.body || {};
    const amount = plan === 'yearly' ? 199900 : plan === 'monthly' ? 19900 : 0;
    if (!amount) return send(res, 400, { error: 'Invalid plan.' });

    const receipt = `NRBP_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', receipt, notes: { plan, businessName: String(businessName || '').slice(0, 100), email: String(email || '').slice(0, 100), mobile: String(mobile || '').slice(0, 20) } })
    });
    const data = await response.json();
    if (!response.ok) return send(res, response.status, { error: data.error?.description || 'Unable to create Razorpay order.' });
    return send(res, 200, { orderId: data.id, amount: data.amount, currency: data.currency, keyId });
  } catch (error) {
    return send(res, 500, { error: 'Unable to create payment order.' });
  }
}
