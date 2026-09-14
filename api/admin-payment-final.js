import {sql,initDb,sessionAdmin} from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.status(c).json(b)}
const PLANS={year3:{label:'6 Years',years:6,fee:6000},lifetime:{label:'Lifetime',years:0,fee:15000}};
export default async function handler(req,res){await initDb();try{
 if(!(await sessionAdmin(req)))return send(res,401,{error:'Admin login required'});
 if(req.method!=='POST'||req.body?.action!=='approve-final-payment')return send(res,404,{error:'Unknown action'});
 const paymentId=String(req.body?.paymentId||'').trim();if(!paymentId)return send(res,400,{error:'Payment ID is required.'});
 const pr=await sql`SELECT * FROM direct_payments WHERE id=${paymentId} LIMIT 1`;const p=pr.rows[0];if(!p)return send(res,404,{error:'Payment not found.'});if(p.status!=='pending')return send(res,409,{error:'Payment is already '+p.status+'.'});
 const plan=PLANS[p.plan];if(!plan)return send(res,400,{error:'Invalid final membership plan.'});
 const br=await sql`SELECT * FROM businesses WHERE id=${p.business_id} LIMIT 1`;if(!br.rows[0])return send(res,404,{error:'Business not found.'});
 let ends=null;if(plan.years){const d=new Date();d.setFullYear(d.getFullYear()+plan.years);ends=d.toISOString()}
 await sql`UPDATE direct_payments SET status='approved',reviewed_at=now(),admin_note='Payment verified and approved under final membership plan.' WHERE id=${paymentId}`;
 await sql`UPDATE businesses SET status='active',plan=${p.plan},subscription_ends=${ends},pending_plan=null,pending_amount=0,last_payment_id=${paymentId},updated_at=now() WHERE id=${p.business_id}`;
 return send(res,200,{ok:true,status:'approved',businessId:p.business_id,plan:plan.label,subscriptionEnds:ends});
}catch(e){console.error(e);return send(res,500,{error:e?.message||'Payment approval failed'})}}
