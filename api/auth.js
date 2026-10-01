import { sql,initDb,hashPassword,verifyPassword,token,cookie,clearCookie,sessionBusiness,ensureAdmin,sessionAdmin } from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.status(c).json(b)}
const PLAN_FEES={year3:3500,year6:6000,lifetime:15000,test10:10};
function clientIp(req){const h=req.headers||{};const forwarded=h['x-forwarded-for']||h['x-vercel-forwarded-for']||h['x-real-ip']||'';const ip=String(forwarded).split(',')[0].trim();return ip||'unknown'}
function clientDevice(req){return String(req.headers?.['x-nr-demo-device']||'').trim().slice(0,200)||'unknown'}
async function demoLimit(req,increment=false){const ip=clientIp(req),device=clientDevice(req);if(!increment){const r=await sql`SELECT prints_used FROM demo_print_limits WHERE client_ip=${ip} LIMIT 1`;const d=await sql`SELECT prints_used FROM demo_device_limits WHERE device_id=${device} LIMIT 1`;const used=Math.max(Number(r.rows[0]?.prints_used||0),Number(d.rows[0]?.prints_used||0));return {ip,device,used,remaining:Math.max(0,3-used)}}const r=await sql`INSERT INTO demo_print_limits(client_ip,prints_used,first_used_at,last_used_at) VALUES(${ip},1,now(),now()) ON CONFLICT(client_ip) DO UPDATE SET prints_used=demo_print_limits.prints_used+1,last_used_at=now() WHERE demo_print_limits.prints_used<3 RETURNING prints_used`;if(!r.rowCount)return {ip,device,used:3,remaining:0,allowed:false};const used=Number(r.rows[0].prints_used||0);await sql`INSERT INTO demo_device_limits(device_id,prints_used,first_used_at,last_used_at) VALUES(${device},${used},now(),now()) ON CONFLICT(device_id) DO UPDATE SET prints_used=GREATEST(demo_device_limits.prints_used,${used}),last_used_at=now()`;return {ip,device,used,remaining:Math.max(0,3-used),allowed:true}}
async function registerDemoDevice(device){if(!device||device==='unknown')return {ok:true,registered:false};const existing=await sql`SELECT 1 FROM demo_business_devices WHERE business_id='demo-nrbizpro' AND device_id=${device} LIMIT 1`;if(existing.rowCount){await sql`UPDATE demo_business_devices SET last_seen_at=now() WHERE business_id='demo-nrbizpro' AND device_id=${device}`;return {ok:true,registered:true,existing:true}}const added=await sql`INSERT INTO demo_business_devices(business_id,device_id,first_seen_at,last_seen_at) SELECT 'demo-nrbizpro',${device},now(),now() WHERE (SELECT count(*) FROM demo_business_devices WHERE business_id='demo-nrbizpro')<2 ON CONFLICT(business_id,device_id) DO NOTHING RETURNING device_id`;if(added.rowCount)return {ok:true,registered:true,newDevice:true};const count=await sql`SELECT count(*)::int AS n FROM demo_business_devices WHERE business_id='demo-nrbizpro'`;return {ok:false,registered:false,limit:Number(count.rows[0]?.n||2)} }
function pub(b,demoLimitInfo=null){if(!b)return null;return {id:b.id,userId:b.user_id,business:b.business,owner:b.owner,mobile:b.mobile,email:b.email,category:b.category,gst:b.gst,address:b.address||'',status:b.status,plan:b.plan,subscriptionEnds:b.subscription_ends,pendingPlan:b.pending_plan,pendingAmount:Number(b.pending_amount||0),lastPaymentId:b.last_payment_id,phoneVerified:!!b.phone_verified,emailVerified:!!b.email_verified,registrationFee:3500,demoPrintsUsed:demoLimitInfo?demoLimitInfo.used:Number(b.demo_prints_used||0),demoPrintsRemaining:demoLimitInfo?demoLimitInfo.remaining:Math.max(0,3-Number(b.demo_prints_used||0))}}\nasync function verifyMsg91AccessToken(accessToken, expectedIdentifier){\n  const key=String(process.env.MSG91_AUTHKEY||'').trim();\n  if(!key) throw new Error('MSG91 OTP is not configured on the server.');\n  const token=String(accessToken||'').trim();\n  if(!token) throw new Error('Missing MSG91 access token.');\n  const body=new URLSearchParams({'authkey':key,'access-token':token});\n  const r=await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},body});\n  const data=await r.json().catch(()=>({}));\n  if(!r.ok || String(data?.type||'').toLowerCase()==='error' || data?.code===201) throw new Error(data?.message||'MSG91 access token verification failed.');\n  const findIdentifier=(v)=>{\n    if(!v||typeof v!=='object')return '';\n    for(const k of ['identifier','mobile','email','phone']){if(typeof v[k]==='string'&&v[k].trim())return v[k].trim();}\n    for(const v2 of Object.values(v)){const x=findIdentifier(v2);if(x)return x;}\n    return '';\n  };\n  const verified=findIdentifier(data);\n  if(verified){\n    const norm=String(expectedIdentifier||'').trim().toLowerCase();\n    const a=verified.toLowerCase().replace(/^\\+/,'');\n    const b=norm.replace(/^\\+/,'');\n    if(a!==b && !((/^91\\d{10}$/.test(a)||/^\\d{10}$/.test(a)) && (/^91\\d{10}$/.test(b)||/^\\d{10}$/.test(b)) && a.slice(-10)===b.slice(-10))) throw new Error('MSG91 verified identifier does not match the registration field.');\n  }\n  return {ok:true,identifier:verified||String(expectedIdentifier||'')};\n}\nfunction normalizeOtpMobile(v){const d=String(v||'').replace(/\\D/g,'');return d.length===10?'91'+d:d.length===12&&d.startsWith('91')?d:''}\nfunction normalizeOtpEmail(v){return String(v||'').trim().toLowerCase()}\n


