// Smart Print final transaction-fee contract.
// Production implementation must calculate this server-side after authentication.
export const SMART_PRINT_TRANSACTION_FEE = 200;
export function calculatePlatformFee(){ return SMART_PRINT_TRANSACTION_FEE; }
export function calculateCustomerPayable(baseAmount){
 const n=Number(baseAmount);
 if(!Number.isFinite(n)||n<0) throw new Error('Invalid transaction amount');
 return n + SMART_PRINT_TRANSACTION_FEE;
}
export function buildTransactionLedger({transactionId,partnerId,baseAmount}){
 if(!transactionId||!partnerId) throw new Error('transactionId and partnerId are required');
 const amount=Number(baseAmount);
 if(!Number.isFinite(amount)||amount<0) throw new Error('Invalid transaction amount');
 return {transactionId,partnerId,baseAmount:amount,platformFee:SMART_PRINT_TRANSACTION_FEE,total:amount+SMART_PRINT_TRANSACTION_FEE,currency:'INR'};
}
