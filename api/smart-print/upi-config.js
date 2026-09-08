// Smart Print UPI payment configuration.
// Use a PCI/RBI-compliant payment gateway; never store UPI PINs or payment secrets in the frontend.
export const UPI_CONFIG=Object.freeze({
 provider:'Razorpay',
 currency:'INR',
 methods:['upi_intent','upi_qr'],
 transactionFee:200,
 registration:{amount:2000,validityYears:3},
 renewal:{amount:1000,validityYears:1},
 verification:'server_webhook_signature'
});

export function buildCheckoutAmount(type,baseAmount){
 const amount=Number(baseAmount); if(!Number.isFinite(amount)||amount<0) throw new Error('Invalid amount');
 if(type==='registration' && amount!==2000) throw new Error('Registration must be ₹2,000');
 if(type==='renewal' && amount!==1000) throw new Error('Renewal must be ₹1,000');
 return type==='registration'||type==='renewal' ? amount : amount+UPI_CONFIG.transactionFee;
}
