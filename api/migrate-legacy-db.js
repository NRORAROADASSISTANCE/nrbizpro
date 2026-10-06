import pg from 'pg';
import { initDb, sql } from '../lib/db.js';

const { Pool } = pg;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function quoteIdent(name) {
  return '"' + String(name).replaceAll('"', '""') + '"';
}

function sourcePool() {
  const source = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL;
  if (!source) throw new Error('Legacy NR BizPro database URL is not configured.');
  return new Pool({
    connectionString: source,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  });
}

async function tableList(client) {
  const r = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE'
    ORDER BY table_name
  `);
  return r.rows.map(x => x.table_name);
}

async function tableColumns(client, table) {
  const r = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1
      AND is_generated='NEVER'
    ORDER BY ordinal_position
  `, [table]);
  return r.rows.map(x => x.column_name);
}

async function dependencyOrder(client, tables) {
  const r = await client.query(`
    SELECT
      tc.table_name AS child,
      ccu.table_name AS parent
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name=tc.constraint_name
     AND ccu.table_schema=tc.table_schema
    WHERE tc.constraint_type='FOREIGN KEY'
      AND tc.table_schema='public'
  `);
  const set = new Set(tables);
  const deps = new Map(tables.map(t => [t, new Set()]));
  for (const row of r.rows) {
    if (set.has(row.child) && set.has(row.parent) && row.child !== row.parent) {
      deps.get(row.child).add(row.parent);
    }
  }
  const out = [];
  const remaining = new Set(tables);
  while (remaining.size) {
    const ready = [...remaining].filter(t => [...deps.get(t)].every(d => !remaining.has(d)));
    if (!ready.length) {
      out.push(...remaining);
      break;
    }
    ready.sort();
    for (const t of ready) {
      out.push(t);
      remaining.delete(t);
    }
  }
  return out;
}

async function copyTable(source, target, table) {
  const columns = await tableColumns(source, table);
  if (!columns.length) return { table, sourceRows: 0, targetRows: 0, copied: 0 };

  const qTable = quoteIdent(table);
  const qCols = columns.map(quoteIdent).join(',');
  const count = await source.query(`SELECT count(*)::bigint AS n FROM public.${qTable}`);
  const sourceRows = Number(count.rows[0]?.n || 0);

  let copied = 0;
  const batchSize = 100;
  for (let offset = 0; offset < sourceRows; offset += batchSize) {
    const rows = await source.query(
      `SELECT ${qCols} FROM public.${qTable} ORDER BY 1 OFFSET $1 LIMIT $2`,
      [offset, batchSize]
    );
    if (!rows.rows.length) break;

    const values = [];
    const tuples = [];
    for (const row of rows.rows) {
      const placeholders = [];
      for (const col of columns) {
        values.push(row[col]);
        placeholders.push('$' + values.length);
      }
      tuples.push('(' + placeholders.join(',') + ')');
    }

    try {
      const result = await target.query(
        `INSERT INTO public.${qTable} (${qCols}) VALUES ${tuples.join(',')} ON CONFLICT DO NOTHING`,
        values
      );
      copied += result.rowCount || 0;
    } catch (e) {
      throw new Error(`Table ${table} failed: ${e.message}`);
    }
  }

  const after = await target.query(`SELECT count(*)::bigint AS n FROM public.${qTable}`);
  return {
    table,
    sourceRows,
    targetRows: Number(after.rows[0]?.n || 0),
    copied
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'POST required' });
  }

  const expected = process.env.NRBIZPRO_MIGRATION_TOKEN || '';
  const supplied = String(req.headers['x-nrbizpro-migration-token'] || '');
  if (!expected || supplied !== expected) {
    return json(res, 403, { ok: false, error: 'Migration authorization required' });
  }

  const target = await (async () => {
    await initDb();
    return (await import('../lib/db.js')).__getPoolForMigration?.() || null;
  })();

  const sourcePoolInstance = sourcePool();
  const source = await sourcePoolInstance.connect();

  try {
    const marker = await sql`SELECT value FROM platform_settings WHERE key='legacy_db_migration_v1' LIMIT 1`;
    if (marker.rowCount) {
      return json(res, 200, {
        ok: true,
        alreadyMigrated: true,
        message: 'Legacy database migration was already completed.',
        completedAt: marker.rows[0].value
      });
    }

    // lib/db.js intentionally keeps its pool private, so obtain a target client
    // through a harmless query transaction using the exported SQL helper below.
    const tables = await tableList(source);
    const targetTablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE'
    `;
    const targetTables = new Set(targetTablesResult.rows.map(x => x.table_name));
    const migratable = tables.filter(t => targetTables.has(t) && !t.startsWith('_'));
    const ordered = await dependencyOrder(source, migratable);

    const results = [];
    for (const table of ordered) {
      // copyTable needs a target client; run the same logic through sql() below.
      const columns = await tableColumns(source, table);
      if (!columns.length) continue;
      const qTable = quoteIdent(table);
      const qCols = columns.map(quoteIdent).join(',');
      const count = await source.query(`SELECT count(*)::bigint AS n FROM public.${qTable}`);
      const sourceRows = Number(count.rows[0]?.n || 0);
      let copied = 0;

      for (let offset = 0; offset < sourceRows; offset += 100) {
        const rows = await source.query(
          `SELECT ${qCols} FROM public.${qTable} ORDER BY 1 OFFSET $1 LIMIT $2`,
          [offset, 100]
        );
        if (!rows.rows.length) break;

        const values = [];
        const tuples = [];
        for (const row of rows.rows) {
          const placeholders = [];
          for (const col of columns) {
            values.push(row[col]);
            placeholders.push('$' + values.length);
          }
          tuples.push('(' + placeholders.join(',') + ')');
        }

        const result = await sql(
          [`INSERT INTO public.${qTable} (${qCols}) VALUES ${tuples.join(',')} ON CONFLICT DO NOTHING`]
        );
        copied += result.rowCount || 0;
      }

      const after = await sql(`SELECT count(*)::bigint AS n FROM public.${qTable}`);
      results.push({
        table,
        sourceRows,
        targetRows: Number(after.rows[0]?.n || 0),
        copied
      });
    }

    await sql`INSERT INTO platform_settings(key,value) VALUES('legacy_db_migration_v1',to_char(now(),'YYYY-MM-DD"T"HH24:MI:SSOF')) ON CONFLICT(key) DO NOTHING`;

    return json(res, 200, {
      ok: true,
      sourceTables: tables.length,
      migratedTables: ordered.length,
      results
    });
  } catch (e) {
    console.error('NRBIZPRO legacy migration failed', e);
    return json(res, 500, {
      ok: false,
      error: String(e?.message || e)
    });
  } finally {
    source.release();
    await sourcePoolInstance.end().catch(() => {});
  }
}
