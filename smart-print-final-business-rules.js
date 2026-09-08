/* NR BizPro Smart Print — FINAL BUSINESS MODEL
   Additive business configuration. Existing document/image processing must remain untouched.
*/
(function(){
  const FINAL_RULES=Object.freeze({
    package:{price:2000,validityYears:3,name:'Smart Print 3-Year Package'},
    renewal:{price:1000,validityYears:1,name:'Annual Renewal'},
    transaction:{platformFee:200,feeType:'fixed',currency:'INR'}
  });
  window.smartPrintFinalBusiness={
    RULES:FINAL_RULES,
    getInitialExpiry(from=new Date()){
      const d=new Date(from); d.setFullYear(d.getFullYear()+3); return d;
    },
    getRenewalExpiry(from=new Date()){
      const d=new Date(from); d.setFullYear(d.getFullYear()+1); return d;
    },
    calculateTransactionFee(){return FINAL_RULES.transaction.platformFee;},
    calculatePayable(baseAmount){
      const amount=Number(baseAmount); if(!Number.isFinite(amount)||amount<0) throw new Error('Invalid transaction amount');
      return amount+FINAL_RULES.transaction.platformFee;
    }
  };
})();