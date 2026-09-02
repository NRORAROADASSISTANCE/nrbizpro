import {sql,initDb,ensureAdmin,verifyPassword,token,cookie,clearCookie,sessionAdmin} from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.status(c).json(b)}
export default async function handler(req,res){
  await initDb();
  try{
    if(req.method==='POST'&&req.body?.action==='login'){
      const cfg=await ensureAdmin();const r=await sql`SELECT * FROM admins WHERE email=${req.body.email?.trim().toLowerCase()}`;
      if(!r.rows[0]||!(await verifyPassword(req.body.password||'',r.rows[0].password_hash)))return send(res,401,{error:'Invalid admin credentials.'});
      const t=token();await sql`INSERT INTO sessions(token,admin,expires_at) VALUES(${t},true,now()+interval '12 hours')`;cookie(res,'nr_admin',t,60*60*12);return send(res,200,{ok:true,email:r.rows[0].email,defaulted:cfg.defaulted});
    }
    if(req.method==='POST'&&req.body?.action==='logout'){clearCookie(res,'nr_admin');return send(res,200,{ok:true})}
    if(!(await sessionAdmin(req)))return send(res,401,{error:'Admin login required'});
    if(req.method==='GET'&&req.query.action==='businesses'){
      const r=await sql`SELECT id,business,owner,mobile,email,category,gst,status,plan,subscription_ends,created_at FROM businesses ORDER BY created_at DESC`;
      return send(res,200,{businesses:r.rows});
    }
    if(req.method==='GET'&&req.query.action==='direct-payments'){
      const status=String(req.query.status||'').trim();
      const r=status?await sql`SELECT p.id,p.business_id,p.plan,p.amount,p.utr,p.status,p.admin_note,p.created_at,p.reviewed_at,b.business,b.owner,b.mobile,b.email FROM direct_payments p JOIN businesses b ON b.id=p.business_id WHERE p.status=${status} ORDER BY p.created_at DESC`:await sql`SELECT p.id,p.business_id,p.plan,p.amount,p.utr,p.status,p.admin_note,p.created_at,p.reviewed_at,b.business,b.owner,b.mobile,b.email FROM direct_payments p JOIN businesses b ON b.id=p.business_id ORDER BY p.created_at DESC`;
      return send(res,200,{payments:r.rows});
    }
    if(req.method==='POST'&&req.body?.action==='approve-direct-payment'){
      const paymentId=String(req.body?.paymentId||'');if(!paymentId)return send(res,400,{error:'Payment ID is required.'});
      const r=await sql`SELECT * FROM direct_payments WHERE id=${paymentId}`;const p=r.rows[0];if(!p)return send(res,404,{error:'Payment not found.'});if(p.status!=='pending')return send(res,409,{error:`Payment is already ${p.status}.`});
      const years={year1:1,year2:2,year3:3}[p.plan];if(!years)return send(res,400,{error:'Invalid plan on payment.'});
      const b=await sql`SELECT * FROM businesses WHERE id=${p.business_id}`;if(!b.rows[0])return send(res,404,{error:'Business not found.'});
      const base=(b.rows[0].subscription_ends&&new Date(b.rows[0].subscription_ends)>new Date())?new Date(b.rows[0].subscription_ends):new Date();base.setFullYear(base.getFullYear()+years);
      await sql`UPDATE direct_payments SET status='approved',reviewed_at=now(),admin_note=${String(req.body?.note||'Payment verified and approved.')} WHERE id=${paymentId}`;
      await sql`UPDATE businesses SET status='active',plan=${p.plan},subscription_ends=${base.toISOString()},pending_plan=null,pending_amount=0,last_payment_id=${paymentId},updated_at=now() WHERE id=${p.business_id}`;
      return send(res,200,{ok:true,status:'approved',businessId:p.business_id,subscriptionEnds:base.toISOString()});
    }
    if(req.method==='POST'&&req.body?.action==='reject-direct-payment'){
      const paymentId=String(req.body?.paymentId||'');if(!paymentId)return send(res,400,{error:'Payment ID is required.'});
      const r=await sql`SELECT id,status FROM direct_payments WHERE id=${paymentId}`;if(!r.rows[0])return send(res,404,{error:'Payment not found.'});if(r.rows[0].status!=='pending')return send(res,409,{error:`Payment is already ${r.rows[0].status}.`});
      await sql`UPDATE direct_payments SET status='rejected',reviewed_at=now(),admin_note=${String(req.body?.note||'Payment could not be verified.')} WHERE id=${paymentId}`;
      return send(res,200,{ok:true,status:'rejected'});
    }
    return send(res,404,{error:'Unknown action'});
  }catch(e){console.error(e);return send(res,500,{error:'Admin server error'})}
}
