export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ keyId: process.env.RAZORPAY_KEY_ID || null });
}
