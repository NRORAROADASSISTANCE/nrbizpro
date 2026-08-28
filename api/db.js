import pg from 'pg';
import crypto from 'node:crypto';

const { Pool } = pg;

// Prisma Postgres is standard PostgreSQL. Use the pooled DATABASE_URL for
// application traffic instead of @vercel/postgres' Prisma/HTTP adapter.
function getConnectionString(){
  return process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.POSTGRES_URL_NON_POOLING
    || process.env.DIRECT_URL;
}

function dbPool(){
  const connectionString=getConnectionString();
  if(!connectionString) throw new Error('Database connection is not configured.');

  if(!globalThis.__NRBIZPRO_POOL){
    const needsSsl=/sslmode=require/i.test(connectionString) || /\.db\.prisma\.io/i.test(connectionString);
    globalThis.__NRBIZPRO_POOL=new Pool({
      connectionString,
      max:5,
      idleTimeoutMillis:10000,
      connectionTimeoutMillis:10000,
      ...(needsSsl ? {ssl:{rejectUnauthorized:false}} : {})
    });
  }
  return globalThis.__NRBIZPRO_POOL;
}

// Small tagged-template wrapper compatible with the existing API code.
// Example: sql`SELECT * FROM users WHERE id=${id}`
export async function sql(strings,...values){
  const text=strings.reduce((out,s,i)=>out+s+(i<values.length?`$${i+1}`:''),'');
  return dbPool().query(text,values);
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

    // Keep a non-OTP demo account available for testing the billing UI.
    const demoHash=await hashPassword('Demo@12345');
    const demoId='demo-nrbizpro';
    await sql`INSERT INTO businesses(id,business,owner,mobile,email,category,gst,password_hash,status,plan,subscription_ends,phone_verified,email_verified)
      VALUES(${demoId},'NR BizPro Demo','Demo Owner','9000000000','demo@nrbizpro.in','SERVICE','',${demoHash},'active','demo',now()+interval '365 days',true,true)
      ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,status='active',plan='demo',subscription_ends=EXCLUDED.subscription_ends,phone_verified=true,email_verified=true,updated_at=now()`;
    await sql`INSERT INTO business_data(business_id,settings) VALUES(${demoId},${JSON.stringify({name:'NR BizPro Demo',category:'SERVICE',mobile:'9000000000',gst:'',address:''})}::jsonb)
      ON CONFLICT(business_id) DO NOTHING`;
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
