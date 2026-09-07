// Production contract: replace client-only points accounting with an atomic server ledger.
export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const {type,userId,amount,points,transactionId}=req.body||{};
 if(!transactionId||!userId||!type) return res.status(400).json({error:'transactionId, userId and type are required'});
 // IMPORTANT: real implementation must authenticate the session, load wallet from DB,
 // enforce role/amount rules server-side, and commit wallet + ledger atomically.
 // Never trust points, fees, role, or revenue values supplied by the browser.
 return res.status(501).json({error:'Server payment/database adapter not configured yet',received:{type,userId,amount,points,transactionId}});
}
