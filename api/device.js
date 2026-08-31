import crypto from 'node:crypto';
import { sql, initDb, sessionBusiness, hashPassword } from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.status(c).json(b)}
function getDevice(req){const h=req.headers['x-nrbizpro-device'];return String(h||'').trim()}
export default async function handler(req,res){await initDb();try{
 await sql`CREATE TABLE IF NOT EXISTS business_devices (id text PRIMARY KEY,business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,device_key text NOT NULL,device_name text NOT NULL DEFAULT 'Unknown device',device_type text NOT NULL DEFAULT 'web',created_at timestamptz NOT NULL DEFAULT now(),last_seen_at timestamptz NOT NULL DEFAULT now(),active boolean NOT NULL DEFAULT true,UNIQUE(business_id,device_key))`;
 const b=await sessionBusiness(req);if(!b)return send(res,401,{error:'Login required.'});
 const action=req.body?.action||req.query?.action;
 if(action==='list'){const r=await sql`SELECT id,device_name,device_type,created_at,last_seen_at,active FROM business_devices WHERE business_id=${b.id} ORDER BY last_seen_at DESC`;return send(res,200,{devices:r.rows,limit:3})}
 if(action==='remove'){const id=req.body?.deviceId;await sql`UPDATE business_devices SET active=false WHERE id=${id} AND business_id=${b.id}`;return send(res,200,{ok:true})}
 if(action==='register'){const key=getDevice(req);if(!key)return send(res,400,{error:'Device identifier is required.'});const existing=await sql`SELECT * FROM business_devices WHERE business_id=${b.id} AND device_key=${key}`;if(existing.rowCount){await sql`UPDATE business_devices SET active=true,last_seen_at=now(),device_name=${req.body?.deviceName||existing.rows[0].device_name},device_type=${req.body?.deviceType||existing.rows[0].device_type} WHERE id=${existing.rows[0].id}`;return send(res,200,{ok:true,registered:true,deviceId:existing.rows[0].id})}
 const active=await sql`SELECT count(*)::int AS n FROM business_devices WHERE business_id=${b.id} AND active=true`;if(active.rows[0].n>=3)return send(res,403,{error:'This business already has 3 authorized devices. Remove an existing device before using a new device.',deviceLimit:true});const id=crypto.randomUUID();await sql`INSERT INTO business_devices(id,business_id,device_key,device_name,device_type) VALUES(${id},${b.id},${key},${req.body?.deviceName||'New device'},${req.body?.deviceType||'web'})`;return send(res,200,{ok:true,registered:true,deviceId:id})}
 return send(res,404,{error:'Unknown device action'});
}catch(e){console.error(e);return send(res,500,{error:'Device service error.'})}}
