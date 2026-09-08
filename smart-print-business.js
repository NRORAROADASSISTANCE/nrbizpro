/* NR BizPro Smart Print — final commercial model. Printing pipeline is untouched. */
(function(){
 const KEY='nr-bizpro-smart-print-business-v2';
 const CONFIG=Object.freeze({registration:2000,registrationYears:3,renewal:1000,renewalYears:1,transactionFee:200});
 function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{"accounts":{},"ledger":[]}')}catch{return {accounts:{},ledger:[]}}}
 function write(x){localStorage.setItem(KEY,JSON.stringify(x));}
 function addLedger(x,e){x.ledger.push({...e,id:'TX'+Date.now()+Math.random().toString(36).slice(2,7),at:new Date().toISOString()});}
 function createAccount(id,role){if(!id)throw Error('Account ID required');const x=read();if(x.accounts[id])throw Error('Account already exists');const now=new Date(),exp=new Date(now);exp.setFullYear(exp.getFullYear()+3);x.accounts[id]={role,status:'active',issuedAt:now.toISOString(),expiresAt:exp.toISOString()};addLedger(x,{type:'REGISTRATION',accountId:id,role,amount:CONFIG.registration,validityYears:3,platformRevenue:CONFIG.registration});write(x);return x.accounts[id];}
 function renew(id){const x=read(),a=x.accounts[id];if(!a)throw Error('Account not found');const base=new Date(Math.max(Date.now(),new Date(a.expiresAt||0).getTime())),exp=new Date(base);exp.setFullYear(exp.getFullYear()+1);a.status='active';a.expiresAt=exp.toISOString();addLedger(x,{type:'RENEWAL',accountId:id,amount:CONFIG.renewal,validityYears:1,platformRevenue:CONFIG.renewal});write(x);return a;}
 function isActive(id){const x=read(),a=x.accounts[id];return !!a&&new Date(a.expiresAt)>new Date();}
 function chargeTransaction(id,baseAmount){if(!isActive(id))throw Error('Smart Print license is expired');const amount=Number(baseAmount);if(!Number.isFinite(amount)||amount<0)throw Error('Invalid amount');const x=read();addLedger(x,{type:'TRANSACTION',accountId:id,baseAmount:amount,platformFee:CONFIG.transactionFee,total:amount+CONFIG.transactionFee,platformRevenue:CONFIG.transactionFee});write(x);return {baseAmount:amount,platformFee:CONFIG.transactionFee,total:amount+CONFIG.transactionFee};}
 function dashboard(){const x=read();return {config:CONFIG,accounts:x.accounts,ledger:x.ledger,platformRevenue:x.ledger.reduce((s,e)=>s+(e.platformRevenue||0),0)};}
 window.nrSmartPrintBusiness={CONFIG,createAccount,createDistributor:(id)=>createAccount(id,'distributor'),createRetailer:(id)=>createAccount(id,'retailer'),renew,isActive,chargeTransaction,dashboard};
})();