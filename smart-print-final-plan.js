/* Final Smart Print commercial gate. Business rules only; processing pipeline remains untouched. */
(function(){
 const PLAN=Object.freeze({registration:{amount:2000,years:3},renewal:{amount:1000,years:1},transactionFee:200});
 function licenseActive(expiresAt){return !!expiresAt&&new Date(expiresAt)>new Date();}
 function transactionCharge(baseAmount){const n=Number(baseAmount);if(!Number.isFinite(n)||n<0)throw new Error('Invalid transaction amount');return {baseAmount:n,platformFee:PLAN.transactionFee,total:n+PLAN.transactionFee};}
 window.smartPrintFinalPlan={PLAN,licenseActive,transactionCharge};
})();