// Smart Print partner API: keep validation inside the deployed serverless function.
// This file intentionally contains the rules locally so the separate helper file
// does not consume another Vercel Hobby serverless-function slot.
const RULES=Object.freeze({
  distributorRegistration:{amount:2000,points:15000},
  directRetailerRegistration:{amount:1050,points:5000},
  distributorRetailer:{amount:600,distributorShare:500,platformFee:100,points:5000},
  recharge:{minimum:300,platformFee:100,points:3000},
  print:{points:10,platformRevenue:1}
});
function validateRegistration(type,amount){
  const r=RULES[type]; if(!r) throw new Error('Unsupported registration type');
  if(amount!==r.amount) throw new Error('Invalid registration amount'); return r;
}
function validateRecharge(amount){
  if(!Number.isFinite(amount)||amount<RULES.recharge.minimum) throw new Error('Minimum recharge is ₹300');
  return RULES.recharge;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const {action,partnerId,retailerId,registrationType,amount}=req.body||{};
  try {
    if(action==='validate-registration') return res.status(200).json({ok:true,rule:validateRegistration(registrationType,Number(amount))});
    if(action==='validate-recharge') return res.status(200).json({ok:true,rule:validateRecharge(Number(amount))});
    if(action==='map-retailer') {
      if(!partnerId||!retailerId) return res.status(400).json({error:'Distributor ID and Retailer ID are required'});
      return res.status(501).json({error:'Database adapter required before creating a live mapping'});
    }
    return res.status(400).json({error:'Unsupported action'});
  } catch(e){ return res.status(400).json({error:e.message}); }
}
