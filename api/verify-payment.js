import crypto from 'node:crypto';
import {sql,initDb,sessionBusiness} from './db.js';
function send(res,code,body){res.setHeader('Content-Type','application/json');res.status(code).json(body)}

export default async function handler(req,res){
 if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
 const secret=process.env.RAZORPAY_KEY_SECRET,keyId=process.env.RAZORPAY_KEY_ID;
 if(!secret||!keyId)return send(res,500,{error:'Razorpay keys are not configured on the server.'});
 await initDb();
 try{
  const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body||{};
  if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature)return send(res,400,{error:'Missing Razorpay payment fields.'});

  // Verify the signature first.
  const expected=crypto.createHmac('sha256',secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  const sig=String(razorpay_signature);
  const valid=expected.length===sig.length&&crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig));
  if(!valid)return send(res,400,{verified:false,error:'Payment signature verification failed.'});

  const b=await sessionBusiness(req);
  if(!b)return send(res,401,{verified:false,error:'Login session expired. Please login and retry.'});
  if(!b.pending_plan)return send(res,400,{verified:false,error:'No pending membership payment was found.'});

  const planFees={year1:3000,year2:4000,year3:5200};
  const years={year1:1,year2:2,year3:3};
  const plan=b.pending_plan;
  if(!planFees[plan])return send(res,400,{verified:false,error:'Invalid pending membership plan.'});
  const expectedAmount=(Number(b.pending_amount)||0)*100;
  const expectedPlanAmount=(planFees[plan]+3500)*100;
  if(expectedAmount!==expectedPlanAmount)return send(res,400,{verified:false,error:'Payment amount configuration mismatch.'});

  // Confirm the actual Razorpay order amount and ownership on the server.
  const auth=Buffer.from(`${keyId}:${secret}`).toString('base64');
  const orderResponse=await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`,{headers:{Authorization:`Basic ${auth}`}});
  const order=await orderResponse.json();
  if(!orderResponse.ok)return send(res,400,{verified:false,error:'Unable to verify Razorpay order.'});
  if(Number(order.amount)!==expectedAmount||order.currency!=='INR')return send(res,400,{verified:false,error:'Payment amount does not match the selected membership.'});
  if(order.notes?.email&&String(order.notes.email).toLowerCase()!==String(b.email).toLowerCase())return send(res,400,{verified:false,error:'Payment does not belong to this business account.'});
  if(order.notes?.plan&&order.notes.plan!==plan)return send(res,400,{verified:false,error:'Payment plan does not match the selected membership.'});

  // Idempotency: never extend a subscription twice for the same payment.
  if(b.last_payment_id===razorpay_payment_id){
   const r=await sql`SELECT id,business,owner,mobile,email,category,gst,status,plan,subscription_ends,pending_plan,pending_amount,last_payment_id FROM businesses WHERE id=${b.id}`;
   return send(res,200,{verified:true,alreadyProcessed:true,paymentId:razorpay_payment_id,orderId:razorpay_order_id,user:r.rows[0]});
  }

  const base=b.status==='active'&&b.subscription_ends&&new Date(b.subscription_ends)>new Date()?new Date(b.subscription_ends):new Date();
  base.setDate(base.getDate()+365*years[plan]);
  await sql`UPDATE businesses SET status='active',plan=${plan},subscription_ends=${base.toISOString()},pending_plan=null,pending_amount=0,last_payment_id=${razorpay_payment_id},updated_at=now() WHERE id=${b.id}`;
  const r=await sql`SELECT id,business,owner,mobile,email,category,gst,status,plan,subscription_ends,pending_plan,pending_amount,last_payment_id FROM businesses WHERE id=${b.id}`;
  return send(res,200,{verified:true,paymentId:razorpay_payment_id,orderId:razorpay_order_id,user:r.rows[0]});
 }catch(e){
  console.error(e);
  return send(res,400,{verified:false,error:'Payment verification failed.'});
 }
}
