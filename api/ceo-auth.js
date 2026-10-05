export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const project = String(body.project || '').trim().replace(/\/$/, '');
    const anonKey = String(body.anonKey || '').trim();
    const email = String(body.email || '').trim();
    const password = String(body.password || '');

    if (!/^https:\/\/[-a-z0-9]+\.supabase\.co$/i.test(project)) {
      return res.status(400).json({ error: 'Invalid Supabase project URL.' });
    }
    if (!anonKey || !email || !password) {
      return res.status(400).json({ error: 'Supabase key, email and password are required.' });
    }

    const upstream = await fetch(project + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey
      },
      body: JSON.stringify({ email, password })
    });

    const text = await upstream.text();
    let data = {};
    try { data = JSON.parse(text || '{}'); } catch { data = { error_description: text }; }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data.error_description || data.msg || data.message || data.error || 'Supabase login failed.'
      });
    }

    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: data.expires_at,
      token_type: data.token_type,
      user: data.user
    });
  } catch (e) {
    console.error('CEO auth proxy error:', e);
    return res.status(502).json({ error: 'Unable to reach Supabase from the server. Please try again.' });
  }
}