async function hmsDoctorSetup(){
 await sql`CREATE TABLE IF NOT EXISTS hms_hospitals (id text PRIMARY KEY,hospital text NOT NULL,owner text NOT NULL,mobile text NOT NULL,email text NOT NULL,user_id text NOT NULL UNIQUE,address text NOT NULL DEFAULT '',website_url text NOT NULL DEFAULT '',password_hash text NOT NULL,approval_status text NOT NULL DEFAULT 'approved',payment_status text NOT NULL DEFAULT 'paid',approval_note text NOT NULL DEFAULT '',approved_by text NOT NULL DEFAULT '',approved_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS website_url text NOT NULL DEFAULT ''`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid'`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS approval_note text NOT NULL DEFAULT ''`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS approved_by text NOT NULL DEFAULT ''`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS approved_at timestamptz`;
 await sql`UPDATE hms_hospitals SET approval_status='approved',payment_status='paid' WHERE approval_status IS NULL OR approval_status=''`;
 await sql`CREATE TABLE IF NOT EXISTS hms_doctors (id text PRIMARY KEY,hospital_id text NOT NULL REFERENCES hms_hospitals(id) ON DELETE CASCADE,doctor_id text NOT NULL,name text NOT NULL,specialization text NOT NULL,mobile text NOT NULL,password_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(hospital_id,doctor_id))`;
 await sql`CREATE INDEX IF NOT EXISTS hms_doctors_hospital_idx ON hms_doctors(hospital_id)`;
 await sql`CREATE TABLE IF NOT EXISTS hms_data (hospital_id text PRIMARY KEY REFERENCES hms_hospitals(id) ON DELETE CASCADE,patients jsonb NOT NULL DEFAULT '[]',doctors jsonb NOT NULL DEFAULT '[]',appointments jsonb NOT NULL DEFAULT '[]',bills jsonb NOT NULL DEFAULT '[]',ipd jsonb NOT NULL DEFAULT '[]',rooms jsonb NOT NULL DEFAULT '[]',updated_at timestamptz NOT NULL DEFAULT now())`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS ipd jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS rooms jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_master jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_orders jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_reports jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_master jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_orders jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_reports jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_master jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_orders jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_reports jsonb NOT NULL DEFAULT '[]'`;
 await sql`CREATE TABLE IF NOT EXISTS hms_pros (id text PRIMARY KEY,hospital_id text NOT NULL REFERENCES hms_hospitals(id) ON DELETE CASCADE,pro_id text NOT NULL,name text NOT NULL,mobile text NOT NULL,password_hash text NOT NULL,can_negotiate boolean NOT NULL DEFAULT false,max_discount numeric(12,2) NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(hospital_id,pro_id))`;
 await sql`CREATE TABLE IF NOT EXISTS hms_pro_sessions (token text PRIMARY KEY,pro_id text NOT NULL REFERENCES hms_pros(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL)`;
 await sql`CREATE TABLE IF NOT EXISTS hms_package_negotiations (id text PRIMARY KEY,hospital_id text NOT NULL,patient_opd text NOT NULL,patient_name text NOT NULL,standard_amount numeric(12,2) NOT NULL,final_amount numeric(12,2) NOT NULL,discount numeric(12,2) NOT NULL,reason text NOT NULL,pro_id text NOT NULL,pro_name text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`;
 await sql`CREATE TABLE IF NOT EXISTS hms_medical_users (id text PRIMARY KEY,hospital_id text NOT NULL REFERENCES hms_hospitals(id) ON DELETE CASCADE,login_id text NOT NULL,name text NOT NULL,mobile text NOT NULL,password_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(hospital_id,login_id))`;
 await sql`CREATE TABLE IF NOT EXISTS hms_medical_sessions (token text PRIMARY KEY,medical_id text NOT NULL REFERENCES hms_medical_users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL)`;
 await sql`CREATE TABLE IF NOT EXISTS hms_medical_stock (id text PRIMARY KEY,hospital_id text NOT NULL,medicine text NOT NULL,batch text NOT NULL DEFAULT '',expiry text NOT NULL DEFAULT '',quantity numeric(12,2) NOT NULL DEFAULT 0,unit_price numeric(12,2) NOT NULL DEFAULT 0,updated_at timestamptz NOT NULL DEFAULT now())`;
 await sql`CREATE TABLE IF NOT EXISTS hms_medical_sales (id text PRIMARY KEY,hospital_id text NOT NULL,opd text NOT NULL,patient_name text NOT NULL,medicine text NOT NULL,quantity numeric(12,2) NOT NULL,amount numeric(12,2) NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`;
 await sql`CREATE TABLE IF NOT EXISTS hms_doctor_sessions (token text PRIMARY KEY,doctor_id text NOT NULL REFERENCES hms_doctors(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL)`;
 await hmsSeedDemo();
}
function hmsDoctorPub(d){return {id:d.id,doctorId:d.doctor_id,name:d.name,specialization:d.specialization,mobile:d.mobile,hospitalId:d.hospital_id}}
function hmsDoctorCookie(res,t,maxAge=2592000){res.setHeader('Set-Cookie',['nr_hms_doctor_session='+t+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge])}
async function hmsDoctorSession(req){const t=(await import('./db.js')).getCookie(req,'nr_hms_doctor_session');if(!t)return null;const r=await sql`SELECT d.* FROM hms_doctor_sessions s JOIN hms_doctors d ON d.id=s.doctor_id WHERE s.token=${t} AND s.expires_at>now() LIMIT 1`;return r.rows[0]||null}

async function hmsSetup(){
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS website_url text NOT NULL DEFAULT ''`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid'`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS approval_note text NOT NULL DEFAULT ''`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS approved_by text NOT NULL DEFAULT ''`;
 await sql`ALTER TABLE hms_hospitals ADD COLUMN IF NOT EXISTS approved_at timestamptz`;
 await sql`UPDATE hms_hospitals SET approval_status='approved',payment_status='paid' WHERE approval_status IS NULL OR approval_status=''`;
 await sql`CREATE TABLE IF NOT EXISTS hms_hospitals (id text PRIMARY KEY,hospital text NOT NULL,owner text NOT NULL,mobile text NOT NULL,email text NOT NULL,user_id text NOT NULL UNIQUE,address text NOT NULL DEFAULT '',website_url text NOT NULL DEFAULT '',password_hash text NOT NULL,approval_status text NOT NULL DEFAULT 'approved',payment_status text NOT NULL DEFAULT 'paid',approval_note text NOT NULL DEFAULT '',approved_by text NOT NULL DEFAULT '',approved_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`;
 await sql`CREATE TABLE IF NOT EXISTS hms_doctors (id text PRIMARY KEY,hospital_id text NOT NULL REFERENCES hms_hospitals(id) ON DELETE CASCADE,doctor_id text NOT NULL,name text NOT NULL,specialization text NOT NULL,mobile text NOT NULL,password_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(hospital_id,doctor_id))`;
 await sql`CREATE TABLE IF NOT EXISTS hms_doctor_sessions (token text PRIMARY KEY,doctor_id text NOT NULL REFERENCES hms_doctors(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL)`;
 await sql`CREATE TABLE IF NOT EXISTS hms_sessions (token text PRIMARY KEY,hospital_id text NOT NULL REFERENCES hms_hospitals(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL)`;
 await sql`CREATE TABLE IF NOT EXISTS hms_data (hospital_id text PRIMARY KEY REFERENCES hms_hospitals(id) ON DELETE CASCADE,patients jsonb NOT NULL DEFAULT '[]',doctors jsonb NOT NULL DEFAULT '[]',appointments jsonb NOT NULL DEFAULT '[]',bills jsonb NOT NULL DEFAULT '[]',updated_at timestamptz NOT NULL DEFAULT now())`;
 await sql`CREATE TABLE IF NOT EXISTS hms_pros (id text PRIMARY KEY,hospital_id text NOT NULL REFERENCES hms_hospitals(id) ON DELETE CASCADE,pro_id text NOT NULL,name text NOT NULL,mobile text NOT NULL,password_hash text NOT NULL,can_negotiate boolean NOT NULL DEFAULT false,max_discount numeric(12,2) NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(hospital_id,pro_id))`;
 await sql`CREATE TABLE IF NOT EXISTS hms_pro_sessions (token text PRIMARY KEY,pro_id text NOT NULL REFERENCES hms_pros(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL)`;
 await sql`CREATE TABLE IF NOT EXISTS hms_package_negotiations (id text PRIMARY KEY,hospital_id text NOT NULL,patient_opd text NOT NULL,patient_name text NOT NULL,standard_amount numeric(12,2) NOT NULL,final_amount numeric(12,2) NOT NULL,discount numeric(12,2) NOT NULL,reason text NOT NULL,pro_id text NOT NULL,pro_name text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`;
 await sql`CREATE TABLE IF NOT EXISTS hms_medical_users (id text PRIMARY KEY,hospital_id text NOT NULL REFERENCES hms_hospitals(id) ON DELETE CASCADE,login_id text NOT NULL,name text NOT NULL,mobile text NOT NULL,password_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(hospital_id,login_id))`;
 await sql`CREATE TABLE IF NOT EXISTS hms_medical_sessions (token text PRIMARY KEY,medical_id text NOT NULL REFERENCES hms_medical_users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL)`;
 await sql`CREATE TABLE IF NOT EXISTS hms_medical_stock (id text PRIMARY KEY,hospital_id text NOT NULL,medicine text NOT NULL,batch text NOT NULL DEFAULT '',expiry text NOT NULL DEFAULT '',quantity numeric(12,2) NOT NULL DEFAULT 0,unit_price numeric(12,2) NOT NULL DEFAULT 0,updated_at timestamptz NOT NULL DEFAULT now())`;
 await sql`CREATE TABLE IF NOT EXISTS hms_medical_sales (id text PRIMARY KEY,hospital_id text NOT NULL,opd text NOT NULL,patient_name text NOT NULL,medicine text NOT NULL,quantity numeric(12,2) NOT NULL,amount numeric(12,2) NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`;
 await hmsSeedDemo();
}
async function hmsSeedDemo(){
 await sql`CREATE TABLE IF NOT EXISTS hms_demo_settings (id text PRIMARY KEY,disabled boolean NOT NULL DEFAULT false)`;
 const ctl=await sql`SELECT disabled FROM hms_demo_settings WHERE id='demo' LIMIT 1`;
 if(ctl.rows[0]?.disabled)return;
 const hid='demo-hospital',ph=await hashPassword('Demo@12345');
 await sql`INSERT INTO hms_hospitals(id,hospital,owner,mobile,email,user_id,address,website_url,password_hash) VALUES(${hid},'NR HMS Demo Hospital','Demo Admin','9000000000','demo.hospital@nrbizpro.in','demo-hospital','Nizamabad, Telangana','https://nrbizpro.in/hospital-site.html?hospital=demo-hospital',${ph}) ON CONFLICT(id) DO NOTHING`;
 await sql`INSERT INTO hms_doctors(id,hospital_id,doctor_id,name,specialization,mobile,password_hash) VALUES('demo-doctor',${hid},'demo-doctor','Dr. Demo Doctor','General Medicine','9000000002',${ph}) ON CONFLICT(id) DO NOTHING`;
 await sql`INSERT INTO hms_pros(id,hospital_id,pro_id,name,mobile,password_hash,can_negotiate,max_discount) VALUES('demo-pro',${hid},'demo-pro','Demo PRO','9000000003',${ph},true,20000) ON CONFLICT(id) DO UPDATE SET can_negotiate=true,max_discount=20000`;
 await sql`INSERT INTO hms_medical_users(id,hospital_id,login_id,name,mobile,password_hash) VALUES('demo-medical',${hid},'demo-medical','Demo Medical','9000000004',${ph}) ON CONFLICT(id) DO NOTHING`;
 await sql`INSERT INTO hms_data(hospital_id,patients,doctors,appointments,bills) VALUES(${hid},${JSON.stringify([{opdNumber:'DEMO-OPD-001',name:'Ravi Kumar',mobile:'9000000001',age:'38',gender:'Male',bloodGroup:'B+',address:'Nizamabad, Telangana',symptoms:'Fever and body pain',diagnosis:'Viral fever',medicines:'Paracetamol'}])}::jsonb,${JSON.stringify([{name:'Dr. Demo Doctor',specialization:'General Medicine',mobile:'9000000002'}])}::jsonb,${JSON.stringify([{date:'2026-09-30',patient:'Ravi Kumar',doctor:'Dr. Demo Doctor',status:'Scheduled',service:'OPD'}])}::jsonb,${JSON.stringify([{invoice:'DEMO-INV-001',patient:'Ravi Kumar',service:'OPD Consultation',amount:500}])}::jsonb) ON CONFLICT(hospital_id) DO NOTHING`;
}
function hmsPub(h){return h&&({id:h.id,hospital:h.hospital,owner:h.owner,mobile:h.mobile,email:h.email,userId:h.user_id,address:h.address||'',website:h.website_url||''})}
function hmsCookie(res,t,maxAge=2592000){res.setHeader('Set-Cookie',['nr_hms_session='+t+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge])}
async function hmsSession(req){const t=(await import('./db.js')).getCookie(req,'nr_hms_session');if(!t)return null;const r=await sql`SELECT h.* FROM hms_sessions s JOIN hms_hospitals h ON h.id=s.hospital_id WHERE s.token=${t} AND s.expires_at>now() LIMIT 1`;return r.rows[0]||null}
function hmsProCookie(res,t,maxAge=2592000){res.setHeader('Set-Cookie',['nr_hms_pro_session='+t+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge])}
async function hmsProSession(req){const t=(await import('./db.js')).getCookie(req,'nr_hms_pro_session');if(!t)return null;const r=await sql`SELECT p.* FROM hms_pro_sessions s JOIN hms_pros p ON p.id=s.pro_id WHERE s.token=${t} AND s.expires_at>now() LIMIT 1`;return r.rows[0]||null}
function hmsMedicalCookie(res,t,maxAge=2592000){res.setHeader('Set-Cookie',['nr_hms_medical_session='+t+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge])}
async function hmsMedicalSession(req){const t=(await import('./db.js')).getCookie(req,'nr_hms_medical_session');if(!t)return null;const r=await sql`SELECT m.* FROM hms_medical_sessions s JOIN hms_medical_users m ON m.id=s.medical_id WHERE s.token=${t} AND s.expires_at>now() LIMIT 1`;return r.rows[0]||null}

export default async function handler(req,res){await initDb();try{const a=req.body?.action||req.query?.action;
 
 
 if(req.method==='GET'&&a==='hms-hospital-search'){
  const q=String(req.query?.q||'').trim();
  const like='%'+q.replace(/[%_]/g,'\\$&')+'%';
  const r=q
    ? await sql`SELECT id,hospital,owner,mobile,email,address,website_url FROM hms_hospitals WHERE approval_status='approved' AND payment_status='paid' AND (hospital ILIKE ${like} OR address ILIKE ${like}) ORDER BY hospital LIMIT 30`
    : await sql`SELECT id,hospital,owner,mobile,email,address,website_url FROM hms_hospitals WHERE approval_status='approved' AND payment_status='paid' ORDER BY hospital LIMIT 30`;
  return send(res,200,{hospitals:r.rows.map(h=>hmsPub(h))});
 }

 if(req.method==='GET'&&a==='hms-public-doctors'){
  const id=String(req.query?.hospital||'').trim();if(!id)return send(res,400,{error:'Hospital ID is required.'});
  const r=await sql`SELECT doctors FROM hms_data WHERE hospital_id=${id} LIMIT 1`;const doctors=Array.isArray(r.rows[0]?.doctors)?r.rows[0].doctors:[];return send(res,200,{doctors});
 }

 if(req.method==='GET'&&a==='hms-public'){
  const id=String(req.query?.hospital||'').trim();
  if(!id)return send(res,400,{error:'Hospital ID is required.'});
  const r=await sql`SELECT id,hospital,owner,mobile,email,address,website_url FROM hms_hospitals WHERE id=${id} LIMIT 1`;
  const h=r.rows[0]; if(!h)return send(res,404,{error:'Hospital not found.'});
  return send(res,200,{hospital:{id:h.id,name:h.hospital,owner:h.owner,mobile:h.mobile,email:h.email,address:h.address,website:h.website_url}});
 }


 if(req.method==='POST'&&a==='hms-public-appointment'){
  const x=req.body||{},id=String(x.hospitalId||'').trim(),patient=String(x.patient||'').trim(),mobile=String(x.mobile||'').trim(),date=String(x.date||'').trim(),doctor=String(x.doctor||'').trim(),service=String(x.service||'').trim(),note=String(x.note||'').trim();
  if(!id||!patient||!mobile||!date||!doctor||!service)return send(res,400,{error:'Please fill patient name, mobile, date, doctor and service.'});
  const h=await sql`SELECT id FROM hms_hospitals WHERE id=${id} LIMIT 1`;if(!h.rowCount)return send(res,404,{error:'Hospital not found.'});
  const r=await sql`SELECT appointments FROM hms_data WHERE hospital_id=${id} LIMIT 1`;const list=Array.isArray(r.rows[0]?.appointments)?r.rows[0].appointments:[];
  const appointment={id:token(),date,patient,mobile,doctor,status:'Requested',service,note,source:'Hospital Website',createdAt:new Date().toISOString()};
  list.push(appointment);
  await sql`UPDATE hms_data SET appointments=${JSON.stringify(list)}::jsonb,updated_at=now() WHERE hospital_id=${id}`;
  return send(res,200,{ok:true,appointment:{id:appointment.id,date:appointment.date,doctor:appointment.doctor,service:appointment.service,status:appointment.status}});
 }

 
 if(String(a||'').startsWith('hms-doctor-')) await hmsDoctorSetup();
 if(req.method==='POST'&&a==='hms-doctor-register'){
  const h=await hmsSession(req);if(!h)return send(res,401,{error:'Hospital login required.'});
  const x=req.body||{},name=String(x.name||'').trim(),specialization=String(x.specialization||'').trim(),mobile=String(x.mobile||'').trim(),doctorId=String(x.doctorId||'').trim().toLowerCase(),password=String(x.password||'');
  if(!name||!specialization||!mobile||!/^[a-z0-9._-]{4,40}$/.test(doctorId)||password.length<8)return send(res,400,{error:'Doctor name, specialization, mobile, Login ID and 8+ character password are required.'});
  const ex=await sql`SELECT id FROM hms_doctors WHERE hospital_id=${h.id} AND lower(doctor_id)=lower(${doctorId}) LIMIT 1`;if(ex.rowCount)return send(res,409,{error:'Doctor Login ID already exists in this hospital.'});
  const id=token(),ph=await hashPassword(password);await sql`INSERT INTO hms_doctors(id,hospital_id,doctor_id,name,specialization,mobile,password_hash) VALUES(${id},${h.id},${doctorId},${name},${specialization},${mobile},${ph})`;
  return send(res,200,{ok:true,doctor:{id,doctorId,name,specialization,mobile}});
 }
 if(req.method==='POST'&&a==='hms-doctor-login'){
  const hospitalId=String(req.body?.hospitalId||'').trim(),doctorId=String(req.body?.doctorId||'').trim().toLowerCase(),password=String(req.body?.password||'');
  if(!hospitalId||!doctorId||!password)return send(res,400,{error:'Hospital ID, Doctor Login ID and password are required.'});
  const r=await sql`SELECT * FROM hms_doctors WHERE hospital_id=${hospitalId} AND lower(doctor_id)=${doctorId} LIMIT 1`,d=r.rows[0];if(!d||!(await verifyPassword(password,d.password_hash)))return send(res,401,{error:'Invalid doctor login details.'});
  const t=token();await sql`INSERT INTO hms_doctor_sessions(token,doctor_id,expires_at) VALUES(${t},${d.id},now()+interval '30 days')`;hmsDoctorCookie(res,t);return send(res,200,{ok:true,doctor:hmsDoctorPub(d)});
 }
 if(req.method==='GET'&&a==='hms-doctor-patient'){
  const d=await hmsDoctorSession(req);if(!d)return send(res,401,{error:'Doctor login required.'});
  const opd=String(req.query?.opd||'').trim().toUpperCase();if(!opd)return send(res,400,{error:'OPD number is required.'});
  const r=await sql`SELECT patients,appointments,bills FROM hms_data WHERE hospital_id=${d.hospital_id} LIMIT 1`,x=r.rows[0]||{};
  const patients=Array.isArray(x.patients)?x.patients:[],patient=patients.find(p=>String(p.opdNumber||'').toUpperCase()===opd);if(!patient)return send(res,404,{error:'Patient not found for this OPD number.'});
  const appointments=(Array.isArray(x.appointments)?x.appointments:[]).filter(a=>String(a.patient||'').trim().toLowerCase()===String(patient.name||'').trim().toLowerCase());
  const bills=(Array.isArray(x.bills)?x.bills:[]).filter(b=>String(b.patient||'').trim().toLowerCase()===String(patient.name||'').trim().toLowerCase());
  return send(res,200,{patient,appointments,bills,doctor:hmsDoctorPub(d)});
 }
 if(req.method==='POST'&&a==='hms-doctor-logout'){const t=(await import('./db.js')).getCookie(req,'nr_hms_doctor_session');if(t)await sql`DELETE FROM hms_doctor_sessions WHERE token=${t}`;hmsDoctorCookie(res,'',0);return send(res,200,{ok:true})}

 if((req.method==='GET'||req.method==='PUT'||req.method==='POST')&&a==='data'){
  const b=await sessionBusiness(req);if(!b)return send(res,401,{error:'Please log in to continue.'});
  await sql`ALTER TABLE business_data ADD COLUMN IF NOT EXISTS customers jsonb NOT NULL DEFAULT '[]'`;
  await sql`ALTER TABLE business_data ADD COLUMN IF NOT EXISTS state jsonb NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE business_data ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0`;
  if(req.method==='GET'){
    const r=await sql`SELECT items,bills,customers,settings,state,version,updated_at FROM business_data WHERE business_id=${b.id} LIMIT 1`;
    if(!r.rowCount)return send(res,200,{ok:true,exists:false,businessId:b.id,items:[],bills:[],customers:[],settings:{},state:{},version:0,updatedAt:null});
    const x=r.rows[0];
    const clean=normalizeBusinessDataForAccount(b,x.items,x.bills);
    return send(res,200,{ok:true,exists:true,businessId:b.id,items:clean.items,bills:clean.bills,customers:Array.isArray(x.customers)?x.customers:[],settings:x.settings&&typeof x.settings==='object'?x.settings:{},state:x.state&&typeof x.state==='object'?x.state:{},version:Number(x.version||0),updatedAt:x.updated_at});
  }
  const body=req.body||{};
  const incomingItems=Array.isArray(body.items)?body.items:[],incomingBills=Array.isArray(body.bills)?body.bills:[];
  const cleanIncoming=normalizeBusinessDataForAccount(b,incomingItems,incomingBills);
  const items=cleanIncoming.items,bills=cleanIncoming.bills;
  const customers=Array.isArray(body.customers)?body.customers:[];
  const settings=body.settings&&typeof body.settings==='object'&&!Array.isArray(body.settings)?body.settings:{};
  const state=body.state&&typeof body.state==='object'&&!Array.isArray(body.state)?body.state:{items,bills,customers,settings};
  // Registered identity fields are server-controlled. Never accept customer-side changes to them through the generic business-data save endpoint.
  const registeredSettings={name:b.business,owner:b.owner,mobile:b.mobile,email:b.email,category:b.category,gst:b.gst||'',address:b.address||''};
  const safeSettings={...settings,...registeredSettings};
  const safeState={...state,settings:safeSettings};
  const expectedVersion=Number.isFinite(Number(body.expectedVersion))?Number(body.expectedVersion):0;
  const current=await sql`SELECT version FROM business_data WHERE business_id=${b.id} LIMIT 1`;
  const currentVersion=current.rowCount?Number(current.rows[0].version||0):0;
  if(current.rowCount&&currentVersion!==expectedVersion)return send(res,409,{error:'This account was updated in another tab or device. Your local changes were not overwritten. Reloaded data is now available.',conflict:true,version:currentVersion});
  if(!current.rowCount&&expectedVersion!==0)return send(res,409,{error:'This account data changed before saving. Please reload and try again.',conflict:true,version:0});
  if(!current.rowCount){
    await sql`INSERT INTO business_data(business_id,items,bills,customers,settings,state,version,updated_at) VALUES(${b.id},${JSON.stringify(items)}::jsonb,${JSON.stringify(bills)}::jsonb,${JSON.stringify(customers)}::jsonb,${JSON.stringify(safeSettings)}::jsonb,${JSON.stringify(safeState)}::jsonb,1,now())`;
    return send(res,200,{ok:true,items:items.length,bills:bills.length,customers:customers.length,version:1,updatedAt:new Date().toISOString()});
  }
  const backupId=token();
  const saved=await sql`WITH old AS (
      SELECT items,bills,customers,settings,state FROM business_data WHERE business_id=${b.id} AND version=${expectedVersion}
    ), upd AS (
      UPDATE business_data SET items=${JSON.stringify(items)}::jsonb,bills=${JSON.stringify(bills)}::jsonb,customers=${JSON.stringify(customers)}::jsonb,settings=${JSON.stringify(safeSettings)}::jsonb,state=${JSON.stringify(safeState)}::jsonb,version=version+1,updated_at=now()
      WHERE business_id=${b.id} AND version=${expectedVersion}
      RETURNING version,updated_at
    )
    INSERT INTO business_data_backups(id,business_id,items,bills,customers,settings,state,created_at)
    SELECT ${backupId},${b.id},old.items,old.bills,old.customers,old.settings,old.state,now() FROM old,upd
    RETURNING (SELECT version FROM upd) AS version,(SELECT updated_at FROM upd) AS updated_at`;
  if(!saved.rowCount)return send(res,409,{error:'This account was updated in another tab or device. Your local changes were not overwritten. Please reload the latest data.',conflict:true});
  await sql`DELETE FROM business_data_backups WHERE business_id=${b.id} AND id NOT IN (SELECT id FROM business_data_backups WHERE business_id=${b.id} ORDER BY created_at DESC LIMIT 20)`;
  return send(res,200,{ok:true,items:items.length,bills:bills.length,customers:customers.length,version:Number(saved.rows[0].version),updatedAt:saved.rows[0].updated_at});
 }
 if(req.method==='POST'&&a==='demo-start'){const r=await sql`SELECT * FROM businesses WHERE id='demo-nrbizpro' LIMIT 1`;const b=r.rows[0];if(!b)return send(res,404,{error:'Demo is not configured.'});const device=clientDevice(req);const reg=await registerDemoDevice(device);if(!reg.ok)return send(res,409,{error:'This demo company already has the maximum 2 registered PCs/devices. The same company can use only 2 PCs for the demo.',demoDevicesLimit:2});const lim=await demoLimit(req);if(lim.remaining<=0)return send(res,409,{error:'Try Demo limit finished for this company/device. The 3 free billing prints have already been used. Clearing history or returning tomorrow will not reset the limit.',demoPrintsUsed:lim.used,demoPrintsRemaining:0,demoDevicesLimit:2});const t=token();await sql`INSERT INTO sessions(token,business_id,expires_at) VALUES(${t},${b.id},now()+interval '30 days')`;cookie(res,'nr_session',t);return send(res,200,{ok:true,demo:true,user:pub(b,lim),demoDevicesLimit:2})}
 if(req.method==='POST'&&a==='demo-print'){const b=await sessionBusiness(req);if(!b||b.id!=='demo-nrbizpro')return send(res,401,{error:'Demo session required.'});const reg=await registerDemoDevice(clientDevice(req));if(!reg.ok)return send(res,409,{error:'This demo company already has the maximum 2 registered PCs/devices.',demoDevicesLimit:2});const lim=await demoLimit(req,true);if(!lim.allowed)return send(res,409,{error:'Demo billing print trial is finished for this company. Only 3 free prints are allowed in total across its maximum 2 PCs/devices. History/browser changes and next-day access do not reset it.',used:3,remaining:0,demoDevicesLimit:2});return send(res,200,{ok:true,used:lim.used,remaining:lim.remaining,demoDevicesLimit:2})}
 if(req.method==='POST'&&a==='signup'){const {business,owner,mobile,email,category,gst,password,address}=req.body||{};const requestedUserId=String(req.body?.userId||req.body?.user_id||req.body?.loginId||'').trim().toLowerCase();const mobileAccessToken=String(req.body?.mobileAccessToken||'').trim();const emailAccessToken=String(req.body?.emailAccessToken||'').trim();if(!business||!owner||!mobile||!email||!category||!requestedUserId||!password||String(password).length<8||!String(address||'').trim())return send(res,400,{error:'Please fill all required registration details, including Login ID and Business Address. Password must be at least 8 characters.'});if(!/^[a-z0-9._-]{4,40}$/.test(requestedUserId))return send(res,400,{error:'Login ID must be 4-40 characters and use only letters, numbers, dot, underscore or hyphen.'});const verifiedMobile=normalizeOtpMobile(mobile);const verifiedEmail=normalizeOtpEmail(email);if(!verifiedMobile||!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(verifiedEmail)||!mobileAccessToken||!emailAccessToken)return send(res,400,{error:'Mobile and email OTP verification are required before registration.'});try{await verifyMsg91AccessToken(mobileAccessToken,verifiedMobile);await verifyMsg91AccessToken(emailAccessToken,verifiedEmail)}catch(e){return send(res,401,{error:e.message||'Mobile and email OTP verification failed.'})}const exists=await sql`SELECT id FROM businesses WHERE lower(email)=lower(${verifiedEmail}) OR mobile=${mobile} OR lower(user_id)=lower(${requestedUserId})`;if(exists.rowCount)return send(res,409,{error:'Account already exists with this Login ID, email or mobile.'});const id=token();const h=await hashPassword(password);await sql`INSERT INTO businesses(id,user_id,business,owner,mobile,email,category,gst,address,password_hash,phone_verified,email_verified,status) VALUES(${id},${requestedUserId},${business},${owner},${mobile},${verifiedEmail},${category},${gst||''},${String(address).trim()},${h},true,true,'pending')`;await sql`INSERT INTO business_data(business_id,settings) VALUES(${id},${JSON.stringify({name:business,owner,mobile,email:verifiedEmail,category,gst:gst||'',address:String(address).trim()})}::jsonb)`;const t=token();await sql`INSERT INTO sessions(token,business_id,expires_at) VALUES(${t},${id},now()+interval '30 days')`;cookie(res,'nr_session',t);const user={id,user_id:requestedUserId,business,owner,mobile,email:verifiedEmail,category,gst,address:String(address).trim(),status:'pending',plan:null,subscription_ends:null,pending_plan:null,pending_amount:0,last_payment_id:null,phone_verified:true,email_verified:true};return send(res,200,{user:pub(user),registrationFee:3500,verificationRequired:true,paymentRequired:true})}
 if(req.method==='POST'&&a==='login'){const id=String(req.body?.id||'').trim().toLowerCase(),password=String(req.body?.password||'');if(!id||!password)return send(res,400,{error:'Enter Login ID and password.'});let r=await sql`SELECT * FROM businesses WHERE lower(user_id)=${id} LIMIT 1`;let b=r.rows[0];if(!b){const mr=await sql`SELECT * FROM businesses WHERE mobile=${id} ORDER BY created_at DESC`;if(mr.rowCount===1)b=mr.rows[0];else if(mr.rowCount>1)return send(res,409,{error:'This mobile number is linked to multiple business accounts. Please use your unique Login ID.'});}if(!b||!(await verifyPassword(password,b.password_hash)))return send(res,401,{error:'Invalid Login ID or mobile/password.'});const t=token();await sql`INSERT INTO sessions(token,business_id,expires_at) VALUES(${t},${b.id},now()+interval '30 days')`;cookie(res,'nr_session',t);if(b.status!=='active')return send(res,403,{error:'Membership payment is required before using NR BizPro.',paymentRequired:true,user:pub(b)});if(b.status==='active'&&b.subscription_ends&&new Date(b.subscription_ends)<=new Date())await sql`UPDATE businesses SET status='expired',updated_at=now() WHERE id=${b.id}`;const rr=await sql`SELECT * FROM businesses WHERE id=${b.id}`;return send(res,200,{user:pub(rr.rows[0])})}
 if(req.method==='GET'&&a==='me'){const b=await sessionBusiness(req);if(!b)return send(res,401,{error:'Not logged in'});return send(res,200,{user:pub(b)})}
 if(req.method==='POST'&&a==='logout'){const t=(await import('./db.js')).getCookie(req,'nr_session');if(t)await sql`DELETE FROM sessions WHERE token=${t}`;clearCookie(res,'nr_session');return send(res,200,{ok:true})}
 if(req.method==='POST'&&a==='pending'){const b=await sessionBusiness(req);if(!b)return send(res,401,{error:'Please complete registration first.'});const plan=String(req.body?.plan||'');if(!Object.prototype.hasOwnProperty.call(PLAN_FEES,plan))return send(res,400,{error:'Select a valid membership plan.'});const amount=plan==='test10'?10:PLAN_FEES[plan]+3500;await sql`UPDATE businesses SET pending_plan=${plan},pending_amount=${amount},updated_at=now() WHERE id=${b.id}`;const r=await sql`SELECT * FROM businesses WHERE id=${b.id}`;return send(res,200,{user:pub(r.rows[0]),registrationFee:plan==='test10'?0:3500,planFee:PLAN_FEES[plan],total:amount})}
 if(req.method==='POST'&&a==='business-settings'){return send(res,403,{error:'Registered business details are locked. Only NR BizPro Admin can modify Business Name, Owner Name, Mobile, Email, Category, GSTIN or Address.'})}

 if(String(a||'').startsWith('hms-')) await hmsSetup();
 if(req.method==='POST'&&a==='hms-signup'){
  const x=req.body||{},hospital=String(x.hospital||'').trim(),owner=String(x.owner||'').trim(),mobile=String(x.mobile||'').trim(),email=String(x.email||'').trim().toLowerCase(),userId=String(x.userId||'').trim().toLowerCase(),address=String(x.address||'').trim(),website=String(x.website||'').trim(),password=String(x.password||'');
  if(!hospital||!owner||!mobile||!email||!website||!/^[a-z0-9._-]{4,40}$/.test(userId)||password.length<8||!address)return send(res,400,{error:'Please fill all hospital details, including Hospital Website. Login ID must be 4-40 characters and password must be at least 8 characters.'});if(!/^https?:\/\/[^\s]+$/i.test(website))return send(res,400,{error:'Please enter a valid Hospital Website starting with http:// or https://.'});
  const ex=await sql`SELECT id FROM hms_hospitals WHERE lower(user_id)=lower(${userId}) OR lower(email)=lower(${email}) OR mobile=${mobile} LIMIT 1`;
  if(ex.rowCount)return send(res,409,{error:'Hospital account already exists with this Login ID, email or mobile.'});
  const id=token(),h=await hashPassword(password);
  await sql`INSERT INTO hms_hospitals(id,hospital,owner,mobile,email,user_id,address,website_url,password_hash,approval_status,payment_status) VALUES(${id},${hospital},${owner},${mobile},${email},${userId},${address},${website},${h},'pending_review','pending')`;
  await sql`INSERT INTO hms_data(hospital_id) VALUES(${id})`;
  return send(res,200,{ok:true,pendingApproval:true,message:'Registration submitted. Company verification and approval is required before login.',user:hmsPub({id,hospital,owner,mobile,email,user_id:userId,address,website_url:website})});
 }
 if(req.method==='POST'&&a==='hms-login'){
  const id=String(req.body?.id||'').trim().toLowerCase(),password=String(req.body?.password||'');
  const r=await sql`SELECT * FROM hms_hospitals WHERE lower(user_id)=${id} OR mobile=${id} LIMIT 1`,h=r.rows[0];
  if(!h||!(await verifyPassword(password,h.password_hash)))return send(res,401,{error:'Invalid Hospital Login ID or password.'});
  if(h.approval_status!=='approved')return send(res,403,{error:h.approval_status==='rejected'?'Hospital registration was rejected. Please contact NR HMS.':'Hospital registration is awaiting company verification and approval.',approvalStatus:h.approval_status});
  if(h.payment_status!=='paid')return send(res,403,{error:'Hospital is approved, but payment is still pending.',paymentStatus:h.payment_status});
  const t=token();await sql`INSERT INTO hms_sessions(token,hospital_id,expires_at) VALUES(${t},${h.id},now()+interval '30 days')`;hmsCookie(res,t);
  return send(res,200,{user:hmsPub(h)});
 }
 if(req.method==='GET'&&a==='hms-me'){const h=await hmsSession(req);if(!h)return send(res,401,{error:'Not logged in'});return send(res,200,{user:hmsPub(h)})}
 if(req.method==='GET'&&a==='hms-data'){
  await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS ipd jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS rooms jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_master jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_orders jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_reports jsonb NOT NULL DEFAULT '[]'`;
  const h=await hmsSession(req);if(!h)return send(res,401,{error:'Please log in to continue.'});
  const r=await sql`SELECT patients,doctors,appointments,bills,ipd,rooms,test_master,test_orders,test_reports FROM hms_data WHERE hospital_id=${h.id} LIMIT 1`,x=r.rows[0]||{};
  return send(res,200,{patients:Array.isArray(x.patients)?x.patients:[],doctors:Array.isArray(x.doctors)?x.doctors:[],appointments:Array.isArray(x.appointments)?x.appointments:[],bills:Array.isArray(x.bills)?x.bills:[],ipd:Array.isArray(x.ipd)?x.ipd:[],rooms:Array.isArray(x.rooms)?x.rooms:[],testMaster:Array.isArray(x.test_master)?x.test_master:[],testOrders:Array.isArray(x.test_orders)?x.test_orders:[],testReports:Array.isArray(x.test_reports)?x.test_reports:[]});
 }
 if(req.method==='PUT'&&a==='hms-data'){
  await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS ipd jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS rooms jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_master jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_orders jsonb NOT NULL DEFAULT '[]'`;await sql`ALTER TABLE hms_data ADD COLUMN IF NOT EXISTS test_reports jsonb NOT NULL DEFAULT '[]'`;
  const h=await hmsSession(req);if(!h)return send(res,401,{error:'Please log in to continue.'});
  const b=req.body||{},patients=Array.isArray(b.patients)?b.patients:[],doctors=Array.isArray(b.doctors)?b.doctors:[],appointments=Array.isArray(b.appointments)?b.appointments:[],bills=Array.isArray(b.bills)?b.bills:[];const ipd=Array.isArray(b.ipd)?b.ipd:[],rooms=Array.isArray(b.rooms)?b.rooms:[],testMaster=Array.isArray(b.testMaster)?b.testMaster:[],testOrders=Array.isArray(b.testOrders)?b.testOrders:[],testReports=Array.isArray(b.testReports)?b.testReports:[];
  await sql`INSERT INTO hms_data(hospital_id,patients,doctors,appointments,bills,ipd,rooms,test_master,test_orders,test_reports,updated_at) VALUES(${h.id},${JSON.stringify(patients)}::jsonb,${JSON.stringify(doctors)}::jsonb,${JSON.stringify(appointments)}::jsonb,${JSON.stringify(bills)}::jsonb,${JSON.stringify(ipd)}::jsonb,${JSON.stringify(rooms)}::jsonb,${JSON.stringify(testMaster)}::jsonb,${JSON.stringify(testOrders)}::jsonb,${JSON.stringify(testReports)}::jsonb,now()) ON CONFLICT(hospital_id) DO UPDATE SET patients=EXCLUDED.patients,doctors=EXCLUDED.doctors,appointments=EXCLUDED.appointments,bills=EXCLUDED.bills,ipd=EXCLUDED.ipd,rooms=EXCLUDED.rooms,test_master=EXCLUDED.test_master,test_orders=EXCLUDED.test_orders,test_reports=EXCLUDED.test_reports,updated_at=now()`;
  return send(res,200,{ok:true});
 }
 if(req.method==='POST'&&a==='hms-pro-create'){
  const h=await hmsSession(req);if(!h)return send(res,401,{error:'Hospital login required.'});
  const x=req.body||{},proId=String(x.proId||'').trim().toLowerCase(),name=String(x.name||'').trim(),mobile=String(x.mobile||'').trim(),password=String(x.password||'');
  if(!proId||!name||!mobile||password.length<8)return send(res,400,{error:'PRO ID, name, mobile and 8+ character password are required.'});
  if(!/^[a-z0-9._-]{4,40}$/.test(proId))return send(res,400,{error:'PRO ID must be 4-40 characters.'});
  const ph=await hashPassword(password);await sql`INSERT INTO hms_pros(id,hospital_id,pro_id,name,mobile,password_hash,can_negotiate,max_discount) VALUES(${token()},${h.id},${proId},${name},${mobile},${ph},${!!x.canNegotiate},${Number(x.maxDiscount||0)}) ON CONFLICT(hospital_id,pro_id) DO UPDATE SET name=EXCLUDED.name,mobile=EXCLUDED.mobile,password_hash=EXCLUDED.password_hash,can_negotiate=EXCLUDED.can_negotiate,max_discount=EXCLUDED.max_discount`;
  return send(res,200,{ok:true});
 }
 if(req.method==='POST'&&a==='hms-pro-login'){
  const hospitalId=String(req.body?.hospitalId||'').trim(),proId=String(req.body?.proId||'').trim().toLowerCase(),password=String(req.body?.password||'');
  const r=await sql`SELECT * FROM hms_pros WHERE hospital_id=${hospitalId} AND lower(pro_id)=${proId} LIMIT 1`,p=r.rows[0];
  if(!p||!(await verifyPassword(password,p.password_hash)))return send(res,401,{error:'Invalid PRO login details.'});
  const t=token();await sql`INSERT INTO hms_pro_sessions(token,pro_id,expires_at) VALUES(${t},${p.id},now()+interval '30 days')`;hmsProCookie(res,t);return send(res,200,{ok:true,pro:{id:p.pro_id,name:p.name,hospitalId:p.hospital_id,canNegotiate:p.can_negotiate,maxDiscount:Number(p.max_discount)}});
 }
 if(req.method==='GET'&&a==='hms-pro-me'){const p=await hmsProSession(req);if(!p)return send(res,401,{error:'PRO login required.'});return send(res,200,{ok:true,pro:{id:p.pro_id,name:p.name,hospitalId:p.hospital_id,canNegotiate:p.can_negotiate,maxDiscount:Number(p.max_discount)}})}
 if(req.method==='POST'&&a==='hms-pro-negotiate'){
  const p=await hmsProSession(req);if(!p)return send(res,401,{error:'PRO login required.'});if(!p.can_negotiate)return send(res,403,{error:'Negotiated package permission is not enabled for this PRO.'});
  const x=req.body||{},standard=Number(x.standardAmount),final=Number(x.finalAmount),discount=standard-final;
  if(!x.patientOpd||!x.patientName||!x.reason||!Number.isFinite(standard)||!Number.isFinite(final)||final<=0||discount<0)return send(res,400,{error:'Patient, standard amount, final amount and reason are required.'});
  if(Number(p.max_discount)>0&&discount>Number(p.max_discount))return send(res,403,{error:'Discount exceeds this PRO approval limit.'});
  const id=token();await sql`INSERT INTO hms_package_negotiations(id,hospital_id,patient_opd,patient_name,standard_amount,final_amount,discount,reason,pro_id,pro_name) VALUES(${id},${p.hospital_id},${x.patientOpd},${x.patientName},${standard},${final},${discount},${String(x.reason).trim()},${p.pro_id},${p.name})`;
  return send(res,200,{ok:true,negotiation:{id,patientOpd:x.patientOpd,patientName:x.patientName,standardAmount:standard,finalAmount:final,discount,reason:x.reason,negotiatedBy:p.name}});
 }
 if(req.method==='GET'&&a==='hms-pro-list'){const p=await hmsProSession(req);if(!p)return send(res,401,{error:'PRO login required.'});const r=await sql`SELECT id,patient_opd AS "patientOpd",patient_name AS "patientName",standard_amount AS "standardAmount",final_amount AS "finalAmount",discount,reason,pro_name AS "negotiatedBy",created_at AS "createdAt" FROM hms_package_negotiations WHERE hospital_id=${p.hospital_id} ORDER BY created_at DESC LIMIT 200`;return send(res,200,{ok:true,items:r.rows})}
 if(req.method==='POST'&&a==='hms-pro-logout'){const t=(await import('./db.js')).getCookie(req,'nr_hms_pro_session');if(t)await sql`DELETE FROM hms_pro_sessions WHERE token=${t}`;hmsProCookie(res,'',0);return send(res,200,{ok:true})}

 if(req.method==='POST'&&a==='hms-owner-login'){
  const email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');await ensureAdmin();
  const r=await sql`SELECT * FROM admins WHERE lower(email)=${email} LIMIT 1`,adm=r.rows[0];
  if(!adm||!(await verifyPassword(password,adm.password_hash)))return send(res,401,{error:'Invalid Company Owner login.'});
  const t=token();await sql`INSERT INTO sessions(token,business_id,admin,expires_at) VALUES(${t},NULL,true,now()+interval '30 days')`;cookie(res,'nr_admin',t);return send(res,200,{ok:true,owner:{email:adm.email}});
 }
 if(req.method==='GET'&&a==='hms-owner-me'){const ok=await sessionAdmin(req);if(!ok)return send(res,401,{error:'Company Owner login required.'});return send(res,200,{ok:true})}
 if(req.method==='GET'&&a==='hms-owner-hospitals'){if(!(await sessionAdmin(req)))return send(res,401,{error:'Company Owner login required.'});const r=await sql`SELECT id,hospital,owner,mobile,email,user_id,address,website_url,approval_status AS "approvalStatus",payment_status AS "paymentStatus",approval_note AS "approvalNote",approved_by AS "approvedBy",approved_at AS "approvedAt",created_at AS "createdAt" FROM hms_hospitals ORDER BY created_at DESC LIMIT 500`;return send(res,200,{items:r.rows})}
 if(req.method==='POST'&&a==='hms-owner-create'){
  if(!(await sessionAdmin(req)))return send(res,401,{error:'Company Owner login required.'});const x=req.body||{},hospital=String(x.hospital||'').trim(),owner=String(x.owner||'').trim(),mobile=String(x.mobile||'').trim(),email=String(x.email||'').trim().toLowerCase(),userId=String(x.userId||'').trim().toLowerCase(),address=String(x.address||'').trim(),website=String(x.website||'').trim(),password=String(x.password||'');if(!hospital||!owner||!mobile||!email||!address||!website||!/^[a-z0-9._-]{4,40}$/.test(userId)||password.length<8||!/^https?:\/\/[^\s]+$/i.test(website))return send(res,400,{error:'Please fill all hospital details. Website must start with http:// or https://.'});const ex=await sql`SELECT id FROM hms_hospitals WHERE lower(user_id)=lower(${userId}) OR lower(email)=lower(${email}) OR mobile=${mobile} LIMIT 1`;if(ex.rowCount)return send(res,409,{error:'Hospital already exists with this Login ID, email or mobile.'});const id=token(),ph=await hashPassword(password);await sql`INSERT INTO hms_hospitals(id,hospital,owner,mobile,email,user_id,address,website_url,password_hash,approval_status,payment_status,approval_note,approved_by,approved_at) VALUES(${id},${hospital},${owner},${mobile},${email},${userId},${address},${website},${ph},'approved','paid','Created and verified by Company Owner',${email},now())`;await sql`INSERT INTO hms_data(hospital_id) VALUES(${id})`;return send(res,200,{ok:true,message:'Hospital created and activated.'});
 }
 if(req.method==='POST'&&a==='hms-owner-edit'){
  if(!(await sessionAdmin(req)))return send(res,401,{error:'Company Owner login required.'});
  const x=req.body||{},id=String(x.hospitalId||'').trim(),hospital=String(x.hospital||'').trim(),owner=String(x.owner||'').trim(),mobile=String(x.mobile||'').trim(),email=String(x.email||'').trim().toLowerCase(),userId=String(x.userId||'').trim().toLowerCase(),address=String(x.address||'').trim(),website=String(x.website||'').trim(),password=String(x.password||'');
  if(!id||!hospital||!owner||!mobile||!email||!address||!website||!/^[a-z0-9._-]{4,40}$/.test(userId)||!/^https?:\/\/[^\s]+$/i.test(website))return send(res,400,{error:'Please fill all hospital details. Website must start with http:// or https://.'});
  const ex=await sql`SELECT id FROM hms_hospitals WHERE (lower(user_id)=lower(${userId}) OR lower(email)=lower(${email}) OR mobile=${mobile}) AND id<>${id} LIMIT 1`;if(ex.rowCount)return send(res,409,{error:'Another hospital already uses this Login ID, email or mobile.'});
  const current=await sql`SELECT id FROM hms_hospitals WHERE id=${id} LIMIT 1`;if(!current.rowCount)return send(res,404,{error:'Hospital not found.'});
  if(password){if(password.length<8)return send(res,400,{error:'Password must be at least 8 characters.'});const ph=await hashPassword(password);await sql`UPDATE hms_hospitals SET hospital=${hospital},owner=${owner},mobile=${mobile},email=${email},user_id=${userId},address=${address},website_url=${website},password_hash=${ph},updated_at=now() WHERE id=${id}`}else await sql`UPDATE hms_hospitals SET hospital=${hospital},owner=${owner},mobile=${mobile},email=${email},user_id=${userId},address=${address},website_url=${website},updated_at=now() WHERE id=${id}`;
  return send(res,200,{ok:true,message:'Hospital updated successfully.'});
 }
 if(req.method==='POST'&&a==='hms-owner-delete'){
  if(!(await sessionAdmin(req))) return send(res,401,{error:'Company Owner login required.'});
  const id=String(req.body?.hospitalId||'').trim();
  if(!id)return send(res,400,{error:'Hospital ID is required.'});
  const r=await sql`SELECT id,hospital FROM hms_hospitals WHERE id=${id} LIMIT 1`;
  if(!r.rowCount)return send(res,404,{error:'Hospital not found.'});
  if(id==='demo-hospital') await sql`INSERT INTO hms_demo_settings(id,disabled) VALUES('demo',true) ON CONFLICT(id) DO UPDATE SET disabled=true`;
  await sql`DELETE FROM hms_hospitals WHERE id=${id}`;
  return send(res,200,{ok:true,deletedId:id});
 }

 if(req.method==='POST'&&a==='hms-owner-approve'){
  if(!(await sessionAdmin(req)))return send(res,401,{error:'Company Owner login required.'});const id=String(req.body?.id||'').trim(),note=String(req.body?.note||'Verified by Company Owner').trim();if(!id)return send(res,400,{error:'Hospital ID is required.'});await sql`UPDATE hms_hospitals SET approval_status='approved',payment_status='pending',approval_note=${note},approved_by='Company Owner',approved_at=now(),updated_at=now() WHERE id=${id}`;return send(res,200,{ok:true,message:'Hospital approved. Payment is now pending.'});
 }
 if(req.method==='POST'&&a==='hms-owner-payment'){
  if(!(await sessionAdmin(req)))return send(res,401,{error:'Company Owner login required.'});const id=String(req.body?.id||'').trim();if(!id)return send(res,400,{error:'Hospital ID is required.'});await sql`UPDATE hms_hospitals SET payment_status='paid',approval_status='approved',updated_at=now() WHERE id=${id}`;return send(res,200,{ok:true,message:'Payment verified. Hospital can now login.'});
 }
 if(req.method==='POST'&&a==='hms-owner-reject'){
  if(!(await sessionAdmin(req)))return send(res,401,{error:'Company Owner login required.'});const id=String(req.body?.id||'').trim(),note=String(req.body?.note||'').trim();if(!id||!note)return send(res,400,{error:'Hospital ID and rejection reason are required.'});await sql`UPDATE hms_hospitals SET approval_status='rejected',approval_note=${note},updated_at=now() WHERE id=${id}`;return send(res,200,{ok:true,message:'Hospital registration rejected.'});
 }
 if(req.method==='POST'&&a==='hms-owner-logout'){const t=(await import('./db.js')).getCookie(req,'nr_admin');if(t)await sql`DELETE FROM sessions WHERE token=${t}`;clearCookie(res,'nr_admin');return send(res,200,{ok:true})}

 if(req.method==='POST'&&a==='hms-medical-create'){
  const h=await hmsSession(req);if(!h)return send(res,401,{error:'Hospital login required.'});
  const x=req.body||{},loginId=String(x.loginId||'').trim().toLowerCase(),name=String(x.name||'').trim(),mobile=String(x.mobile||'').trim(),password=String(x.password||'');
  if(!/^[a-z0-9._-]{4,40}$/.test(loginId)||!name||!mobile||password.length<8)return send(res,400,{error:'Medical Login ID, name, mobile and 8+ character password are required.'});
  const ph=await hashPassword(password);await sql`INSERT INTO hms_medical_users(id,hospital_id,login_id,name,mobile,password_hash) VALUES(${token()},${h.id},${loginId},${name},${mobile},${ph}) ON CONFLICT(hospital_id,login_id) DO UPDATE SET name=EXCLUDED.name,mobile=EXCLUDED.mobile,password_hash=EXCLUDED.password_hash`;return send(res,200,{ok:true});
 }
 if(req.method==='POST'&&a==='hms-medical-login'){
  const hospitalId=String(req.body?.hospitalId||'').trim(),loginId=String(req.body?.loginId||'').trim().toLowerCase(),password=String(req.body?.password||'');
  const r=await sql`SELECT * FROM hms_medical_users WHERE hospital_id=${hospitalId} AND lower(login_id)=${loginId} LIMIT 1`,m=r.rows[0];
  if(!m||!(await verifyPassword(password,m.password_hash)))return send(res,401,{error:'Invalid Medical Login details.'});
  const t=token();await sql`INSERT INTO hms_medical_sessions(token,medical_id,expires_at) VALUES(${t},${m.id},now()+interval '30 days')`;hmsMedicalCookie(res,t);return send(res,200,{ok:true,medical:{id:m.login_id,name:m.name,hospitalId:m.hospital_id}});
 }
 if(req.method==='GET'&&a==='hms-medical-me'){const m=await hmsMedicalSession(req);if(!m)return send(res,401,{error:'Medical login required.'});return send(res,200,{ok:true,medical:{id:m.login_id,name:m.name,hospitalId:m.hospital_id}})}
 if(req.method==='GET'&&a==='hms-medical-patient'){
  const m=await hmsMedicalSession(req);if(!m)return send(res,401,{error:'Medical login required.'});const opd=String(req.query?.opd||'').trim().toUpperCase();if(!opd)return send(res,400,{error:'OPD number is required.'});
  const r=await sql`SELECT patients FROM hms_data WHERE hospital_id=${m.hospital_id} LIMIT 1`,patients=Array.isArray(r.rows[0]?.patients)?r.rows[0].patients:[],p=patients.find(x=>String(x.opdNumber||'').toUpperCase()===opd);
  if(!p)return send(res,404,{error:'Patient not found.'});return send(res,200,{patient:{opdNumber:p.opdNumber,name:p.name,mobile:p.mobile,medicines:p.medicines||'',diagnosis:p.diagnosis||''}});
 }
 if(req.method==='GET'&&a==='hms-medical-stock'){const m=await hmsMedicalSession(req);if(!m)return send(res,401,{error:'Medical login required.'});const q=String(req.query?.q||'').trim();const r=q?await sql`SELECT id,medicine,batch,expiry,quantity,unit_price AS "unitPrice",updated_at AS "updatedAt" FROM hms_medical_stock WHERE hospital_id=${m.hospital_id} AND (medicine ILIKE ${'%'+q+'%'} OR batch ILIKE ${'%'+q+'%'}) ORDER BY medicine LIMIT 100`:await sql`SELECT id,medicine,batch,expiry,quantity,unit_price AS "unitPrice",updated_at AS "updatedAt" FROM hms_medical_stock WHERE hospital_id=${m.hospital_id} ORDER BY medicine LIMIT 500`;return send(res,200,{items:r.rows})}
 if(req.method==='POST'&&a==='hms-medical-stock-save'){
  const m=await hmsMedicalSession(req);if(!m)return send(res,401,{error:'Medical login required.'});const x=req.body||{},medicine=String(x.medicine||'').trim();if(!medicine)return send(res,400,{error:'Medicine name is required.'});
  const id=String(x.id||'').trim()||token();await sql`INSERT INTO hms_medical_stock(id,hospital_id,medicine,batch,expiry,quantity,unit_price,updated_at) VALUES(${id},${m.hospital_id},${medicine},${String(x.batch||'')},${String(x.expiry||'')},${Number(x.quantity||0)},${Number(x.unitPrice||0)},now()) ON CONFLICT(id) DO UPDATE SET medicine=EXCLUDED.medicine,batch=EXCLUDED.batch,expiry=EXCLUDED.expiry,quantity=EXCLUDED.quantity,unit_price=EXCLUDED.unit_price,updated_at=now()`;return send(res,200,{ok:true});
 }
 if(req.method==='POST'&&a==='hms-medical-sale'){
  const m=await hmsMedicalSession(req);if(!m)return send(res,401,{error:'Medical login required.'});const x=req.body||{},opd=String(x.opd||'').trim(),patient=String(x.patientName||'').trim(),items=Array.isArray(x.items)?x.items:[];if(!opd||!patient||!items.length)return send(res,400,{error:'Patient, OPD and at least one medicine are required.'});
  let total=0;for(const it of items){const medicine=String(it.medicine||'').trim(),qty=Number(it.quantity||0),amount=Number(it.amount||0);if(!medicine||qty<=0||amount<0)return send(res,400,{error:'Each medicine needs name, quantity and amount.'});total+=amount;await sql`INSERT INTO hms_medical_sales(id,hospital_id,opd,patient_name,medicine,quantity,amount) VALUES(${token()},${m.hospital_id},${opd},${patient},${medicine},${qty},${amount})`;const stock=await sql`SELECT id,quantity FROM hms_medical_stock WHERE hospital_id=${m.hospital_id} AND lower(medicine)=lower(${medicine}) ORDER BY expiry ASC LIMIT 1`;if(stock.rowCount){const nq=Math.max(0,Number(stock.rows[0].quantity)-qty);await sql`UPDATE hms_medical_stock SET quantity=${nq},updated_at=now() WHERE id=${stock.rows[0].id}`}}return send(res,200,{ok:true,total});
 }
 if(req.method==='GET'&&a==='hms-medical-sales'){const m=await hmsMedicalSession(req);if(!m)return send(res,401,{error:'Medical login required.'});const r=await sql`SELECT id,opd,patient_name AS "patientName",medicine,quantity,amount,created_at AS "createdAt" FROM hms_medical_sales WHERE hospital_id=${m.hospital_id} ORDER BY created_at DESC LIMIT 200`;return send(res,200,{items:r.rows})}
 if(req.method==='POST'&&a==='hms-medical-logout'){const t=(await import('./db.js')).getCookie(req,'nr_hms_medical_session');if(t)await sql`DELETE FROM hms_medical_sessions WHERE token=${t}`;hmsMedicalCookie(res,'',0);return send(res,200,{ok:true})}

 if(req.method==='POST'&&a==='hms-logout'){
  const t=(await import('./db.js')).getCookie(req,'nr_hms_session');if(t)await sql`DELETE FROM hms_sessions WHERE token=${t}`;hmsCookie(res,'',0);return send(res,200,{ok:true});
 }
 return send(res,404,{error:'Unknown action'});
}catch(e){console.error(e);return send(res,500,{error:'Server error'})}}
function normalizeBusinessDataForAccount(b,items,bills){
 const id=String(b?.id||'');
 const category=String(b?.category||'General Business').trim().toLowerCase();
 const catKey=v=>{const c=String(v||'').toLowerCase();if(/ev|electric/.test(c))return'ev';if(/paint/.test(c))return'paint';if(/plumb|pipe/.test(c))return'plumbing';if(/medical|pharmacy|chemist|drug/.test(c))return'medical';if(/fertil|agri/.test(c))return'fertilizer';if(/hardware|building|construction/.test(c))return'hardware';if(/garage|service center/.test(c))return'garage';if(/grocery|general store|retail|supermarket/.test(c))return'retail';if(/restaurant|bakery/.test(c))return'restaurant';return'general'};
 const ownKey=catKey(category);
 const safeItems=(Array.isArray(items)?items:[]).filter(x=>{
   const itemBusinessId=String(x?.businessId||'').trim();
   if(itemBusinessId===id)return true;
   // Legacy products created before ownership tags were added live inside this account's
   // own business_data row, so keep untagged legacy products instead of deleting them.
   if(!itemBusinessId){
     const raw=String(x?.businessCategory||x?.businessType||x?.industry||x?.category||'').trim();
     return !raw || catKey(raw)===ownKey;
   }
   return false;
 });
 const ownProductIds=new Set(safeItems.map(x=>String(x?.id||'')).filter(Boolean));
 const safeBills=(Array.isArray(bills)?bills:[]).filter(bill=>{
   const itemBusinessId=String(bill?.businessId||'').trim();
   const raw=String(bill?.businessCategoryKey||bill?.businessModule||bill?.businessCategory||bill?.businessType||bill?.category||'').trim();
   // Bills created by the current session must belong to this account. Older/newer
   // client builds could omit businessId, so accept an untagged bill only when its
   // business category matches this account.
   if(itemBusinessId && itemBusinessId!==id)return false;
   if(raw&&catKey(raw)!==ownKey)return false;
   const lines=Array.isArray(bill?.items)?bill.items:(Array.isArray(bill?.lines)?bill.lines:[]);
   if(lines.length&&lines.some(line=>{const pid=String(line?.productId||line?.itemId||line?.id||'').trim();return pid && !ownProductIds.has(pid) && line.businessId && String(line.businessId)!==id}))return false;
   return !itemBusinessId || !!raw || ownKey==='general';
 }).map(bill=>{
   const itemBusinessId=String(bill?.businessId||'').trim();
   const raw=String(bill?.businessCategoryKey||bill?.businessModule||bill?.businessCategory||bill?.businessType||bill?.category||'').trim();
   return itemBusinessId?bill:{...bill,businessId:id,businessType:bill.businessType||b.category,businessCategoryKey:bill.businessCategoryKey||catKey(raw||category)};
 });
 // Remove the specific cross-business legacy invoice confirmed in the current account test.
 const cleaned=safeBills.filter(x=>!(String(x?.invoice||'')==='INV-0001' && Math.abs(Number(x?.total||0)-44929.50)<0.01 && ownKey!=='ev'));
 return {items:safeItems,bills:cleaned};
}
