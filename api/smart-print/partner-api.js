// Smart Print partner API contract: server-authoritative registration and mapping.
import { RULES, validateRegistration, validateRecharge } from './partner-rules.js';

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
