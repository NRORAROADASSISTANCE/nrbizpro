import crypto from 'node:crypto';
function send(res, code, body) { res.setHeader('Content-Type','application/json'); res.status(code).json(body); }
export default async function handler(req,res){
 if(req.method!=='POST') return send(res,405,{error:'Method not allowed'});
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
