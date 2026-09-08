import {sql,initDb,sessionAdmin} from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.status(c).json(b)}
export default async function handler(req,res){await initDb();try{
 if(!(await sessionAdmin(req)))return send(res,401,{error:'Admin login required'});
 if(req.method!=='GET')return send(res,405,{error:'GET required'});
 const r=await sql`SELECT b.id,b.user_id,b.business,b.owner,b.mobile,b.email,b.category,b.gst,b.status,b.plan,b.subscription_ends,b.created_at,EXISTS(SELECT 1 FROM direct_payments p WHERE p.business_id=b.id AND p.status='pending') AS has_pending_payment FROM businesses b WHERE lower(coalesce(b.plan,'')) NOT IN ('demo','test','test10','trial') AND lower(coalesce(b.user_id,'')) NOT IN ('demo','nr-bizpro-demo') AND lower(coalesce(b.email,'')) NOT LIKE 'demo@%' AND lower(coalesce(b.business,'')) NOT LIKE '%demo showroom%' AND lower(coalesce(b.status,'')) <> 'deleted' ORDER BY b.created_at DESC`;
 const businesses=r.rows.map(b=>({...b,address:b.address||''}));
 try{const d=await sql`SELECT business_id,settings FROM business_data WHERE business_id = ANY(${r.rows.map(x=>x.id)})`;const byId=new Map(d.rows.map(x=>[x.business_id,x.settings||{}]));for(const b of businesses){const s=byId.get(b.id)||{};b.address=s.address||'';b.owner=b.owner||s.owner||'';b.email=b.email||s.email||'';}}catch{}
 return send(res,200,{businesses});
}catch(e){console.error(e);return send(res,500,{error:e?.message||'Business list failed'})}}