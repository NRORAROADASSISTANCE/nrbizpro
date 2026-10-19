import crypto from 'node:crypto';
import {sql,initDb,sessionBusiness} from '../lib/db.js';
function send(res,code,body){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.status(code).json(body)}

async function verifyPaytmPayment(req,res){
 const mid=process.env.PAYTM_MID,key=process.env.PAYTM_MERCHANT_KEY,environment=String(process.env.PAYTM_ENVIRONMENT||'staging').toLowerCase();
 if(!mid||!key)return send(res,503,{verified:false,error:'Paytm staging key is not configured in Preview environment variables.'});
 try{
  const {default:PaytmChecksum}=await import('paytmchecksum');
  const {sql,initDb,sessionBusiness}=await import('../lib/db.js');await initDb();
  const business=await sessionBusiness(req);if(!business)return send(res,401,{verified:false,error:'Login session expired. Please login and retry.'});
  const orderId=String(req.body?.orderId||'').trim();if(!/^[A-Za-z0-9_@-]{1,50}$/.test(orderId))return send(res,400,{verified:false,error:'Invalid Paytm order reference.'});
  const fees={monthly12:5988,monthly24:11976,year3:6000,year6:8500,lifetime:18500},days={monthly12:365,monthly24:730,year3:1095,year6:2190,lifetime:0},plan=String(business.pending_plan||'');
  if(!fees[plan]||Number(business.pending_amount)!==fees[plan])return send(res,400,{verified:false,error:'No matching pending membership payment was found.'});
  const host=environment==='production'?'https://secure.paytmpayments.com':'https://securestage.paytmpayments.com',statusBody={mid,orderId};
  const signature=await PaytmChecksum.generateSignature(JSON.stringify(statusBody),key);
  const response=await fetch(host+'/v3/order/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body:statusBody,head:{signature}})});
  const result=await response.json();
  if(!response.ok||!result?.body||!result?.head?.signature)return send(res,502,{verified:false,error:'Could not confirm payment status with Paytm. Please retry.'});
  if(!await PaytmChecksum.verifySignature(JSON.stringify(result.body),key,result.head.signature))return send(res,400,{verified:false,error:'Paytm status signature verification failed.'});
  const payment=result.body;
  if(String(payment.orderId||'')!==orderId||String(payment.mid||'')!==mid)return send(res,400,{verified:false,error:'Paytm order details did not match.'});
  if(payment.resultInfo?.resultStatus!=='TXN_SUCCESS')return send(res,400,{verified:false,error:payment.resultInfo?.resultMsg||'Paytm has not confirmed a successful payment yet.'});
  if(Math.round(Number(payment.txnAmount)*100)!==fees[plan]*100)return send(res,400,{verified:false,error:'Paytm payment amount does not match the selected membership.'});
  if(payment.custId&&String(payment.custId)!==String(business.id))return send(res,400,{verified:false,error:'Paytm payment belongs to a different account.'});
  if(business.last_payment_id&&business.last_payment_id===payment.txnId){const existing=await sql`SELECT id,business,owner,mobile,email,category,gst,address,status,plan,subscription_ends,pending_plan,pending_amount,last_payment_id FROM businesses WHERE id=${business.id}`;return send(res,200,{verified:true,alreadyProcessed:true,paymentId:payment.txnId,user:existing.rows[0]})}
  const base=business.status==='active'&&business.subscription_ends&&new Date(business.subscription_ends)>new Date()?new Date(business.subscription_ends):new Date();if(days[plan]>0)base.setDate(base.getDate()+days[plan]);
  await sql`UPDATE businesses SET status='active',plan=${plan},subscription_ends=${days[plan]>0?base.toISOString():null},pending_plan=null,pending_amount=0,last_payment_id=${String(payment.txnId||orderId)},updated_at=now() WHERE id=${business.id}`;
  const updated=await sql`SELECT id,business,owner,mobile,email,category,gst,address,status,plan,subscription_ends,pending_plan,pending_amount,last_payment_id FROM businesses WHERE id=${business.id}`;
  return send(res,200,{verified:true,paymentId:payment.txnId,user:updated.rows[0]});
 }catch(e){console.error('Paytm verification failed:',e?.message||e);return send(res,500,{verified:false,error:'Unable to verify Paytm payment safely. Membership was not activated.'})}
}

export default async function handler(req,res){
 if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
 if(req.body?.gateway==='paytm')return verifyPaytmPayment(req,res);
 const secret=process.env.RAZORPAY_KEY_SECRET,keyId=process.env.RAZORPAY_KEY_ID;
 if(!secret||!keyId)return send(res,500,{verified:false,error:'Razorpay Test/Live keys are not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel Environment Variables.'});
 await initDb();
 try{
  const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body||{};
  if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature)return send(res,400,{verified:false,error:'Missing Razorpay payment fields.'});
  const expected=crypto.createHmac('sha256',secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  const sig=String(razorpay_signature);
  const valid=expected.length===sig.length&&crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig));
  if(!valid)return send(res,400,{verified:false,error:'Payment signature verification failed.'});
  const b=await sessionBusiness(req);
  if(!b)return send(res,401,{verified:false,error:'Login session expired. Please login and retry.'});
  if(!b.pending_plan)return send(res,400,{verified:false,error:'No pending membership payment was found.'});
  const planFees={monthly12:5988,monthly24:11976,year3:6000,year6:8500,lifetime:18500,test10:10};
  const days={monthly12:365,monthly24:730,year3:1095,year6:2190,lifetime:0,test10:0};
  const plan=b.pending_plan;
  if(!planFees[plan])return send(res,400,{verified:false,error:'Invalid pending membership plan.'});
  const expectedAmount=(Number(b.pending_amount)||0)*100;
  const expectedPlanAmount=planFees[plan]*100;
  if(expectedAmount!==expectedPlanAmount)return send(res,400,{verified:false,error:'Payment amount configuration mismatch.'});
  const auth=Buffer.from(`${keyId}:${secret}`).toString('base64');
  const orderResponse=await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`,{headers:{Authorization:`Basic ${auth}`}});
  const order=await orderResponse.json();
  if(!orderResponse.ok)return send(res,400,{verified:false,error:'Unable to verify Razorpay order.'});
  if(Number(order.amount)!==expectedAmount||order.currency!=='INR')return send(res,400,{verified:false,error:'Payment amount does not match the selected membership.'});
  if(order.notes?.email&&String(order.notes.email).toLowerCase()!==String(b.email).toLowerCase())return send(res,400,{verified:false,error:'Payment does not belong to this business account.'});
  if(order.notes?.plan&&order.notes.plan!==plan)return send(res,400,{verified:false,error:'Payment plan does not match the selected membership.'});
  if(b.last_payment_id===razorpay_payment_id){const r=await sql`SELECT id,business,owner,mobile,email,category,gst,address,status,plan,subscription_ends,pending_plan,pending_amount,last_payment_id FROM businesses WHERE id=${b.id}`;return send(res,200,{verified:true,alreadyProcessed:true,paymentId:razorpay_payment_id,orderId:razorpay_order_id,user:r.rows[0]});}
  if(plan==='test10'){
   await sql`UPDATE businesses SET last_payment_id=${razorpay_payment_id},updated_at=now() WHERE id=${b.id}`;
   const r=await sql`SELECT id,business,owner,mobile,email,category,gst,address,status,plan,subscription_ends,pending_plan,pending_amount,last_payment_id FROM businesses WHERE id=${b.id}`;
   return send(res,200,{verified:true,testPayment:true,paymentId:razorpay_payment_id,orderId:razorpay_order_id,user:r.rows[0]});
  }
  const base=b.status==='active'&&b.subscription_ends&&new Date(b.subscription_ends)>new Date()?new Date(b.subscription_ends):new Date();
  if(days[plan]>0)base.setDate(base.getDate()+days[plan]);
  await sql`UPDATE businesses SET status='active',plan=${plan},subscription_ends=${days[plan]>0?base.toISOString():null},pending_plan=null,pending_amount=0,last_payment_id=${razorpay_payment_id},updated_at=now() WHERE id=${b.id}`;
  const r=await sql`SELECT id,business,owner,mobile,email,category,gst,address,status,plan,subscription_ends,pending_plan,pending_amount,last_payment_id FROM businesses WHERE id=${b.id}`;
  return send(res,200,{verified:true,paymentId:razorpay_payment_id,orderId:razorpay_order_id,user:r.rows[0]});
 }catch(e){console.error(e);return send(res,400,{verified:false,error:'Payment verification failed.'});}
}
