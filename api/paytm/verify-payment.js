import PaytmChecksum from 'paytmchecksum';
import { sql, initDb, sessionBusiness } from '../../lib/db.js';

function send(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const mid = process.env.PAYTM_MID;
  const key = process.env.PAYTM_MERCHANT_KEY;
  const environment = String(process.env.PAYTM_ENVIRONMENT || 'staging').toLowerCase();
  if (!mid || !key) return send(res, 503, { error: 'Paytm test credentials are not configured for this deployment.' });
  try {
    await initDb();
    const business = await sessionBusiness(req);
    if (!business) return send(res, 401, { error: 'Login session expired. Please login and retry.' });
    const orderId = String(req.body?.orderId || '').trim();
    if (!/^[A-Za-z0-9_@-]{1,50}$/.test(orderId)) return send(res, 400, { error: 'Invalid Paytm order reference.' });
    const planFees = { monthly12: 5988, monthly24: 11976, year3: 6000, year6: 8500, lifetime: 18500 };
    const days = { monthly12: 365, monthly24: 730, year3: 1095, year6: 2190, lifetime: 0 };
    const plan = String(business.pending_plan || '');
    const expectedAmount = planFees[plan] * 100;
    if (!planFees[plan] || Number(business.pending_amount) !== planFees[plan]) return send(res, 400, { error: 'No matching pending membership payment was found.' });
    const host = environment === 'production' ? 'https://secure.paytmpayments.com' : 'https://securestage.paytmpayments.com';
    const statusBody = { mid, orderId };
    const signature = await PaytmChecksum.generateSignature(JSON.stringify(statusBody), key);
    const response = await fetch(host + '/v3/order/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: statusBody, head: { signature } })
    });
    const result = await response.json();
    if (!response.ok || !result?.body || !result?.head?.signature) return send(res, 502, { error: 'Could not confirm payment status with Paytm. Please retry.' });
    const valid = await PaytmChecksum.verifySignature(JSON.stringify(result.body), key, result.head.signature);
    if (!valid) return send(res, 400, { error: 'Paytm status signature verification failed.' });
    const payment = result.body;
    if (String(payment.orderId || '') !== orderId || String(payment.mid || '') !== mid) return send(res, 400, { error: 'Paytm order details did not match.' });
    if (payment.resultInfo?.resultStatus !== 'TXN_SUCCESS') return send(res, 400, { error: payment.resultInfo?.resultMsg || 'Paytm has not confirmed a successful payment yet.' });
    if (Math.round(Number(payment.txnAmount) * 100) !== expectedAmount) return send(res, 400, { error: 'Paytm payment amount does not match the selected membership.' });
    if (business.last_payment_id && business.last_payment_id === payment.txnId) {
      const existing = await sql`SELECT id,business,owner,mobile,email,category,gst,address,status,plan,subscription_ends,pending_plan,pending_amount,last_payment_id FROM businesses WHERE id=${business.id}`;
      return send(res, 200, { verified: true, alreadyProcessed: true, user: existing.rows[0] });
    }
    const base = business.status === 'active' && business.subscription_ends && new Date(business.subscription_ends) > new Date() ? new Date(business.subscription_ends) : new Date();
    if (days[plan] > 0) base.setDate(base.getDate() + days[plan]);
    await sql`UPDATE businesses SET status='active',plan=${plan},subscription_ends=${days[plan] > 0 ? base.toISOString() : null},pending_plan=null,pending_amount=0,last_payment_id=${String(payment.txnId || orderId)},updated_at=now() WHERE id=${business.id}`;
    const updated = await sql`SELECT id,business,owner,mobile,email,category,gst,address,status,plan,subscription_ends,pending_plan,pending_amount,last_payment_id FROM businesses WHERE id=${business.id}`;
    return send(res, 200, { verified: true, user: updated.rows[0] });
  } catch (error) {
    console.error('Paytm verify-payment failed:', error?.message || error);
    return send(res, 500, { error: 'Unable to verify Paytm payment safely. Membership was not activated.' });
  }
}
