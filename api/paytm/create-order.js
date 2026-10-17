import crypto from 'node:crypto';
import PaytmChecksum from 'paytmchecksum';
import { initDb, sessionBusiness } from '../../lib/db.js';

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
  const websiteName = process.env.PAYTM_WEBSITE_NAME || (environment === 'production' ? 'DEFAULT' : 'WEBSTAGING');
  if (!mid || !key) return send(res, 503, { error: 'Paytm is not configured for this Preview deployment. Add PAYTM_MID and PAYTM_MERCHANT_KEY as Preview-only environment variables.' });
  if (!['staging', 'production'].includes(environment)) return send(res, 500, { error: 'PAYTM_ENVIRONMENT must be staging or production.' });
  if (environment === 'production' && process.env.VERCEL_ENV !== 'production') return send(res, 403, { error: 'Production Paytm credentials are blocked outside the Production deployment.' });
  try {
    await initDb();
    const business = await sessionBusiness(req);
    if (!business) return send(res, 401, { error: 'Please login again before paying.' });
    const plan = String(business.pending_plan || '');
    const planFees = { monthly12: 5988, monthly24: 11976, year3: 6000, year6: 8500, lifetime: 18500 };
    if (!planFees[plan] || Number(business.pending_amount) !== planFees[plan]) return send(res, 400, { error: 'No valid pending membership payment was found. Please select your plan again.' });
    const orderId = ('NRBP' + Date.now().toString() + crypto.randomBytes(4).toString('hex')).slice(0, 45);
    const amount = Number(business.pending_amount).toFixed(2);
    const callbackUrl = process.env.PAYTM_CALLBACK_URL || 'https://www.nrbizpro.in/paytm-callback.html';
    const body = {
      requestType: 'Payment',
      mid,
      websiteName,
      orderId,
      callbackUrl,
      txnAmount: { value: amount, currency: 'INR' },
      userInfo: { custId: String(business.id).slice(0, 50), mobile: String(business.mobile || '').slice(0, 10), email: String(business.email || '').slice(0, 80) }
    };
    const signature = await PaytmChecksum.generateSignature(JSON.stringify(body), key);
    const host = environment === 'production' ? 'https://secure.paytmpayments.com' : 'https://securestage.paytmpayments.com';
    const response = await fetch(host + '/theia/api/v1/initiateTransaction?mid=' + encodeURIComponent(mid) + '&orderId=' + encodeURIComponent(orderId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, head: { signature } })
    });
    const result = await response.json();
    if (!response.ok || result?.body?.resultInfo?.resultStatus !== 'S' || !result?.body?.txnToken) {
      console.error('Paytm initiate transaction failed:', result?.body?.resultInfo?.resultMsg || response.status);
      return send(res, 502, { error: result?.body?.resultInfo?.resultMsg || 'Paytm could not start the test transaction. Check MID, merchant key and staging setup.' });
    }
    return send(res, 200, { orderId, txnToken: result.body.txnToken, amount, mid, environment, host });
  } catch (error) {
    console.error('Paytm create-order failed:', error?.message || error);
    return send(res, 500, { error: 'Unable to start Paytm payment. Please retry.' });
  }
}
