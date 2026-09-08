// Server-side license lifecycle contract for Smart Print.
export const LICENSE_RULES=Object.freeze({initialPrice:2000,initialValidityYears:3,renewalPrice:1000,renewalValidityYears:1,transactionFee:200});
export function createLicense(start=new Date()){const issuedAt=new Date(start);const expiresAt=new Date(issuedAt);expiresAt.setFullYear(expiresAt.getFullYear()+3);return {status:'active',issuedAt:issuedAt.toISOString(),expiresAt:expiresAt.toISOString(),price:2000};}
export function renewLicense(currentExpiry,now=new Date()){const base=new Date(Math.max(new Date(currentExpiry).getTime(),new Date(now).getTime()));const expiresAt=new Date(base);expiresAt.setFullYear(expiresAt.getFullYear()+1);return {status:'active',renewedAt:new Date(now).toISOString(),expiresAt:expiresAt.toISOString(),price:1000};}
export function isActive(expiresAt,now=new Date()){return new Date(expiresAt).getTime()>new Date(now).getTime();}
export function transactionTotal(baseAmount){const n=Number(baseAmount);if(!Number.isFinite(n)||n<0)throw new Error('Invalid amount');return n+200;}
