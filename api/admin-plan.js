import {sql,initDb,sessionAdmin} from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.status(c).json(b)}
const PLANS={year3:{label:'6 Years',years:6,fee:6000},lifetime:{label:'Lifetime',years:0,fee:15000}};
export default async function handler(req,res){await initDb();try{
  if(!(await sessionAdmin(req)))return send(res,401,{error:'Admin login required'});
  if(req.method!=='POST'||req.body?.action!=='activate-created')return send(res,404,{error:'Unknown action'});
  const businessId=String(req.body?.businessId||'').trim(),plan=String(req.body?.plan||'').trim();
  if(!businessId||!PLANS[plan])return send(res,400,{error:'Select a valid final membership plan.'});
  const r=await sql`SELECT id,business FROM businesses WHERE id=${businessId} LIMIT 1`;if(!r.rows[0])return send(res,404,{error:'Business not found.'});
  let ends=null;
  if(PLANS[plan].years){const d=new Date();d.setFullYear(d.getFullYear()+PLANS[plan].years);ends=d.toISOString()}
  await sql`UPDATE businesses SET status='active',plan=${plan},subscription_ends=${ends},pending_plan=null,pending_amount=0,updated_at=now() WHERE id=${businessId}`;
  return send(res,200,{ok:true,status:'active',plan,label:PLANS[plan].label,fee:PLANS[plan].fee,subscriptionEnds:ends,business:r.rows[0].business});
}catch(e){console.error(e);return send(res,500,{error:e?.message||'Admin plan activation failed'})}}
