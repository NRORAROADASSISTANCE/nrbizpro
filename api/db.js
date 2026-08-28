import { createClient } from '@vercel/postgres';
import crypto from 'node:crypto';

// Prefer the direct Postgres URL when Vercel has not exposed
// POSTGRES_URL_NON_POOLING. This fixes production auth when the
// project already has a direct POSTGRES_URL configured.
function getConnectionString(){
  return process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
}

export async function sql(strings,...values){
  const connectionString=getConnectionString();
  if(!connectionString) throw new Error('Database connection is not configured. Add POSTGRES_URL_NON_POOLING or POSTGRES_URL in Vercel.');
  const client=createClient({connectionString});
  await client.connect();
  try{return await client.sql(strings,...values)}
  finally{await client.end()}
}

let ready;
export async function initDb(){
  if(ready) return ready;
  ready=(async()=>{
    await sql`CREATE TABLE IF NOT EXISTS businesses (id text PRIMARY KEY,business text NOT NULL,owner text NOT NULL,mobile text NOT NULL,email text NOT NULL UNIQUE,category text NOT NULL,gst text,password_hash text NOT NULL,status text NOT NULL DEFAULT 'pending',plan text,subscription_ends timestamptz,pending_plan text,pending_amount numeric DEFAULT 0,last_payment_id text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false`;
    await sql`CREATE TABLE IF NOT EXISTS business_data (business_id text PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,items jsonb NOT NULL DEFAULT '[]',bills jsonb NOT NULL DEFAULT '[]',settings jsonb NOT NULL DEFAULT '{}'::jsonb,updated_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS sessions (token text PRIMARY KEY,business_id text REFERENCES businesses(id) ON DELETE CASCADE,admin boolean NOT NULL DEFAULT false,expires_at timestamptz NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS admins (email text PRIMARY KEY,password_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS otp_challenges (business_id text PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,phone_req_id text,email_hash text,phone_sent_at timestamptz,email_sent_at timestamptz,phone_attempts integer NOT NULL DEFAULT 0,email_attempts integer NOT NULL DEFAULT 0,updated_at timestamptz NOT NULL DEFAULT now())`;
  })();
  return ready;
}
export function hashPassword(password){return new Promise((resolve,reject)=>crypto.scrypt(password,'NRBizPro-v1',64,(e,k)=>e?reject(e):resolve(k.toString('hex'))));}
export function verifyPassword(password,hash){return hashPassword(password).then(h=>crypto.timingSafeEqual(Buffer.from(h,'hex'),Buffer.from(hash,'hex'))).catch(()=>false)}
export function hashOtp(otp){return crypto.createHash('sha256').update(`NRBizPro-OTP-v1:${otp}`).digest('hex')}
export function makeOtp(){return String(crypto.randomInt(100000,1000000))}
export function token(){return crypto.randomBytes(32).toString('hex')}
export function cookie(res,name,value,maxAge=60*60*24*30){res.setHeader('Set-Cookie',`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`)}
export function clearCookie(res,name){res.setHeader('Set-Cookie',`${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`)}
export function getCookie(req,name){const raw=req.headers.cookie||'';return raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||null}
export async function sessionBusiness(req){await initDb();const t=getCookie(req,'nr_session');if(!t)return null;const r=await sql`SELECT b.* FROM sessions s JOIN businesses b ON b.id=s.business_id WHERE s.token=${t} AND s.admin=false AND s.expires_at>now()`;return r.rows[0]||null}
export async function sessionAdmin(req){await initDb();const t=getCookie(req,'nr_admin');if(!t)return false;const r=await sql`SELECT 1 FROM sessions WHERE token=${t} AND admin=true AND expires_at>now()`;return !!r.rowCount}
export async function ensureAdmin(){await initDb();const email=process.env.ADMIN_EMAIL||'admin@nrbizpro.in';const pass=process.env.ADMIN_PASSWORD||'NRBizPro@2026';const h=await hashPassword(pass);await sql`INSERT INTO admins(email,password_hash) VALUES(${email},${h}) ON CONFLICT(email) DO NOTHING`;return {email,defaulted:!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD}}
