import {sql,initDb,sessionAdmin} from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.status(c).json(b)}
export default async function handler(req,res){await initDb();try{
 if(!(await sessionAdmin(req)))return send(res,401,{error:'Admin login required'});
 if(req.method!=='POST')return send(res,405,{error:'POST required'});
 const businessId=String(req.body?.businessId||'').trim();
 if(!businessId)return send(res,400,{error:'Business ID is required.'});
 const r=await sql`SELECT id,business,email FROM businesses WHERE id=${businessId}`;
 if(!r.rows[0])return send(res,404,{error:'Business not found.'});
 const b=r.rows[0];
 // Mark first so it immediately disappears from every admin listing, even if a legacy relation exists.
 await sql`UPDATE businesses SET status='deleted',updated_at=now() WHERE id=${businessId}`;
 await sql`DELETE FROM sessions WHERE business_id=${businessId}`;
 await sql`DELETE FROM otp_challenges WHERE business_id=${businessId}`;
 await sql`DELETE FROM direct_payments WHERE business_id=${businessId}`;
 await sql`DELETE FROM business_data_backups WHERE business_id=${businessId}`;
 await sql`DELETE FROM business_data WHERE business_id=${businessId}`;
 await sql`DELETE FROM businesses WHERE id=${businessId}`;
 return send(res,200,{ok:true,deletedBusiness:b});
}catch(e){console.error(e);return send(res,500,{error:e?.message||'Delete failed'})}}