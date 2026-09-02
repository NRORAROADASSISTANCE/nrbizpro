import {sql,initDb,sessionBusiness} from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.status(c).json(b)}
function id(){return globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}
function safePlan(plan){return ['year1','year2','year3'].includes(plan)}
export default async function handler(req,res){
  await initDb();
  try{
    if(req.method==='GET'&&req.query.action==='config'){
      const upi=String(process.env.NRBIZPRO_UPI_ID||'').trim();
      const name=String(process.env.NRBIZPRO_UPI_NAME||'NR BizPro').trim();
      return send(res,200,{upiId:upi,upiName:name,configured:!!upi});
    }
    const b=await sessionBusiness(req);
    if(!b)return send(res,401,{error:'Please complete registration first.'});
    if(req.method==='POST'&&req.body?.action==='submit'){
      const plan=String(req.body?.plan||'');
      const utr=String(req.body?.utr||'').trim().replace(/\s+/g,'');
      if(!safePlan(plan))return send(res,400,{error:'Select a valid membership plan.'});
      if(!/^[A-Za-z0-9-]{8,40}$/.test(utr))return send(res,400,{error:'Enter a valid UTR / transaction reference (8-40 characters).'});
      const existing=await sql`SELECT id FROM direct_payments WHERE utr=${utr} LIMIT 1`;
      if(existing.rowCount)return send(res,409,{error:'This UTR has already been submitted.'});
      const fees={year1:3000,year2:4000,year3:5200};
      const amount=3500+fees[plan];
      const paymentId=id();
      await sql`INSERT INTO direct_payments(id,business_id,plan,amount,utr,status) VALUES(${paymentId},${b.id},${plan},${amount},${utr},'pending')`;
      await sql`UPDATE businesses SET pending_plan=${plan},pending_amount=${amount},updated_at=now() WHERE id=${b.id}`;
      return send(res,200,{ok:true,paymentId,status:'pending',amount});
    }
    if(req.method==='GET'&&req.query.action==='status'){
      const r=await sql`SELECT id,plan,amount,utr,status,admin_note,created_at,reviewed_at FROM direct_payments WHERE business_id=${b.id} ORDER BY created_at DESC LIMIT 10`;
      return send(res,200,{payments:r.rows});
    }
    return send(res,404,{error:'Unknown action'});
  }catch(e){console.error(e);return send(res,500,{error:'Direct payment server error.'})}
}
