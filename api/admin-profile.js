import {sql,initDb,sessionAdmin} from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.status(c).json(b)}
export default async function handler(req,res){await initDb();try{
 if(!(await sessionAdmin(req)))return send(res,401,{error:'Admin login required'});
 if(req.method!=='POST')return send(res,405,{error:'POST required'});
 const businessId=String(req.body?.businessId||'').trim();
 if(!businessId)return send(res,400,{error:'Business ID is required.'});
 const r=await sql`SELECT * FROM businesses WHERE id=${businessId} LIMIT 1`;
 const b=r.rows[0];if(!b)return send(res,404,{error:'Business not found.'});
 const s=req.body?.settings||{};
 const business=String(s.name??b.business).trim();
 const owner=String(s.owner??b.owner).trim();
 const mobile=String(s.mobile??b.mobile).trim();
 const email=String(s.email??b.email).trim().toLowerCase();
 const category=String(s.category??b.category).trim();
 const gst=String(s.gst??b.gst??'').trim();
 const address=String(s.address??b.address??'').trim();
 if(!business||!owner||!mobile||!email||!category||!address)return send(res,400,{error:'Business, owner, mobile, email, category and address are required.'});
 const duplicate=await sql`SELECT id FROM businesses WHERE id<>${businessId} AND (lower(email)=lower(${email}) OR mobile=${mobile} OR lower(business)=lower(${business})) LIMIT 1`;
 if(duplicate.rowCount)return send(res,409,{error:'Another business already uses this Business Name, email or mobile.'});
 await sql`UPDATE businesses SET business=${business},owner=${owner},mobile=${mobile},email=${email},category=${category},gst=${gst},address=${address},updated_at=now() WHERE id=${businessId}`;
 await sql`INSERT INTO business_data(business_id,settings) VALUES(${businessId},${JSON.stringify({name:business,owner,mobile,email,category,gst,address,adminUpdatedAt:new Date().toISOString()})}::jsonb) ON CONFLICT(business_id) DO UPDATE SET settings=business_data.settings || EXCLUDED.settings,updated_at=now()`;
 const out=await sql`SELECT id,user_id,business,owner,mobile,email,category,gst,address,status,plan,subscription_ends,created_at FROM businesses WHERE id=${businessId}`;
 return send(res,200,{ok:true,business:out.rows[0]});
 }catch(e){console.error(e);return send(res,500,{error:e?.message||'Admin profile update failed'})}}
