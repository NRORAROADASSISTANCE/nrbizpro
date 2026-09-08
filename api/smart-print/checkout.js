// Checkout summary contract. Payment capture must be implemented with a server-side gateway/webhook.
import { LICENSE_RULES } from './license.js';

export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const {type,baseAmount}=req.body||{};
 try{
  const amount=Number(baseAmount);
  if(!Number.isFinite(amount)||amount<0) throw new Error('Invalid amount');
  if(type==='registration') return res.status(200).json({type,baseAmount:amount,platformFee:0,total:amount,package:LICENSE_RULES.initialValidityYears});
  if(type==='renewal') return res.status(200).json({type,baseAmount:amount,platformFee:0,total:amount,validityYears:LICENSE_RULES.renewalValidityYears});
  return res.status(200).json({type,baseAmount:amount,platformFee:LICENSE_RULES.transactionFee,total:amount+LICENSE_RULES.transactionFee});
 }catch(e){return res.status(400).json({error:e.message});}
}
