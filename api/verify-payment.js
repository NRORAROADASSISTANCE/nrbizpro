import crypto from 'node:crypto';

function send(res, code, body) {
  res.setHeader('Content-Type', 'application/json');
  res.status(code).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return send(res, 500, { error: 'Razorpay secret is not configured on the server.' });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return send(res, 400, { error: 'Missing Razorpay payment fields.' });
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(razorpay_signature)));
    if (!valid) return send(res, 400, { verified: false, error: 'Payment signature verification failed.' });
    return send(res, 200, { verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
  } catch (error) {
    return send(res, 400, { verified: false, error: 'Payment verification failed.' });
  }
}
