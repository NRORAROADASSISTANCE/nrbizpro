import crypto from 'node:crypto';
function send(res, code, body) { res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store'); res.status(code).json(body); }

async function createPaytmOrder(req,res){
 const mid=process.env.PAYTM_MID,key=process.env.PAYTM_MERCHANT_KEY;
 const environment=String(process.env.PAYTM_ENVIRONMENT||'staging').toLowerCase();
 const websiteName=process.env.PAYTM_WEBSITE_NAME||(environment==='production'?'DEFAULT':'WEBSTAGING');
 if(!mid||!key)return send(res,503,{error:'Add PAYTM_MERCHANT_KEY as a Preview-only sensitive Vercel environment variable before testing.'});
 if(!['staging','production'].includes(environment))return send(res,500,{error:'Invalid Paytm environment.'});
 if(environment==='production'&&process.env.VERCEL_ENV!=='production')return send(res,403,{error:'Production Paytm credentials are blocked outside Production.'});
 try{
  const {default:PaytmChecksum}=await import('paytmchecksum');
  const {initDb,sessionBusiness}=await import('../lib/db.js');await initDb();
  const business=await sessionBusiness(req);if(!business)return send(res,401,{error:'Please login again before paying.'});
  const fees={monthly12:5988,monthly24:11976,year3:6000,year6:8500,lifetime:18500},plan=String(business.pending_plan||'');
  if(!fees[plan]||Number(business.pending_amount)!==fees[plan])return send(res,400,{error:'No valid pending membership payment was found. Please select your plan again.'});
  const orderId=('NRBP'+Date.now().toString()+crypto.randomBytes(4).toString('hex')).slice(0,45);
  const body={requestType:'Payment',mid,websiteName,orderId,callbackUrl:process.env.PAYTM_CALLBACK_URL||'https://www.nrbizpro.in/paytm-callback.html',txnAmount:{value:Number(business.pending_amount).toFixed(2),currency:'INR'},userInfo:{custId:String(business.id).slice(0,50),mobile:String(business.mobile||'').slice(0,10),email:String(business.email||'').slice(0,80)}};
  const signature=await PaytmChecksum.generateSignature(JSON.stringify(body),key);
  const host=environment==='production'?'https://secure.paytmpayments.com':'https://securestage.paytmpayments.com';
  const response=await fetch(host+'/theia/api/v1/initiateTransaction?mid='+encodeURIComponent(mid)+'&orderId='+encodeURIComponent(orderId),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body,head:{signature}})});
  const result=await response.json();
  if(!response.ok||result?.body?.resultInfo?.resultStatus!=='S'||!result?.body?.txnToken){console.error('Paytm initiate failed:',result?.body?.resultInfo?.resultMsg||response.status);return send(res,502,{error:result?.body?.resultInfo?.resultMsg||'Paytm could not start the staging transaction. Check your staging credentials.'})}
  return send(res,200,{gateway:'paytm',orderId,txnToken:result.body.txnToken,amount:body.txnAmount.value,mid,environment,host});
 }catch(e){console.error('Paytm create order failed:',e?.message||e);return send(res,500,{error:'Unable to start Paytm payment. Please retry.'})}
}

export default async function handler(req,res){
 if(req.method!=='POST') return send(res,405,{error:'Method not allowed'});
 if(req.body?.gateway==='paytm') return createPaytmOrder(req,res);
 const keyId=process.env.RAZORPAY_KEY_ID,keySecret=process.env.RAZORPAY_KEY_SECRET;
 if(!keyId||!keySecret)return send(res,500,{error:'Razorpay Test/Live keys are not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel Environment Variables.'});
 try{
  const {plan,businessName,email,mobile,registrationFee}=req.body||{};
  const planAmounts={monthly12:598800,monthly24:1197600,year3:600000,year6:850000,lifetime:1850000,test10:1000};
  const duration={monthly12:365,monthly24:730,year3:1095,year6:2190,lifetime:0,test10:0};
  const selected=planAmounts[plan];
  if(!selected)return send(res,400,{error:'Invalid membership plan.'});
  const isTest=plan==='test10';
  const regFee=isTest?0:(plan==='year3'||plan==='year6'?250000:plan==='lifetime'?350000:0);
  const amount=selected;
  const receipt=`NRBP_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({amount,currency:'INR',receipt,notes:{plan,businessName:String(businessName||'').slice(0,100),email:String(email||'').slice(0,100),mobile:String(mobile||'').slice(0,20),registrationFee:regFee/100,planFee:isTest?10:((plan==='monthly12'?5988:plan==='monthly24'?11976:plan==='year3'?3500:plan==='year6'?6000:plan==='lifetime'?15000:selected/100)),testPayment:isTest}})});
  const data=await response.json();
  if(!response.ok)return send(res,response.status,{error:data.error?.description||'Unable to create Razorpay order.'});
  return send(res,200,{orderId:data.id,amount:data.amount,currency:data.currency,keyId,registrationFee:regFee/100,planFee:isTest?10:((plan==='monthly12'?5988:plan==='monthly24'?11976:plan==='year3'?3500:plan==='year6'?6000:plan==='lifetime'?15000:selected/100)),days:duration[plan]||0,test:isTest});
 }catch(error){console.error(error);return send(res,500,{error:'Unable to create payment order.'});}
}
