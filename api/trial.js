import { sql, initDb, sessionBusiness } from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.status(c).json(b)}
export default async function handler(req,res){
  await initDb();
  try{
    if(req.method!=='POST')return send(res,405,{error:'Method not allowed.'});
    const b=await sessionBusiness(req);
    if(!b)return send(res,401,{error:'Please complete registration first.'});
    const already=String(b.plan||'').toLowerCase()==='trial';
    if(already)return send(res,200,{ok:true,status:'active',plan:'trial',trialCopies:0});
    if(b.status==='active'&&b.plan)return send(res,409,{error:'This account already has an active membership.'});
    await sql`UPDATE businesses SET status='active',plan='trial',subscription_ends=null,pending_plan=null,pending_amount=0,updated_at=now() WHERE id=${b.id}`;
    const r=await sql`SELECT * FROM businesses WHERE id=${b.id}`;
    return send(res,200,{ok:true,status:'active',plan:'trial',user:r.rows[0]});
  }catch(e){console.error(e);return send(res,500,{error:e?.message||'Could not activate trial.'})}
}
