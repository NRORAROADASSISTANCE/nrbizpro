import { initDb, sql, sessionBusiness } from './db.js';

function send(res, code, body) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(code).json(body);
}

async function ensureDataSchema() {
  if (globalThis.__NRBIZPRO_DATA_SCHEMA_READY) return globalThis.__NRBIZPRO_DATA_SCHEMA_READY;
  globalThis.__NRBIZPRO_DATA_SCHEMA_READY = sql`ALTER TABLE business_data ADD COLUMN IF NOT EXISTS customers jsonb NOT NULL DEFAULT '[]'`;
  try { await globalThis.__NRBIZPRO_DATA_SCHEMA_READY; }
  catch (e) { globalThis.__NRBIZPRO_DATA_SCHEMA_READY = null; throw e; }
}

export default async function handler(req, res) {
  try {
    await initDb();
    await ensureDataSchema();
    const b = await sessionBusiness(req);
    if (!b) return send(res, 401, { error: 'Please log in to continue.' });

    if (req.method === 'GET') {
      const r = await sql`SELECT items,bills,customers,settings,updated_at FROM business_data WHERE business_id=${b.id} LIMIT 1`;
      if (!r.rowCount) return send(res, 200, { ok: true, exists: false, items: [], bills: [], customers: [], settings: {}, updatedAt: null });
      const x = r.rows[0];
      return send(res, 200, {
        ok: true,
        exists: true,
        items: Array.isArray(x.items) ? x.items : [],
        bills: Array.isArray(x.bills) ? x.bills : [],
        customers: Array.isArray(x.customers) ? x.customers : [],
        settings: x.settings && typeof x.settings === 'object' ? x.settings : {},
        updatedAt: x.updated_at
      });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = req.body || {};
      const items = Array.isArray(body.items) ? body.items : [];
      const bills = Array.isArray(body.bills) ? body.bills : [];
      const customers = Array.isArray(body.customers) ? body.customers : [];
      const settings = body.settings && typeof body.settings === 'object' && !Array.isArray(body.settings) ? body.settings : {};
      await sql`INSERT INTO business_data(business_id,items,bills,customers,settings,updated_at)
        VALUES(${b.id},${JSON.stringify(items)}::jsonb,${JSON.stringify(bills)}::jsonb,${JSON.stringify(customers)}::jsonb,${JSON.stringify(settings)}::jsonb,now())
        ON CONFLICT(business_id) DO UPDATE SET items=EXCLUDED.items,bills=EXCLUDED.bills,customers=EXCLUDED.customers,settings=EXCLUDED.settings,updated_at=now()`;
      return send(res, 200, { ok: true, items: items.length, bills: bills.length, customers: customers.length });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: 'Business data server error' });
  }
}
