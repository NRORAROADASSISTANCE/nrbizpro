/* NR BizPro Smart Print — business rules layer.
   Additive only: does not modify document/image processing. Production payments must be server-verified. */
(function(){
  const RULES=Object.freeze({
    distributorRegistration:{fee:2000,initialPoints:15000},
    directRetailerRegistration:{fee:1050,initialPoints:5000},
    distributorRetailerRegistration:{retailerCharge:600,distributorShare:500,platformFee:100,initialPoints:5000},
    recharge:{minimum:300,platformFee:100,points:3000},
    print:{points:10,platformRevenue:1},
    applicableTransactionPlatformFee:100
  });
  const key='nr-bizpro-smart-print-ledger-v1';
  function read(){try{return JSON.parse(localStorage.getItem(key)||'{"wallets":{},"transactions":[],"platformRevenue":0}')}catch{return {wallets:{},transactions:[],platformRevenue:0}}}
  function write(x){localStorage.setItem(key,JSON.stringify(x))}
  function ensureWallet(id,role){const d=read();d.wallets[id]??={role,points:0};write(d);return d.wallets[id]}
  function recordPrint(id){const d=read(),w=d.wallets[id];if(!w||w.points<RULES.print.points)throw new Error('Insufficient points');w.points-=RULES.print.points;d.platformRevenue+=RULES.print.platformRevenue;d.transactions.push({type:'print',userId:id,points:10,platformRevenue:1,at:new Date().toISOString()});write(d);return w}
  function recordRecharge(id,amount){if(amount<RULES.recharge.minimum)throw new Error('Minimum recharge is ₹300');const d=read(),w=d.wallets[id]||{role:'retailer',points:0};w.points+=RULES.recharge.points;d.wallets[id]=w;d.platformRevenue+=RULES.recharge.platformFee;d.transactions.push({type:'recharge',userId:id,amount,platformFee:RULES.recharge.platformFee,points:RULES.recharge.points,at:new Date().toISOString()});write(d);return w}
  window.smartPrintBusiness={RULES,ensureWallet,recordPrint,recordRecharge};
})();