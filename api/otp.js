import { sql,initDb,sessionBusiness,hashOtp,makeOtp } from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.status(c).json(b)}
const normalizeMobile=m=>{const d=String(m||'').replace(/\D/g,'');return d.length===10?'91'+d:d};
async function sendPhoneOtp(mobile){
  const authkey=process.env.MSG91_AUTHKEY,templateId=process.env.MSG91_OTP_TEMPLATE_ID;
  if(!authkey||!templateId) throw new Error('Phone OTP is not configured yet. Add MSG91_AUTHKEY and MSG91_OTP_TEMPLATE_ID in Vercel.');
  const r=await fetch(`https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=${encodeURIComponent(normalizeMobile(mobile))}&authkey=${encodeURIComponent(authkey)}`,{method:'POST',headers:{'Content-Type':'application/json'}});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.message||'Could not send phone OTP.');
  return j;
}
async function sendEmailOtp(email,owner){
  const authkey=process.env.MSG91_AUTHKEY,templateId=process.env.MSG91_EMAIL_TEMPLATE_ID,from=process.env.MSG91_EMAIL_FROM,domain=process.env.MSG91_EMAIL_DOMAIN;
  if(!authkey||!templateId||!from||!domain) throw new Error('Email OTP is not configured yet. Add MSG91 email variables in Vercel.');
  const otp=makeOtp();
  const r=await fetch('https://control.msg91.com/api/v5/email/send',{method:'POST',headers:{accept:'application/json',authkey,'content-type':'application/json'},body:JSON.stringify({recipients:[{to:[{name:owner||'Customer',email}],variables:{otp,company_name:'NR BizPro'}}],from:{name:'NR BizPro',email:from},domain,template_id:templateId})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.message||'Could not send email OTP.');
  return otp;
}
export default async function handler(req,res){await initDb();try{
  const b=await sessionBusiness(req);if(!b)return send(res,401,{error:'Not logged in'});
  const action=req.query?.action||req.body?.action;
  if(req.method==='POST'&&action==='send'){
    const now=new Date();
    const phone=await sendPhoneOtp(b.mobile);
    const emailOtp=await sendEmailOtp(b.email,b.owner);
    await sql`INSERT INTO otp_challenges(business_id,phone_req_id,email_hash,phone_sent_at,email_sent_at,phone_attempts,email_attempts,updated_at) VALUES(${b.id},${phone.reqId||phone.req_id||null},${hashOtp(emailOtp)},${now},${now},0,0,now()) ON CONFLICT(business_id) DO UPDATE SET phone_req_id=EXCLUDED.phone_req_id,email_hash=EXCLUDED.email_hash,phone_sent_at=EXCLUDED.phone_sent_at,email_sent_at=EXCLUDED.email_sent_at,phone_attempts=0,email_attempts=0,updated_at=now()`;
    return send(res,200,{ok:true,message:'OTP sent to your phone and email.'});
  }
  if(req.method==='POST'&&action==='verify'){
    const channel=req.body?.channel,otp=String(req.body?.otp||'').trim();if(!['phone','email'].includes(channel)||!/^\d{4,8}$/.test(otp))return send(res,400,{error:'Enter a valid OTP.'});
    const r=await sql`SELECT * FROM otp_challenges WHERE business_id=${b.id}`;const c=r.rows[0];if(!c)return send(res,400,{error:'Please request a new OTP.'});
    if(channel==='email'){
      if(!c.email_sent_at||Date.now()-new Date(c.email_sent_at).getTime()>10*60*1000)return send(res,400,{error:'Email OTP expired. Please resend.'});
      if(c.email_attempts>=5)return send(res,429,{error:'Too many attempts. Please resend the OTP.'});
      if(hashOtp(otp)!==c.email_hash){await sql`UPDATE otp_challenges SET email_attempts=email_attempts+1,updated_at=now() WHERE business_id=${b.id}`;return send(res,400,{error:'Invalid email OTP.'});}
      await sql`UPDATE businesses SET email_verified=true,updated_at=now() WHERE id=${b.id}`;
    }else{
      const authkey=process.env.MSG91_AUTHKEY;if(!authkey)return send(res,500,{error:'Phone OTP is not configured.'});
      if(!c.phone_sent_at||Date.now()-new Date(c.phone_sent_at).getTime()>10*60*1000)return send(res,400,{error:'Phone OTP expired. Please resend.'});
      if(c.phone_attempts>=5)return send(res,429,{error:'Too many attempts. Please resend the OTP.'});
      const r2=await fetch(`https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&mobile=${encodeURIComponent(normalizeMobile(b.mobile))}`,{headers:{accept:'application/json',authkey}});const j=await r2.json().catch(()=>({}));
      if(!r2.ok||!/success|verified/i.test(JSON.stringify(j))){await sql`UPDATE otp_challenges SET phone_attempts=phone_attempts+1,updated_at=now() WHERE business_id=${b.id}`;return send(res,400,{error:j.message||'Invalid phone OTP.'});}
      await sql`UPDATE businesses SET phone_verified=true,updated_at=now() WHERE id=${b.id}`;
    }
    const u=(await sql`SELECT id,business,owner,mobile,email,category,gst,status,plan,subscription_ends,pending_plan,pending_amount,last_payment_id,phone_verified,email_verified FROM businesses WHERE id=${b.id}`).rows[0];
    return send(res,200,{ok:true,phoneVerified:u.phone_verified,emailVerified:u.email_verified,verified:!!u.phone_verified&&!!u.email_verified,user:u});
  }
  if(req.method==='POST'&&action==='resend'){
    const channel=req.body?.channel;if(!['phone','email'].includes(channel))return send(res,400,{error:'Invalid OTP channel.'});
    const r=await sql`SELECT * FROM otp_challenges WHERE business_id=${b.id}`;const c=r.rows[0];if(c){const sentAt=channel==='phone'?c.phone_sent_at:c.email_sent_at;if(sentAt&&Date.now()-new Date(sentAt).getTime()<60*1000)return send(res,429,{error:'Please wait 60 seconds before resending.'});}
    if(channel==='phone'){const p=await sendPhoneOtp(b.mobile);await sql`INSERT INTO otp_challenges(business_id,phone_req_id,phone_sent_at,phone_attempts,updated_at) VALUES(${b.id},${p.reqId||p.req_id||null},now(),0,now()) ON CONFLICT(business_id) DO UPDATE SET phone_req_id=EXCLUDED.phone_req_id,phone_sent_at=now(),phone_attempts=0,updated_at=now()`}
    else {const o=await sendEmailOtp(b.email,b.owner);await sql`INSERT INTO otp_challenges(business_id,email_hash,email_sent_at,email_attempts,updated_at) VALUES(${b.id},${hashOtp(o)},now(),0,now()) ON CONFLICT(business_id) DO UPDATE SET email_hash=EXCLUDED.email_hash,email_sent_at=now(),email_attempts=0,updated_at=now()`}
    return send(res,200,{ok:true,message:`${channel==='phone'?'Phone':'Email'} OTP resent.`});
  }
  return send(res,404,{error:'Unknown OTP action'});
}catch(e){console.error(e);return send(res,500,{error:e.message||'OTP service error'})}}
